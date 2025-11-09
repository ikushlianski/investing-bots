# Phase 8: Authentication Audit Logging

## Overview

Add audit logging for all authentication events to track login attempts, successful logins, and logouts. This helps monitor unauthorized access attempts and provides a security audit trail.

## Goals

- Track all authentication events with timestamp and IP address
- Store login attempts (successful and failed) in database
- Leverage Cloudflare Workers runtime for client IP detection
- Provide simple query interface for reviewing auth events

## Success Criteria

- All login attempts (success and failure) are logged with IP address
- All logout events are logged
- Logs include: timestamp, user email, IP address, country, success status
- Can query recent auth events from database

## Context

Since this is a personal tool for a single user, the primary goal is to detect if someone else accessed the system. We don't need enterprise-level features like rate limiting or complex analytics, but we do want to know when and from where logins occurred.

## Technical Approach

Since you're deploying to Cloudflare Workers, we can leverage:
- `CF-Connecting-IP` header for real client IP
- `CF-IPCountry` header for country detection
- `CF-Ray` header for request tracing
- Existing Neon PostgreSQL database for audit log storage

## Implementation Tasks

### Task 1: Extend Database Schema

**Estimated Time**: 30 minutes

Decide whether to extend existing `audit_logs` table or create new `auth_audit_logs` table.

**Option A: Extend existing `audit_logs` table**
- Add nullable fields: `user_id`, `event_type`, `email`, `ip_address`, `country`, `user_agent`, `success`, `failure_reason`
- Keep backward compatible with bot events

**Option B: Create separate `auth_audit_logs` table**
- Cleaner separation of concerns
- Different retention policies possible
- User-centric vs bot-centric data

**Recommended: Option B**

Create new schema file:
`/apps/botbox/src/db/schema/auth-audit.schema.ts`

```typescript
import { sql } from 'drizzle-orm'
import { pgTable, serial, integer, text, timestamp, boolean, index } from 'drizzle-orm/pg-core'
import { users } from './users.schema'

export const authAuditLogs = pgTable('auth_audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  eventType: text('event_type').notNull(),
  email: text('email').notNull(),
  ipAddress: text('ip_address'),
  country: text('country'),
  requestId: text('request_id'),
  userAgent: text('user_agent'),
  success: boolean('success').notNull(),
  failureReason: text('failure_reason'),
  createdAt: timestamp('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}, (table) => ({
  userIdIdx: index('auth_audit_logs_user_id_idx').on(table.userId),
  createdAtIdx: index('auth_audit_logs_created_at_idx').on(table.createdAt),
  eventTypeIdx: index('auth_audit_logs_event_type_idx').on(table.eventType),
}))
```

Update `/apps/botbox/src/db/schema/index.ts`:
```typescript
export * from './auth-audit.schema'
```

### Task 2: Create Migration

**Estimated Time**: 15 minutes

Generate migration for the new table:

```bash
npm run db:generate
```

Review the generated migration file in `/apps/botbox/migrations/`.

Apply migration:
```bash
npm run db:migrate
# or
npm run db:push
```

### Task 3: Create Auth Audit Utility

**Estimated Time**: 45 minutes

Create `/apps/botbox/src/utils/auth-audit.ts`:

```typescript
import { getWebRequest } from '@tanstack/start/server'
import { getDb } from '../db/client'
import { authAuditLogs } from '../db/schema'

type AuthEventType = 'login_success' | 'login_failure' | 'logout'

interface LogAuthEventParams {
  eventType: AuthEventType
  email: string
  userId?: number
  success: boolean
  failureReason?: string
}

export const logAuthEvent = async (params: LogAuthEventParams) => {
  try {
    const request = getWebRequest()

    const ipAddress = request.headers.get('CF-Connecting-IP') ||
                      request.headers.get('X-Forwarded-For') ||
                      'unknown'
    const country = request.headers.get('CF-IPCountry') || null
    const requestId = request.headers.get('CF-Ray') || null
    const userAgent = request.headers.get('User-Agent') || null

    const db = await getDb()

    await db.insert(authAuditLogs).values({
      userId: params.userId,
      eventType: params.eventType,
      email: params.email,
      ipAddress,
      country,
      requestId,
      userAgent,
      success: params.success,
      failureReason: params.failureReason,
    })
  } catch (error) {
    console.error('Failed to log auth event:', error)
  }
}
```

**Important**: Use `getWebRequest()` instead of `getEvent()` to avoid TanStack Start known issues with headers in loaders.

### Task 4: Modify Login Handler

**Estimated Time**: 30 minutes

Update `/apps/botbox/src/server/auth.ts` to add audit logging:

**Import the utility:**
```typescript
import { logAuthEvent } from '../utils/auth-audit'
```

**Add logging after successful login** (around line 76):
```typescript
if (!passwordValid) {
  await logAuthEvent({
    eventType: 'login_failure',
    email: normalizeEmail(data.email),
    success: false,
    failureReason: 'invalid_credentials',
  })

  return {
    success: false as const,
    error: 'Invalid email or password',
  }
}

await session.update({
  userId: user.id,
  userEmail: user.email,
})

await logAuthEvent({
  eventType: 'login_success',
  email: user.email,
  userId: user.id,
  success: true,
})
```

**Add logging for honeypot detection** (around line 44):
```typescript
if (data.website) {
  await logAuthEvent({
    eventType: 'login_failure',
    email: normalizeEmail(data.email),
    success: false,
    failureReason: 'honeypot_triggered',
  })

  return {
    success: false as const,
    error: 'Invalid email or password',
  }
}
```

**Add logging for user not found** (around line 58):
```typescript
if (!user) {
  await logAuthEvent({
    eventType: 'login_failure',
    email: normalizeEmail(data.email),
    success: false,
    failureReason: 'user_not_found',
  })

  return {
    success: false as const,
    error: 'Invalid email or password',
  }
}
```

### Task 5: Modify Logout Handler

**Estimated Time**: 15 minutes

Update logout function in `/apps/botbox/src/server/auth.ts`:

```typescript
export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const session = await useAppSession()

  if (session.data.userId && session.data.userEmail) {
    await logAuthEvent({
      eventType: 'logout',
      email: session.data.userEmail,
      userId: session.data.userId,
      success: true,
    })
  }

  await session.clear()

  throw redirect({
    to: '/login',
    search: { redirect: undefined },
  })
})
```

### Task 6: Test Auth Logging

**Estimated Time**: 30 minutes

Test scenarios:
1. Successful login - verify log entry created with correct IP
2. Failed login (wrong password) - verify failure logged
3. Failed login (wrong email) - verify failure logged
4. Honeypot trigger - verify logged as bot attempt
5. Logout - verify logout event logged

**Verification queries:**

```sql
-- View recent auth events
SELECT * FROM auth_audit_logs
ORDER BY created_at DESC
LIMIT 20;

-- Count login failures by email
SELECT email, COUNT(*) as failure_count
FROM auth_audit_logs
WHERE event_type = 'login_failure'
GROUP BY email
ORDER BY failure_count DESC;

-- View all login events for your account
SELECT event_type, ip_address, country, created_at
FROM auth_audit_logs
WHERE email = 'your-email@example.com'
ORDER BY created_at DESC;
```

### Task 7: Create Auth Logs API (Optional)

**Estimated Time**: 45 minutes

Create a simple API to view recent auth logs from the dashboard.

Create `/apps/botbox/src/routes/api/auth-logs.ts`:

```typescript
import { createServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'
import { getDb } from '../../db/client'
import { authAuditLogs } from '../../db/schema'
import { useAppSession } from '../../utils/session'

export const getRecentAuthLogsFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const session = await useAppSession()

    if (!session.data.userId) {
      throw new Error('Unauthorized')
    }

    const db = await getDb()

    const logs = await db
      .select({
        id: authAuditLogs.id,
        eventType: authAuditLogs.eventType,
        email: authAuditLogs.email,
        ipAddress: authAuditLogs.ipAddress,
        country: authAuditLogs.country,
        success: authAuditLogs.success,
        failureReason: authAuditLogs.failureReason,
        createdAt: authAuditLogs.createdAt,
      })
      .from(authAuditLogs)
      .where(eq(authAuditLogs.email, session.data.userEmail!))
      .orderBy(desc(authAuditLogs.createdAt))
      .limit(50)

    return logs
  })
```

### Task 8: Add Auth Logs Dashboard Page (Optional)

**Estimated Time**: 1 hour

Create `/apps/botbox/src/routes/_authed/auth-logs.tsx`:

Simple table showing:
- Timestamp
- Event type (success/failure/logout)
- IP address
- Country
- Failure reason (if applicable)

Basic styling with Tailwind CSS to match existing dashboard theme.

## Testing Strategy

1. Manual testing of all auth flows
2. Verify database entries created correctly
3. Check IP addresses are captured from Cloudflare headers
4. Test with VPN to verify different IPs logged
5. Verify logout events logged

## Security Considerations

1. Never log passwords or tokens
2. Store only metadata about auth events
3. Consider data retention policy (delete logs older than X months)
4. IP addresses are considered PII in some jurisdictions (not a concern for personal use)
5. Ensure audit logs themselves are protected (only accessible when authenticated)

## Data Retention

For a personal tool, consider:
- Keep last 1000 auth events
- Or keep last 90 days of logs
- Create cleanup script to delete old logs

## Optional Future Enhancements

1. Email notifications on login from new IP
2. Dashboard widget showing recent login locations on map
3. Automatic session termination after N failed attempts
4. Export auth logs to CSV for external analysis
5. Rate limiting using Cloudflare's built-in rate limit API

## Migration Path

If you later need more sophisticated audit logging:
- Migrate to Cloudflare's Workers Analytics Engine
- Integrate with external SIEM tools
- Add more event types (API access, config changes, etc.)

## Time Estimate

Total implementation time: 3-4 hours

- Schema and migration: 45 minutes
- Auth audit utility: 45 minutes
- Modify auth handlers: 45 minutes
- Testing: 30 minutes
- Optional API and dashboard: 1.5 hours

## Dependencies

- Existing authentication system (`/apps/botbox/src/server/auth.ts`)
- Neon PostgreSQL database
- Drizzle ORM
- Cloudflare Workers runtime (for headers)

## Completion Checklist

- [ ] Auth audit schema created
- [ ] Migration generated and applied
- [ ] Auth audit utility implemented
- [ ] Login handler logging added
- [ ] Logout handler logging added
- [ ] Successful login tested and verified
- [ ] Failed login tested and verified
- [ ] Honeypot trigger tested and verified
- [ ] Logout tested and verified
- [ ] Database queries verified
- [ ] Optional: API endpoint created
- [ ] Optional: Dashboard page created
- [ ] Documentation updated

## References

- Cloudflare request headers: https://developers.cloudflare.com/fundamentals/reference/http-request-headers/
- TanStack Start server functions: https://tanstack.com/start/docs
- Drizzle schema reference: https://orm.drizzle.team/docs/sql-schema-declaration
