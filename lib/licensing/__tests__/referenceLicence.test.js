import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  getReferenceLicence,
  withPreviewState,
  daysBetween,
  getExampleRequestHistory,
  TIER_ALLOCATIONS,
  WORKER_PACK_SIZES,
} from '../referenceLicence.js';

test('getReferenceLicence returns an active-status licence by default', () => {
  const licence = getReferenceLicence();
  assert.equal(licence.status, 'active');
  assert.equal(licence.tier, 'Enterprise');
  assert.equal(licence.hostingModel, 'Teracom Hosted');
});

test('withPreviewState("grace") overrides status and adds grace-specific fields', () => {
  const licence = withPreviewState(getReferenceLicence(), 'grace');
  assert.equal(licence.status, 'grace');
  assert.equal(typeof licence.daysRemainingInGracePeriod, 'number');
  assert.match(licence.nextRequiredAction, /grace period/i);
});

test('withPreviewState("locked") overrides status and sets the licence-upload action', () => {
  const licence = withPreviewState(getReferenceLicence(), 'locked');
  assert.equal(licence.status, 'locked');
  assert.match(licence.nextRequiredAction, /upload a valid licence/i);
});

test('withPreviewState with an unrecognised state falls back to active', () => {
  const licence = withPreviewState(getReferenceLicence(), 'not-a-real-state');
  assert.equal(licence.status, 'active');
  assert.equal(licence.nextRequiredAction, null);
});

test('daysBetween computes whole-day differences between two ISO dates', () => {
  assert.equal(daysBetween('2026-08-15', '2026-08-15'), 0);
  assert.equal(daysBetween('2026-08-15', '2026-09-14'), 30);
  assert.equal(daysBetween('2026-09-14', '2026-08-15'), -30);
});

test('getExampleRequestHistory returns at least one illustrative row', () => {
  const rows = getExampleRequestHistory();
  assert.ok(Array.isArray(rows));
  assert.ok(rows.length > 0);
  assert.ok(rows[0].id);
});

test('TIER_ALLOCATIONS matches LICENSING_MODEL_V1.md §2 exactly', () => {
  assert.deepEqual(TIER_ALLOCATIONS.Starter, { workers: 5, users: 10, organisations: 1 });
  assert.equal(TIER_ALLOCATIONS.Enterprise.workers, 30);
  assert.equal(TIER_ALLOCATIONS.Enterprise.users, null);
  assert.equal(TIER_ALLOCATIONS.Enterprise.organisations, 5);
  assert.equal(TIER_ALLOCATIONS.Platinum.workers, 50);
  assert.equal(TIER_ALLOCATIONS.Platinum.organisations, 30);
});

test('WORKER_PACK_SIZES matches LICENSING_MODEL_V1.md §7 exactly', () => {
  assert.deepEqual(WORKER_PACK_SIZES, [5, 10]);
});
