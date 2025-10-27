# US-004: Manual Signal Trigger

**Feature:** FT-085 Signal Generation & Trade Orchestration
**Story ID:** US-004
**Priority:** P2 (Nice to Have)
**Approved:** false

## Story

**As a** trader,
**I want** to manually trigger a signal check for a specific bot,
**So that** I can test my strategy without waiting for the scheduled interval.

## Acceptance Criteria

### AC1: Manual Trigger UI
- [ ] "Check Now" button on bot detail page
- [ ] Button disabled during check (prevents spam)
- [ ] Re-enabled after check completes

### AC2: Immediate Execution
- [ ] Triggers signal evaluation immediately (bypasses cron schedule)
- [ ] Result displayed within 5 seconds
- [ ] Signal logged to FT-061

### AC3: No Interference
- [ ] Manual check doesn't affect scheduled checks
- [ ] last_check_at not updated (scheduled interval preserved)
- [ ] Rate limiting still applies

## Definition of Done

- [ ] Button implemented in Bot Management UI
- [ ] API endpoint `/bot/:id/check-now` created
- [ ] Manual triggers logged separately
- [ ] Deployed and tested
