# Architecture: ft-005 - User Authentication (MVP Phase 1)

## Final Decisions

### 1. Authentication Method
*   **Decision**: Simple Username/Password stored in Cloudflare Secrets.
*   **Rationale**: Prioritizes fastest time to market for internal validation of core trading features. Avoids initial complexity of full-fledged authentication systems.

### 2. Email Sending Service
*   **Decision**: Not applicable for MVP Phase 1 authentication.
*   **Rationale**: No email-based authentication flow in this phase.

### 3. User Data Storage
*   **Decision**: Minimal `users` table in Cloudflare D1 database with hashed passwords.
*   **Rationale**:
    *   Allows multiple users without hardcoding credentials
    *   Enables basic user management (create, disable users)
    *   Production-ready security with bcrypt password hashing
    *   Still simple enough for rapid MVP deployment
*   **Schema**:
    ```sql
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    ```

### 4. Session Management
*   **Decision**: JWT tokens stored in HTTP-only secure cookies.
*   **Rationale**:
    *   Stateless authentication (no session store needed for Cloudflare Workers)
    *   HTTP-only cookies prevent XSS attacks
    *   SameSite attribute prevents CSRF attacks
    *   JWT payload contains minimal user info (id, email)
    *   Short expiration (7 days) with automatic renewal on activity
*   **Implementation**:
    *   JWT signed with JWT_SECRET environment variable
    *   Cookie settings: `httpOnly: true`, `secure: true` (production), `sameSite: 'lax'`
    *   Payload: `{ userId, email, exp }`

### 5. Protected Routes
*   **Decision**: All application routes protected via TanStack Router's layout route pattern with `beforeLoad` hook.
*   **Rationale**:
    *   Centralizes authentication logic in a single `_authed` layout route
    *   All child routes automatically inherit protection
    *   Clean separation between public and protected routes
    *   Type-safe user context passed to all protected routes

## Implementation Details

### Authentication Flow

**Login Process**:
1. User submits email/password via login form
2. Server function validates credentials against D1 `users` table using bcrypt
3. On success, generate JWT token with user payload
4. Set JWT in HTTP-only cookie
5. Redirect to dashboard

**Route Protection**:
1. Create `_authed.tsx` layout route with `beforeLoad` hook
2. Extract and verify JWT from cookie
3. Decode JWT to get user info
4. Pass user context to all child routes
5. Redirect to `/login` if token invalid/missing

**API Protection**:
1. Create `authMiddleware` that verifies JWT from cookie
2. Apply middleware to all API routes via global or route-level configuration
3. Return 401 Unauthorized if token invalid/missing

### Code Structure

```typescript
// utils/session.ts
export function useAppSession() {
  return useSession<SessionData>({
    name: 'botbox-session',
    password: process.env.SESSION_SECRET!,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60,
    },
  })
}

// server/auth.ts
export const loginFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => {
    const user = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    })

    if (!user || !(await bcrypt.compare(data.password, user.password_hash))) {
      return { error: 'Invalid credentials' }
    }

    const session = await useAppSession()
    await session.update({
      userId: user.id,
      userEmail: user.email,
    })

    throw redirect({ to: '/dashboard' })
  })

// routes/_authed.tsx
export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ location }) => {
    const session = await useAppSession()

    if (!session.data.userId) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.data.userId),
    })

    return { user }
  },
})

// middleware/auth-middleware.ts
export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const session = await useAppSession()

  if (!session.data.userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  return next()
})
```

### Database Setup

**Migration**:
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_users_email ON users(email);
```

**Seed Initial User** (local development):
```typescript
// scripts/seed-user.ts
import bcrypt from 'bcryptjs'
import { db } from './db'
import { users } from './schema'

const passwordHash = await bcrypt.hash('admin123', 12)

await db.insert(users).values({
  id: 'user_1',
  email: 'admin@botbox.local',
  password_hash: passwordHash,
  created_at: Date.now(),
})
```

## Action Points

*   **Create D1 Database**: Set up `botbox-db` in Cloudflare D1
*   **Run Migration**: Create `users` table in D1
*   **Seed Initial User**: Create admin user for testing
*   **Environment Variables**: Configure `SESSION_SECRET` (32+ chars) in local and Cloudflare
*   **Install Dependencies**: Add `bcryptjs` and `@types/bcryptjs`
*   **Implement Server Functions**: Create login, logout, getCurrentUser
*   **Create Layout Route**: Build `_authed.tsx` for bulk route protection
*   **Create Auth Middleware**: Build middleware for API route protection
*   **Build Login Page**: Simple form with email/password fields
*   **CI/CD Integration**: Update pipeline to handle D1 migrations and secrets

## Risks Identified

*   **No Password Reset Flow**: Users cannot reset forgotten passwords. Mitigated by manual admin intervention for MVP with few users.
*   **No Email Verification**: Users can register with any email. Acceptable for MVP with manual user creation only.
*   **No Rate Limiting**: Login endpoint could be brute-forced. Mitigated by Cloudflare's built-in DDoS protection and planned future implementation.
*   **No Multi-Factor Authentication**: Single-factor authentication only. Risk accepted for internal MVP; MFA planned for Phase 2.

## Alternatives Considered

*   **Magic Link Authentication (next-auth/openauth)**: Rejected for MVP due to increased initial setup complexity, email service integration, and potential deliverability issues, which would delay core feature validation.

## Trade-off Matrix

| Feature                  | MVP Phase 1 (Accepted)                          | Phase 2 (Future)                              |
| :----------------------- | :---------------------------------------------- | :-------------------------------------------- |
| **User Storage**         | D1 users table with bcrypt hashed passwords     | Same, production-ready                        |
| **Session Management**   | TanStack Start `useSession` with cookies        | Same, production-ready                        |
| **Authentication**       | Email/Password                                  | + Magic Link / OAuth                          |
| **User Management**      | Manual user creation via scripts                | Self-service registration + email verification|
| **Password Reset**       | Manual admin intervention                       | Self-service password reset flow              |
| **Security Features**    | Bcrypt hashing, HTTP-only cookies, HTTPS        | + MFA, Rate limiting, Session management      |
| **Speed to Market**      | Very High                                       | Moderate                                      |
| **Scalability**          | Supports multiple users, ready for production   | Enhanced with advanced features               |
| **Complexity**           | Low                                             | Moderate                                      |

## Monitoring Requirements

*   **Login Attempt Logging**: Basic logging of successful and failed login attempts to Cloudflare Logs for auditing and security monitoring.

## Scaling Thresholds

*   **User Count**: When the number of internal users exceeds a handful, or when external users are introduced, a more scalable authentication system will be required.
*   **Security Requirements**: If compliance or higher security standards become necessary, a more robust solution will be implemented.

## Required Dependencies

*   `bcryptjs` - Password hashing (industry standard, 12 rounds)
*   `@types/bcryptjs` - TypeScript definitions
*   TanStack Start's built-in `useSession` (already available)
*   Drizzle ORM (already configured for D1)

## Environment Variables

**Local (.env)**:
```bash
SESSION_SECRET=your-32-character-or-longer-secret-key-here
NODE_ENV=development
```

**Cloudflare (Secrets)**:
```bash
wrangler secret put SESSION_SECRET
```

## Team Skill Gaps

*   Minimal skill gaps. Standard authentication patterns with TanStack Start.
*   Bcrypt usage is straightforward with `hash()` and `compare()` methods.
*   D1 database operations already familiar from existing Drizzle setup.
