import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { failInterruptedRepairStates, InvalidTransitionError, recordInitialRepairState, transitionRepairState } from '../lifecycle.js';

function createLifecycleDatabase(location = ':memory:') {
  const db = new DatabaseSync(location);
  db.exec(`
    CREATE TABLE sessions (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      lifecycle_state TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      test_passed INTEGER NOT NULL DEFAULT 0,
      source_path TEXT NOT NULL
    );
    CREATE TABLE audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  return db;
}

function insertSession(db, id = 'session-1', state = 'ANALYZING') {
  db.prepare(`INSERT INTO sessions (id, status, lifecycle_state, created_at, updated_at, test_passed, source_path)
    VALUES (?, 'diagnosing', ?, '2026-11-01T00:00:00.000Z', '2026-11-01T00:00:00.000Z', 0, '/demo')`)
    .run(id, state);
  recordInitialRepairState(db, id, state, '2026-11-01T00:00:00.000Z');
}

test('repair lifecycle permits the verified approval and rollback path', () => {
  const db = createLifecycleDatabase();
  insertSession(db);
  for (const state of ['ISSUE_DETECTED', 'REPAIRING', 'VERIFYING', 'PREVIEW_READY', 'AWAITING_APPROVAL', 'APPROVED', 'COMMITTED', 'ROLLED_BACK']) {
    transitionRepairState(db, 'session-1', state, { timestamp: '2026-11-01T00:01:00.000Z' });
  }
  assert.equal(db.prepare('SELECT lifecycle_state, status FROM sessions WHERE id = ?').get('session-1').lifecycle_state, 'ROLLED_BACK');
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM audit_log WHERE session_id = ?').get('session-1').count, 9);
  db.close();
});

test('repair lifecycle rejects invalid transitions without changing state or history', () => {
  const db = createLifecycleDatabase();
  insertSession(db);
  assert.throws(() => transitionRepairState(db, 'session-1', 'COMMITTED'), InvalidTransitionError);
  assert.equal(db.prepare('SELECT lifecycle_state FROM sessions WHERE id = ?').get('session-1').lifecycle_state, 'ANALYZING');
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM audit_log WHERE session_id = ?').get('session-1').count, 1);
  db.close();
});

test('project and repair lifecycle records persist after reopening SQLite', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'phoenix-lifecycle-'));
  const filename = path.join(directory, 'phoenix.sqlite');
  try {
    let db = createLifecycleDatabase(filename);
    db.exec(`CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL, lifecycle_state TEXT NOT NULL, created_at TEXT NOT NULL);`);
    db.prepare('INSERT INTO projects VALUES (?, ?, ?, ?)').run('project-1', 'Imported site', 'IMPORTED', '2026-11-01T00:00:00.000Z');
    insertSession(db);
    transitionRepairState(db, 'session-1', 'ISSUE_DETECTED');
    db.close();

    db = new DatabaseSync(filename);
    assert.equal(db.prepare('SELECT lifecycle_state FROM projects WHERE id = ?').get('project-1').lifecycle_state, 'IMPORTED');
    assert.equal(db.prepare('SELECT lifecycle_state FROM sessions WHERE id = ?').get('session-1').lifecycle_state, 'ISSUE_DETECTED');
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM audit_log WHERE session_id = ?').get('session-1').count, 2);
    db.close();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('interrupted repair states become failed after restart recovery', () => {
  const db = createLifecycleDatabase();
  insertSession(db);
  const recovered = failInterruptedRepairStates(db, '2026-11-01T00:02:00.000Z');
  assert.equal(recovered, 1);
  const session = db.prepare('SELECT lifecycle_state, status, test_passed FROM sessions WHERE id = ?').get('session-1');
  assert.deepEqual({ ...session }, { lifecycle_state: 'FAILED', status: 'verification_failed', test_passed: 0 });
  const lastEvent = db.prepare('SELECT details FROM audit_log ORDER BY id DESC LIMIT 1').get();
  assert.match(lastEvent.details, /application_restarted_during_repair/);
  db.close();
});
