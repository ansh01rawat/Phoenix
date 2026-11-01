export const REPAIR_STATES = Object.freeze([
  'IMPORTED',
  'ANALYZING',
  'ISSUE_DETECTED',
  'REPAIRING',
  'VERIFYING',
  'PREVIEW_READY',
  'AWAITING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'COMMITTED',
  'FAILED',
  'ROLLED_BACK',
]);

const allowedTransitions = Object.freeze({
  IMPORTED: ['ANALYZING', 'FAILED'],
  ANALYZING: ['ISSUE_DETECTED', 'FAILED'],
  ISSUE_DETECTED: ['REPAIRING', 'FAILED'],
  REPAIRING: ['VERIFYING', 'FAILED'],
  VERIFYING: ['PREVIEW_READY', 'FAILED'],
  PREVIEW_READY: ['AWAITING_APPROVAL', 'REJECTED', 'FAILED'],
  AWAITING_APPROVAL: ['APPROVED', 'REJECTED', 'FAILED'],
  APPROVED: ['COMMITTED', 'FAILED'],
  REJECTED: [],
  COMMITTED: ['ROLLED_BACK'],
  FAILED: ['REJECTED'],
  ROLLED_BACK: [],
});

const legacyStatusByState = Object.freeze({
  IMPORTED: 'imported',
  ANALYZING: 'diagnosing',
  ISSUE_DETECTED: 'diagnosing',
  REPAIRING: 'repairing',
  VERIFYING: 'testing',
  PREVIEW_READY: 'ready_for_review',
  AWAITING_APPROVAL: 'ready_for_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMMITTED: 'approved',
  FAILED: 'verification_failed',
  ROLLED_BACK: 'rolled_back',
});

const stateByLegacyStatus = Object.freeze({
  imported: 'IMPORTED',
  diagnosing: 'ANALYZING',
  repairing: 'REPAIRING',
  testing: 'VERIFYING',
  ready_for_review: 'AWAITING_APPROVAL',
  approved: 'COMMITTED',
  rejected: 'REJECTED',
  verification_failed: 'FAILED',
  rolled_back: 'ROLLED_BACK',
});

export class InvalidTransitionError extends Error {
  constructor(from, to) {
    super(`Repair cannot transition from ${from} to ${to}.`);
    this.name = 'InvalidTransitionError';
    this.statusCode = 409;
    this.from = from;
    this.to = to;
  }
}

export function stateForLegacyStatus(status) {
  return stateByLegacyStatus[status] || 'FAILED';
}

export function recordInitialRepairState(db, sessionId, state, timestamp = new Date().toISOString()) {
  if (!REPAIR_STATES.includes(state)) throw new Error(`Unknown repair state: ${state}`);
  db.prepare('INSERT INTO audit_log (session_id, action, details, created_at) VALUES (?, ?, ?, ?)')
    .run(sessionId, 'state_transition', JSON.stringify({ from: null, to: state }), timestamp);
}

export function transitionRepairState(db, sessionId, toState, { details = {}, timestamp = new Date().toISOString() } = {}) {
  if (!REPAIR_STATES.includes(toState)) throw new Error(`Unknown repair state: ${toState}`);
  db.exec('BEGIN IMMEDIATE');
  try {
    const session = db.prepare('SELECT lifecycle_state, status FROM sessions WHERE id = ?').get(sessionId);
    if (!session) throw new Error('Repair session not found.');
    const fromState = session.lifecycle_state || stateForLegacyStatus(session.status);
    if (!allowedTransitions[fromState]?.includes(toState)) throw new InvalidTransitionError(fromState, toState);

    const testPassed = toState === 'FAILED' || toState === 'ROLLED_BACK' ? 0 : undefined;
    if (testPassed === undefined) {
      db.prepare('UPDATE sessions SET lifecycle_state = ?, status = ?, updated_at = ? WHERE id = ?')
        .run(toState, legacyStatusByState[toState], timestamp, sessionId);
    } else {
      db.prepare('UPDATE sessions SET lifecycle_state = ?, status = ?, updated_at = ?, test_passed = ? WHERE id = ?')
        .run(toState, legacyStatusByState[toState], timestamp, testPassed, sessionId);
    }
    db.prepare('INSERT INTO audit_log (session_id, action, details, created_at) VALUES (?, ?, ?, ?)')
      .run(sessionId, 'state_transition', JSON.stringify({ from: fromState, to: toState, ...details }), timestamp);
    db.exec('COMMIT');
    return { from: fromState, to: toState, updatedAt: timestamp };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function allowedRepairTransitions(fromState) {
  return [...(allowedTransitions[fromState] || [])];
}

export function failInterruptedRepairStates(db, timestamp = new Date().toISOString()) {
  const interrupted = db.prepare(`
    SELECT id FROM sessions
    WHERE lifecycle_state IN ('ANALYZING', 'ISSUE_DETECTED', 'REPAIRING', 'VERIFYING', 'PREVIEW_READY')
  `).all();
  for (const { id } of interrupted) {
    transitionRepairState(db, id, 'FAILED', {
      timestamp,
      details: { reason: 'application_restarted_during_repair' },
    });
  }
  return interrupted.length;
}
