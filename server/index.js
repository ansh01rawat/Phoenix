import express from 'express';
import { createHash, randomUUID } from 'node:crypto';
import { cp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { verifyInteraction } from './verify.js';
import { detectProjectMetadata, projectDisplayName, validateProjectFiles } from './projects.js';
import { InvalidTransitionError, allowedRepairTransitions, failInterruptedRepairStates, recordInitialRepairState, stateForLegacyStatus, transitionRepairState } from './lifecycle.js';
import { isPermittedLocalOrigin } from './security.js';
import { createOpenAiProvider } from './openai-provider.js';
import { getOpenAiPricingConfig } from './openai-provider.js';
import { estimateRepairBudget } from './repair-orchestrator.js';
import { createSandboxVersion, getSandboxVersion, listSandboxVersions, restoreSandboxVersion } from './versions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const demoSource = path.join(__dirname, 'demo-site');
const dataRoot = path.join(projectRoot, '.phoenix');
const sandboxRoot = path.join(dataRoot, 'sandboxes');
const projectsRoot = path.join(dataRoot, 'projects');
const versionsRoot = path.join(dataRoot, 'versions');
await mkdir(dataRoot, { recursive: true });
await mkdir(sandboxRoot, { recursive: true });
await mkdir(projectsRoot, { recursive: true });
await mkdir(versionsRoot, { recursive: true });
const db = new DatabaseSync(path.join(dataRoot, 'phoenix.sqlite'));
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    lifecycle_state TEXT NOT NULL DEFAULT 'ANALYZING',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    test_passed INTEGER NOT NULL DEFAULT 0,
    source_path TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    lifecycle_state TEXT NOT NULL DEFAULT 'IMPORTED',
    framework TEXT NOT NULL DEFAULT 'unknown',
    entry_point TEXT,
    package_manager TEXT NOT NULL DEFAULT 'unknown',
    created_at TEXT NOT NULL,
    source_path TEXT NOT NULL,
    sandbox_path TEXT NOT NULL,
    file_count INTEGER NOT NULL,
    total_bytes INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS project_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

function ensureColumn(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (columns.some((item) => item.name === column)) return false;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  return true;
}

const addedSessionLifecycle = ensureColumn('sessions', 'lifecycle_state', "TEXT NOT NULL DEFAULT 'ANALYZING'");
ensureColumn('projects', 'lifecycle_state', "TEXT NOT NULL DEFAULT 'IMPORTED'");
ensureColumn('projects', 'framework', "TEXT NOT NULL DEFAULT 'unknown'");
ensureColumn('projects', 'entry_point', 'TEXT');
ensureColumn('projects', 'package_manager', "TEXT NOT NULL DEFAULT 'unknown'");
if (addedSessionLifecycle) {
  const legacyStates = {
    diagnosing: 'ANALYZING', repairing: 'REPAIRING', testing: 'VERIFYING',
    ready_for_review: 'AWAITING_APPROVAL', approved: 'COMMITTED', rejected: 'REJECTED',
    verification_failed: 'FAILED', rolled_back: 'ROLLED_BACK',
  };
  const migrateState = db.prepare('UPDATE sessions SET lifecycle_state = ? WHERE status = ?');
  for (const [status, state] of Object.entries(legacyStates)) migrateState.run(state, status);
}

const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.path.startsWith('/api/')) {
    const origin = req.get('origin');
    if (origin && !isPermittedLocalOrigin(origin)) return res.status(403).json({ error: 'Phoenix accepts browser actions only from a local origin.' });
  }
  next();
});
app.use(express.json({ limit: '32mb' }));
const insertAudit = db.prepare('INSERT INTO audit_log (session_id, action, details, created_at) VALUES (?, ?, ?, ?)');
const getSession = db.prepare('SELECT * FROM sessions WHERE id = ?');
function audit(sessionId, action, details = {}) {
  insertAudit.run(sessionId, action, JSON.stringify(details), new Date().toISOString());
}

function latestAuditDetails(sessionId, action) {
  const entry = db.prepare('SELECT details, created_at FROM audit_log WHERE session_id = ? AND action = ? ORDER BY id DESC LIMIT 1')
    .get(sessionId, action);
  return entry ? { ...JSON.parse(entry.details), createdAt: entry.created_at } : null;
}

function sessionResponse(sessionId) {
  const session = getSession.get(sessionId);
  if (!session) return null;
  const entries = db.prepare('SELECT action, details, created_at FROM audit_log WHERE session_id = ? ORDER BY id').all(sessionId);
  const state = session.lifecycle_state || stateForLegacyStatus(session.status);
  const proposedPatch = latestAuditDetails(sessionId, 'patch_proposed');
  return {
    id: session.id,
    status: session.status,
    state,
    updatedAt: session.updated_at,
    allowedTransitions: allowedRepairTransitions(state),
    createdAt: session.created_at,
    testPassed: Boolean(session.test_passed),
    previewUrl: ['PREVIEW_READY', 'AWAITING_APPROVAL', 'APPROVED', 'COMMITTED'].includes(state) ? `/preview/${session.id}/` : null,
    explanation: state === 'FAILED'
      ? 'The proposed repair did not pass its interaction check. Approval is unavailable; try the demo again or reject this attempt.'
      : 'The visit button had an invalid selector, so it could not respond. The sandbox repair corrected the selector and the interaction check passed.',
    diff: proposedPatch?.patch?.diff || null,
    audit: entries.map((entry) => ({ action: entry.action, details: JSON.parse(entry.details), createdAt: entry.created_at })),
  };
}

failInterruptedRepairStates(db);
for (const session of db.prepare("SELECT * FROM sessions WHERE lifecycle_state = 'APPROVED'").all()) {
  const sandbox = path.join(sandboxRoot, session.id);
  try {
    const [current, proposed, baseline] = await Promise.all([
      readFile(path.join(session.source_path, 'app.js'), 'utf8'),
      readFile(path.join(sandbox, 'app.js'), 'utf8'),
      readFile(path.join(sandbox, '.rollback-app.js'), 'utf8'),
    ]);
    if (current === proposed) {
      transitionRepairState(db, session.id, 'COMMITTED', { details: { recoveredAfterRestart: true } });
      audit(session.id, 'user_approved_and_applied', { file: 'app.js', destination: 'bundled_demo_source', recoveredAfterRestart: true });
    } else {
      transitionRepairState(db, session.id, 'FAILED', {
        details: { reason: current === baseline ? 'commit_interrupted_before_source_update' : 'source_conflict_after_restart' },
      });
    }
  } catch {
    transitionRepairState(db, session.id, 'FAILED', { details: { reason: 'commit_recovery_files_unavailable' } });
  }
}

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'phoenix' }));
app.get('/api/ai/status', (_req, res) => {
  const provider = createOpenAiProvider();
  const pricing = getOpenAiPricingConfig();
  res.json({
    configured: Boolean(provider),
    model: provider?.model || null,
    pricingConfigured: pricing.inputUsdPerMillion !== null && pricing.outputUsdPerMillion !== null,
    keyRequiredOnServer: true,
  });
});

app.post('/api/ai/budget-estimate', (req, res) => {
  try {
    const estimate = estimateRepairBudget({
      diagnostic: req.body?.diagnostic,
      sourceFiles: req.body?.sourceFiles,
      maxAttempts: req.body?.maxAttempts ?? 1,
    });
    res.json(estimate);
  } catch (error) {
    res.status(400).json({ error: error.message, code: 'INVALID_BUDGET_ESTIMATE_INPUT' });
  }
});

app.get('/api/projects', (_req, res) => {
  const projects = db.prepare('SELECT id, name, lifecycle_state, framework, entry_point, package_manager, created_at, file_count, total_bytes FROM projects ORDER BY created_at DESC').all();
  res.json(projects.map((project) => ({
    id: project.id,
    name: project.name,
    state: project.lifecycle_state,
    framework: project.framework,
    entryPoint: project.entry_point,
    packageManager: project.package_manager,
    createdAt: project.created_at,
    fileCount: project.file_count,
    totalBytes: project.total_bytes,
  })));
});

app.post('/api/projects/import', async (req, res, next) => {
  let projectDirectory;
  try {
    const imported = validateProjectFiles(req.body.files);
    const metadata = detectProjectMetadata(imported.files);
    const id = randomUUID();
    const name = projectDisplayName(req.body.name);
    projectDirectory = path.join(projectsRoot, id);
    const sourcePath = path.join(projectDirectory, 'source');
    const sandboxPath = path.join(projectDirectory, 'sandbox');
    await mkdir(sourcePath, { recursive: true });
    for (const file of imported.files) {
      const segments = file.path.split('/');
      const destination = path.join(sourcePath, ...segments);
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, file.contents, { flag: 'wx' });
    }
    await cp(sourcePath, sandboxPath, { recursive: true, errorOnExist: true });
    const createdAt = new Date().toISOString();
    db.prepare('INSERT INTO projects (id, name, lifecycle_state, framework, entry_point, package_manager, created_at, source_path, sandbox_path, file_count, total_bytes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, name, 'IMPORTED', metadata.framework, metadata.entryPoint, metadata.packageManager, createdAt, sourcePath, sandboxPath, imported.files.length, imported.totalBytes);
    db.prepare('INSERT INTO project_audit (project_id, action, details, created_at) VALUES (?, ?, ?, ?)')
      .run(id, 'source_imported', JSON.stringify({ fileCount: imported.files.length, skippedCount: imported.skippedCount }), createdAt);
    res.status(201).json({
      id,
      name,
      state: 'IMPORTED',
      ...metadata,
      createdAt,
      fileCount: imported.files.length,
      totalBytes: imported.totalBytes,
      skippedCount: imported.skippedCount,
      sandboxReady: true,
      message: 'Phoenix saved an untouched source copy and created a separate sandbox copy. Imported code is not run.',
    });
  } catch (error) {
    if (projectDirectory) await rm(projectDirectory, { recursive: true, force: true });
    if (error instanceof SyntaxError) return res.status(400).json({ error: 'Phoenix could not read that folder upload.' });
    if (error?.type === 'entity.too.large') return res.status(413).json({ error: 'The folder upload is too large. Keep it under 20 MB.' });
    if (error instanceof Error && /folder|file|path|duplicate|private|generated|20 MB|200 files|could not read/i.test(error.message)) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

app.get('/api/projects/:id', (req, res) => {
  const project = db.prepare('SELECT id, name, lifecycle_state, framework, entry_point, package_manager, created_at, file_count, total_bytes FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Imported project not found.' });
  const events = db.prepare('SELECT action, details, created_at FROM project_audit WHERE project_id = ? ORDER BY id').all(project.id);
  res.json({
    id: project.id,
    name: project.name,
    state: project.lifecycle_state,
    framework: project.framework,
    entryPoint: project.entry_point,
    packageManager: project.package_manager,
    createdAt: project.created_at,
    fileCount: project.file_count,
    totalBytes: project.total_bytes,
    sandboxReady: true,
    audit: events.map((event) => ({ action: event.action, details: JSON.parse(event.details), createdAt: event.created_at })),
  });
});

app.post('/api/sessions', async (_req, res, next) => {
  let createdSessionId;
  try {
    const id = randomUUID();
    createdSessionId = id;
    const sandbox = path.join(sandboxRoot, id);
    await cp(demoSource, sandbox, { recursive: true, errorOnExist: true });
    const timestamp = new Date().toISOString();
    db.prepare('INSERT INTO sessions (id, status, lifecycle_state, created_at, updated_at, test_passed, source_path) VALUES (?, ?, ?, ?, ?, 0, ?)')
      .run(id, 'diagnosing', 'ANALYZING', timestamp, timestamp, demoSource);
    recordInitialRepairState(db, id, 'ANALYZING', timestamp);
    audit(id, 'sandbox_created', { source: 'bundled_demo', sandboxId: id });
    const initialVersion = await createSandboxVersion({
      versionsRoot,
      sessionId: id,
      sandboxPath: sandbox,
      label: 'Imported baseline',
      files: ['index.html', 'app.js'],
    });
    audit(id, 'version_created', { versionId: initialVersion.id, sequence: initialVersion.sequence, label: initialVersion.label });

    audit(id, 'diagnostic_created', {
      issues: [{
        id: 'northstar-visit-button-selector',
        category: 'interaction',
        severity: 'high',
        affectedFile: 'app.js',
        evidence: "The visit button query uses '#visit-btn', which does not match the demo page's '#visit-button' element.",
        description: 'The Visit Us button does not respond because its selector does not match the page.',
        suggestedRepair: 'Update the selector to match the button ID in the page.',
        confirmed: true,
      }],
    });

    transitionRepairState(db, id, 'ISSUE_DETECTED', { details: { issue: 'visit_button_selector_mismatch' } });
    transitionRepairState(db, id, 'REPAIRING');

    const appFile = path.join(sandbox, 'app.js');
    const original = await readFile(appFile, 'utf8');
    const brokenSelector = "document.querySelector('#visit-btn')";
    if (!original.includes(brokenSelector)) throw new Error('Demo failure fixture no longer matches the expected bug.');
    const repaired = original.replace(brokenSelector, "document.querySelector('#visit-button')");
    const patch = {
      id: 'northstar-visit-button-selector-fix',
      file: 'app.js',
      beforeHash: createHash('sha256').update(original).digest('hex'),
      afterHash: createHash('sha256').update(repaired).digest('hex'),
      diff: '- document.querySelector("#visit-btn")\n+ document.querySelector("#visit-button")',
      reason: 'Match the Visit Us button selector to the element ID in index.html.',
    };
    audit(id, 'patch_proposed', { patch });
    await writeFile(appFile, repaired, 'utf8');
    audit(id, 'sandbox_repair_applied', { file: 'app.js', change: 'Corrected the visit button selector.' });
    const proposedVersion = await createSandboxVersion({
      versionsRoot,
      sessionId: id,
      sandboxPath: sandbox,
      label: 'Proposed repair',
      files: ['index.html', 'app.js'],
      parentVersionId: initialVersion.id,
    });
    audit(id, 'version_created', { versionId: proposedVersion.id, sequence: proposedVersion.sequence, label: proposedVersion.label });
    transitionRepairState(db, id, 'VERIFYING');

    const testPassed = await verifyInteraction(repaired);
    audit(id, 'verification_completed', {
      passed: testPassed,
      requiredChecks: [{ name: 'visit_button_shows_message', passed: testPassed }],
      blockingRegressions: [],
    });
    if (testPassed) {
      transitionRepairState(db, id, 'PREVIEW_READY');
      transitionRepairState(db, id, 'AWAITING_APPROVAL');
    } else {
      transitionRepairState(db, id, 'FAILED', { details: { reason: 'interaction_verification_failed' } });
    }
    audit(id, testPassed ? 'verification_passed' : 'verification_failed', { test: 'visit_button_shows_message', passed: testPassed });
    res.status(201).json(sessionResponse(id));
  } catch (error) {
    const interrupted = createdSessionId && getSession.get(createdSessionId);
    if (interrupted && ['ANALYZING', 'ISSUE_DETECTED', 'REPAIRING', 'VERIFYING', 'PREVIEW_READY', 'AWAITING_APPROVAL'].includes(interrupted.lifecycle_state)) {
      transitionRepairState(db, createdSessionId, 'FAILED', { details: { reason: 'repair_operation_failed' } });
    }
    next(error);
  }
});

app.get('/api/sessions/:id', (req, res) => {
  const result = sessionResponse(req.params.id);
  if (!result) return res.status(404).json({ error: 'Repair session not found.' });
  res.json(result);
});

app.get('/api/sessions/:id/diagnostics', (req, res) => {
  const session = getSession.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Repair session not found.' });
  const report = latestAuditDetails(session.id, 'diagnostic_created');
  if (!report) return res.status(404).json({ error: 'Diagnostic results are not available.' });
  res.json({ sessionId: session.id, ...report });
});

app.get('/api/sessions/:id/progress', (req, res) => {
  const session = getSession.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Repair session not found.' });
  const events = db.prepare('SELECT action, details, created_at FROM audit_log WHERE session_id = ? ORDER BY id').all(session.id);
  res.json({
    sessionId: session.id,
    state: session.lifecycle_state,
    updatedAt: session.updated_at,
    events: events.map((entry) => ({ action: entry.action, details: JSON.parse(entry.details), createdAt: entry.created_at })),
  });
});

app.get('/api/sessions/:id/patches', (req, res) => {
  const session = getSession.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Repair session not found.' });
  const patch = latestAuditDetails(session.id, 'patch_proposed');
  if (!patch) return res.status(404).json({ error: 'No proposed patch is available.' });
  res.json({ sessionId: session.id, patches: [patch.patch] });
});

app.get('/api/sessions/:id/verification', (req, res) => {
  const session = getSession.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Repair session not found.' });
  const result = latestAuditDetails(session.id, 'verification_completed');
  if (!result) return res.status(404).json({ error: 'Verification results are not available.' });
  res.json({ sessionId: session.id, ...result });
});

app.get('/api/sessions/:id/preview', (req, res) => {
  const session = getSession.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Repair session not found.' });
  const available = ['PREVIEW_READY', 'AWAITING_APPROVAL', 'APPROVED', 'COMMITTED'].includes(session.lifecycle_state);
  res.json({
    sessionId: session.id,
    available,
    url: available ? `/preview/${session.id}/` : null,
    isolated: true,
  });
});

app.get('/api/sessions/:id/versions', async (req, res, next) => {
  try {
    const session = getSession.get(req.params.id);
    if (!session) return res.status(404).json({ error: 'Repair session not found.' });
    const versions = await listSandboxVersions({ versionsRoot, sessionId: session.id });
    res.json({ sessionId: session.id, versions });
  } catch (error) {
    next(error);
  }
});

app.get('/api/sessions/:id/versions/:versionId', async (req, res, next) => {
  try {
    const session = getSession.get(req.params.id);
    if (!session) return res.status(404).json({ error: 'Repair session not found.' });
    const version = await getSandboxVersion({ versionsRoot, sessionId: session.id, versionId: req.params.versionId });
    res.json({ sessionId: session.id, version });
  } catch (error) {
    if (error.code === 'VERSION_NOT_FOUND') return res.status(404).json({ error: error.message });
    next(error);
  }
});

app.post('/api/sessions/:id/versions/:versionId/restore', async (req, res, next) => {
  try {
    const session = getSession.get(req.params.id);
    if (!session) return res.status(404).json({ error: 'Repair session not found.' });
    if (session.lifecycle_state !== 'AWAITING_APPROVAL' || !session.test_passed) {
      return res.status(409).json({ error: 'Only a verified sandbox version can be restored before approval.' });
    }
    const restored = await restoreSandboxVersion({
      versionsRoot,
      sessionId: session.id,
      sandboxPath: path.join(sandboxRoot, session.id),
      versionId: req.params.versionId,
    });
    transitionRepairState(db, session.id, 'FAILED', { details: { reason: 'sandbox_version_restored', versionId: req.params.versionId } });
    audit(session.id, 'version_restored', { versionId: req.params.versionId, restoredVersionId: restored.restoredVersion.id, changedFiles: restored.changedFiles });
    res.json({
      session: sessionResponse(session.id),
      restoredVersion: restored.restoredVersion,
      versions: await listSandboxVersions({ versionsRoot, sessionId: session.id }),
      message: 'Sandbox version restored. Verification was invalidated; this repair cannot be approved until it is verified again.',
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/sessions/:id/approve', async (req, res, next) => {
  try {
    const session = getSession.get(req.params.id);
    if (!session) return res.status(404).json({ error: 'Repair session not found.' });
    if (session.lifecycle_state !== 'AWAITING_APPROVAL' || !session.test_passed) {
      return res.status(409).json({ error: 'Only a verified repair can be approved.' });
    }
    const sandbox = path.join(sandboxRoot, session.id);
    const repaired = await readFile(path.join(sandbox, 'app.js'), 'utf8');
    const testPassed = await verifyInteraction(repaired);
    if (!testPassed) {
      transitionRepairState(db, session.id, 'FAILED', { details: { reason: 'approval_recheck_failed' } });
      audit(session.id, 'verification_failed', { test: 'approval_recheck', passed: false });
      return res.status(409).json({ error: 'Verification no longer passes. Approval is blocked.' });
    }
    const originalFile = path.join(session.source_path, 'app.js');
    const currentOriginal = await readFile(originalFile, 'utf8');
    const knownBaseline = currentOriginal.includes("document.querySelector('#visit-btn')");
    if (!knownBaseline) {
      transitionRepairState(db, session.id, 'FAILED', { details: { reason: 'source_changed_since_repair' } });
      audit(session.id, 'source_conflict', { file: 'app.js' });
      return res.status(409).json({ error: 'The source changed since repair. Re-import before approving.' });
    }
    await writeFile(path.join(sandbox, '.rollback-app.js'), currentOriginal, 'utf8');
    transitionRepairState(db, session.id, 'APPROVED');
    const pendingFile = path.join(sandbox, '.approved-app.js.tmp');
    try {
      await writeFile(pendingFile, repaired, 'utf8');
      await rename(pendingFile, originalFile);
      transitionRepairState(db, session.id, 'COMMITTED');
    } catch (error) {
      const current = await readFile(originalFile, 'utf8').catch(() => null);
      if (current === repaired) {
        const restoreFile = path.join(sandbox, '.interrupted-commit-restore.tmp');
        await writeFile(restoreFile, currentOriginal, 'utf8');
        await rename(restoreFile, originalFile);
      }
      if (db.prepare('SELECT lifecycle_state FROM sessions WHERE id = ?').get(session.id)?.lifecycle_state === 'APPROVED') {
        transitionRepairState(db, session.id, 'FAILED', { details: { reason: 'commit_failed_source_restored' } });
      }
      throw error;
    }
    audit(session.id, 'user_approved_and_applied', { file: 'app.js', destination: 'bundled_demo_source' });
    res.json(sessionResponse(session.id));
  } catch (error) {
    next(error);
  }
});

app.post('/api/sessions/:id/rollback', async (req, res, next) => {
  try {
    const session = getSession.get(req.params.id);
    if (!session) return res.status(404).json({ error: 'Repair session not found.' });
    if (session.lifecycle_state !== 'COMMITTED') return res.status(409).json({ error: 'Only a committed repair can be rolled back.' });
    const sandbox = path.join(sandboxRoot, session.id);
    const baseline = await readFile(path.join(sandbox, '.rollback-app.js'), 'utf8');
    const originalFile = path.join(session.source_path, 'app.js');
    const current = await readFile(originalFile, 'utf8');
    const approvedVersion = await readFile(path.join(sandbox, 'app.js'), 'utf8');
    if (current !== approvedVersion) return res.status(409).json({ error: 'The source changed after approval. Rollback was not applied.' });
    const restoreFile = path.join(sandbox, '.rollback-restore.tmp');
    await writeFile(restoreFile, baseline, 'utf8');
    await rename(restoreFile, originalFile);
    transitionRepairState(db, session.id, 'ROLLED_BACK');
    audit(session.id, 'user_rolled_back', { file: 'app.js' });
    res.json(sessionResponse(session.id));
  } catch (error) {
    next(error);
  }
});

app.post('/api/sessions/:id/reject', async (req, res, next) => {
  try {
    const session = getSession.get(req.params.id);
    if (!session) return res.status(404).json({ error: 'Repair session not found.' });
    if (session.lifecycle_state === 'REJECTED') return res.json(sessionResponse(session.id));
    if (!['PREVIEW_READY', 'AWAITING_APPROVAL', 'FAILED'].includes(session.lifecycle_state)) {
      return res.status(409).json({ error: 'This repair session cannot be rejected from its current state.' });
    }
    transitionRepairState(db, session.id, 'REJECTED');
    audit(session.id, 'user_rejected', { sandboxDiscarded: true });
    await rm(path.join(sandboxRoot, session.id), { recursive: true, force: true });
    res.json(sessionResponse(session.id));
  } catch (error) {
    next(error);
  }
});

async function previewFile(req, res, next) {
  try {
    const session = getSession.get(req.params.id);
    if (!session || !['PREVIEW_READY', 'AWAITING_APPROVAL', 'APPROVED', 'COMMITTED'].includes(session.lifecycle_state)) {
      return res.status(404).send('Preview is unavailable.');
    }
    const file = req.params.file || 'index.html';
    if (!['index.html', 'app.js'].includes(file)) return res.status(404).send('Preview file not found.');
    const contents = await readFile(path.join(sandboxRoot, session.id, file));
    res.set({
      'Content-Security-Policy': "default-src 'self' data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'none'; form-action 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'",
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    });
    res.type(file.endsWith('.js') ? 'application/javascript' : 'text/html').send(contents);
  } catch (error) {
    next(error);
  }
}
app.get('/preview/:id', previewFile);
app.get('/preview/:id/:file', previewFile);

app.use(express.static(path.join(projectRoot, 'dist')));

app.use((error, _req, res, _next) => {
  if (error instanceof InvalidTransitionError) return res.status(error.statusCode).json({ error: error.message, from: error.from, to: error.to });
  if (Number.isInteger(error?.statusCode) && error.statusCode >= 400 && error.statusCode < 600) {
    return res.status(error.statusCode).json({ error: error.message, code: error.code || 'REQUEST_FAILED' });
  }
  if (error?.type === 'entity.too.large') return res.status(413).json({ error: 'The folder upload is too large. Keep it under 20 MB.' });
  if (error instanceof SyntaxError) return res.status(400).json({ error: 'Phoenix could not read that folder upload.' });
  console.error(error);
  res.status(500).json({ error: 'Phoenix could not complete this repair session.' });
});

const port = Number(process.env.PORT || 3001);
const server = app.listen(port, 'localhost', () => console.log(`Phoenix API listening on http://localhost:${port}`));

export { app, server };
