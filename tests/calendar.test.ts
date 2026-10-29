import test from 'node:test';
import assert from 'node:assert/strict';
import { mondayInVietnam, plusDays } from '../src/lib/portal/calendar';

test('lecturer week boundaries use the Vietnam date and stable calendar arithmetic', () => {
  assert.equal(mondayInVietnam(new Date('2026-01-04T16:59:59.999Z')), '2025-12-29');
  assert.equal(mondayInVietnam(new Date('2026-01-04T17:00:00.000Z')), '2026-01-05');
  assert.equal(mondayInVietnam('2026-10-29'), '2026-10-26');
  assert.equal(plusDays('2026-12-31', 1), '2027-01-01');
});
