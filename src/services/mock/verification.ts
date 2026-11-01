import { testFixtures } from './fixtures'
import type { TestResult } from '@/types/repair'

/** Demo-only verification policy. A real backend will provide its own required-check manifest. */
export const requiredDemoChecks = testFixtures.filter((test) => test.required !== false)

export function summarizeDemoVerification(tests: TestResult[]) {
  const passed = tests.filter((test) => test.status === 'passed').length
  const failed = tests.filter((test) => test.status === 'failed').length
  const skipped = tests.filter((test) => test.status === 'skipped').length
  const duplicateIds = new Set(tests.map((test) => test.id)).size !== tests.length
  const incomplete = requiredDemoChecks.filter((required) => {
    const matches = tests.filter((test) => test.id === required.id)
    return matches.length !== 1 || matches[0].status !== 'passed'
  })
  return {
    total: tests.length,
    passed,
    failed,
    skipped,
    requiredTotal: requiredDemoChecks.length,
    requiredPassed: requiredDemoChecks.length - incomplete.length,
    incomplete,
    complete: tests.length > 0 && failed === 0 && !duplicateIds && incomplete.length === 0,
    blockingReason: !tests.length
      ? 'Run the required demonstration checks before approving the proposal.'
      : duplicateIds
        ? 'This demonstration report contains duplicate checks. Run the checks again.'
        : failed
          ? 'A simulated check failed. Approval is blocked until the checks pass.'
          : incomplete.length
            ? 'A required demonstration check is missing or has not passed. Run the checks again.'
            : null,
  }
}
