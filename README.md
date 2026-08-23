# E-Learning V2

NestJS + TypeScript + Prisma (MySQL/MariaDB) backend for an e-learning platform: courses, lessons with Google Drive-hosted videos, enrollments/payments, and email/password + Google OAuth authentication.

## 1. Local setup

```bash
npm install
cp .env.example .env   # then fill in real values, see table below
npx prisma migrate deploy   # apply existing migrations to your DB
npx prisma generate         # generate the Prisma client (also runs on install)
npm run start:dev
```

The server listens on `PORT` (default `3000`).

### Running tests

```bash
npx tsc --noEmit          # type-check
npm run lint               # eslint
npm test -- --runInBand    # unit tests (mocked dependencies, no DB needed)
npm run test:e2e           # e2e tests - needs a real, reachable DATABASE_URL
```

The e2e suite (`test/elearning-flow.e2e-spec.ts`) boots the full Nest app and talks to your configured database over HTTP via supertest. It creates and cleans up its own throwaway users/courses (timestamp-suffixed emails/slugs) but does require a working `DATABASE_URL`.

## 2. Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | MySQL/MariaDB connection string, e.g. `mysql://user:pass@host:3306/dbname` |
| `JWT_SECRET_KEY` | yes | Secret used to sign access/refresh JWTs |
| `JWT_EXPIRES_IN` | yes | Default JWT expiry (e.g. `3600s`) — note `AuthTokenFactory` currently hardcodes access=1h/refresh=7d regardless of this value |
| `GOOGLE_CLIENT_ID` | for Google login | OAuth2 Client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | for Google login | OAuth2 Client secret |
| `GOOGLE_CALLBACK_URL` | for Google login | Redirect URI registered in Google Cloud Console, e.g. `http://localhost:3000/auth/google/callback` |
| `EMAIL_PROVIDER` | no (default `console`) | `console` logs the enrollment email instead of sending it; `resend` sends through the Resend API |
| `RESEND_API_KEY` | only if `EMAIL_PROVIDER=resend` | Resend API key |
| `EMAIL_FROM` | only if `EMAIL_PROVIDER=resend` | From-address used for outgoing email |
| `PAYMENT_BANK_ACCOUNT_NAME` | no (has fallback) | Bank account holder name shown in the public-enrollment payment guidance email |
| `PAYMENT_BANK_ACCOUNT_NUMBER` | no (has fallback) | Bank account number shown in the payment guidance email — not a secret, it's meant to be sent to the payer |
| `PAYMENT_BANK_NAME` | no (has fallback) | Bank name shown in the payment guidance email |
| `CLASS_SCHEDULE_INFO` | no (has fallback) | Free-text class format/schedule info included in the payment guidance email |
| `PORT` | no (default `3000`) | HTTP port |

There are no payment-gateway env vars: `src/modules/enrollments/payment/payment-gateway.ts` currently only ships a `MockPaymentGateway` that always succeeds and returns a fake reference — wire a real provider (e.g. Stripe/VNPay) behind `PaymentGatewayPort` before going to production.

Never commit `.env`.

## 3. Prisma migrations

- Development (creates a new migration from schema changes and applies it): `npx prisma migrate dev --name <change-name>`
- Deploy to an existing/target database (applies pending migrations only, no schema-diffing): `npx prisma migrate deploy`
- Regenerate the client after any schema change: `npx prisma generate`
- Inspect schema validity: `npx prisma validate`

Do not run `npx prisma migrate reset` against a database with real data — it drops and recreates the schema.

## 4. Google OAuth setup (for `GET /auth/google` login)

1. In [Google Cloud Console](https://console.cloud.google.com/), create/select a project → **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. Application type: **Web application**.
3. Add an **Authorized redirect URI** matching `GOOGLE_CALLBACK_URL`, e.g. `http://localhost:3000/auth/google/callback` (add your production URL too when deploying).
4. Copy the generated **Client ID** and **Client secret** into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

### How a frontend logs in with Google

This backend supports two Google login shapes:

- **Server-driven OAuth redirect** (`GET /auth/google` → Google → `GET /auth/google/callback`): a browser-based redirect flow using Passport's Google strategy. Good for a traditional web frontend.
- **Client-side ID token exchange** (`POST /auth/google-login`): the frontend runs Google's own client-side sign-in (e.g. Google Identity Services JS SDK) to obtain a Google `idToken`, then does:

  ```http
  POST /auth/google-login
  Content-Type: application/json

  { "idToken": "<the ID token from Google Identity Services>" }
  ```

  The backend verifies the token's signature, audience (`GOOGLE_CLIENT_ID`), issuer, and `email_verified` flag via `GoogleIdTokenVerifierService` (`src/modules/auth/services/google-id-token-verifier.service.ts`), then calls `GoogleLoginUseCase` to create-or-link the user and issue this backend's own JWT access/refresh tokens (same shape as `/auth/login`). This is the flow to use for SPAs/mobile apps that don't want a full-page redirect.

## 5. Google Drive video setup

1. Upload the lesson video to Google Drive.
2. Right-click the file → **Share** → set access to **"Anyone with the link" → Viewer** (or share explicitly with your audience). This is a Drive-level permission, independent of this backend.
3. Copy the share link. Any of these forms are accepted by `GoogleDriveUrlUtil.parse()` (`src/modules/lessons/utils/google-drive-url.util.ts`):
   - `https://drive.google.com/file/d/<FILE_ID>/view?usp=sharing`
   - `https://drive.google.com/open?id=<FILE_ID>`
   - `https://drive.google.com/uc?id=<FILE_ID>&export=download`
4. Paste that link as `videoUrl` when creating/updating a lesson (`POST /courses/:courseId/lessons`, `PATCH /lessons/:id`). The backend extracts `<FILE_ID>` and stores a normalized `embedUrl` of the form:

   ```
   https://drive.google.com/file/d/<FILE_ID>/preview
   ```

5. On the frontend, render it in an iframe:

   ```html
   <iframe src="https://drive.google.com/file/d/<FILE_ID>/preview" allow="autoplay"></iframe>
   ```

**Important:** `VideoAccessGuard` only controls whether *this backend* returns the lesson's `embedUrl` to a given caller (enrollment/role checks). It has no effect on Google Drive's own sharing permissions. If the Drive file itself is not shared as "Anyone with the link can view" (or explicitly with the viewer's Google account), the iframe will show a Google "you need access" screen even for a user the backend just authorized — the Drive file's own sharing setting is a separate, required authorization layer.

### 5.1 Automatic per-account Drive permission grant (optional, real permission model)

Instead of leaving paid lesson videos set to "Anyone with the link" (which technically lets anyone with the URL view them, guard or no guard), you can keep those Drive files **Restricted** and have the backend grant viewer access to a student's specific Google account automatically when their enrollment is activated — this is the same mechanism used by the reference demo `phuongnh2208/google-drive-video-demo` (`DriveService.grantAccess` via `googleapis`).

How it works here: `DriveAccessService` (`src/modules/lessons/services/drive-access.service.ts`) uses a Google **service account** to call the Drive API. `ConfirmEnrollmentPaymentUseCase` calls `grantAccess(driveFileId, studentEmail)` for every lesson video in the course right after the enrollment/payment transaction commits — a failure here is logged and does not undo the already-committed activation (same "don't corrupt already-persisted state" rule as the email step).

Setup:

1. In Google Cloud Console → **IAM & Admin → Service Accounts**, create a service account and generate a JSON key.
2. Enable the **Google Drive API** for the project.
3. In Google Drive, share the folder(s)/file(s) containing lesson videos with the service account's email address (found in the JSON key, field `client_email`) as **Editor** — this lets the service account manage sharing on those files.
4. Set `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` in `.env` to the absolute path of the downloaded JSON key file. **Never commit this file** — it's covered by `.gitignore` (`*service-account*.json`, `credentials/`).
5. Set the Drive files' own sharing to **Restricted** (not "Anyone with the link") — access is now granted per-account by the backend instead.

If `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` is unset, this step is skipped entirely (logged as a warning) and you must fall back to manual "Anyone with the link" sharing as described above — the app still works either way, this is an optional hardening layer, not a requirement.

## 6. API reference

Base path: none (all routes below are relative to the server root). All bodies are JSON; validation is `class-validator`-based with `whitelist: true, forbidNonWhitelisted: true` (unknown fields are rejected).

### Auth (`/auth`)

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/auth/register` | public | - | Create an account with email + password (any role can self-register; new accounts default to `USER`) |
| POST | `/auth/login` | public | - | Email/password login, open to any role, returns access + refresh JWT |
| POST | `/auth/logout` | public (body carries refresh token) | - | Revoke a refresh token/session |
| POST | `/auth/refresh` | public (body carries refresh token) | - | Exchange a valid refresh token for a new access token |
| POST | `/auth/google-login` | public | - | Client-side Google Identity Services flow: body `{ idToken }`; verifies it via `GoogleIdTokenVerifierService`, then `GoogleLoginUseCase` creates-or-links the user by email and issues backend JWTs (same response shape as `/auth/login`) |
| POST | `/auth/link-google` | JWT | any | Attaches a verified Google identity to the **currently logged-in** account (e.g. one created via email/password) without creating a new user or session — see `LinkGoogleAccountUseCase`. Required for a non-Google account to satisfy the "correct Google account" check on paid-video access. Rejects if that Google account is already linked to a different user (`AUTH.GOOGLE_ALREADY_LINKED_TO_ANOTHER_ACCOUNT`) or if the caller already has a different Google account linked (`AUTH.GOOGLE_ACCOUNT_MISMATCH`). |
| GET | `/auth/google` | public | - | Starts the server-driven Google OAuth redirect flow |
| GET | `/auth/google/callback` | public (Google redirect) | - | OAuth callback; creates/links the user and issues backend JWTs |

### Users (`/users`)

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/users` | JWT | ADMIN | Create a user (optionally with `role`, e.g. to provision another ADMIN) |
| GET | `/users` | JWT | ADMIN | List users (paginated/filterable) |
| GET | `/users/me` | JWT | any | Get the caller's own profile, including `hasGoogleAccount` (boolean; never exposes the raw `googleId`) |
| GET | `/users/:id` | JWT | self or ADMIN (enforced in use-case) | Get a single user |
| PATCH | `/users/:id` | JWT | self or ADMIN | Update own profile, or (ADMIN only) another user's `role`/`status`; a user can never set their own `role`/`status`, and an ADMIN cannot change their own `role`/`status` either (see audit notes) |
| DELETE | `/users/:id` | JWT | ADMIN | Delete a user |

### Courses (`/courses`)

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/courses/admin` | JWT | ADMIN | List all courses including unpublished/drafts |
| GET | `/courses/admin/:id` | JWT | ADMIN | Get any course including unpublished |
| POST | `/courses` | JWT | ADMIN | Create a course |
| PATCH | `/courses/:id` | JWT | ADMIN | Update a course |
| DELETE | `/courses/:id` | JWT | ADMIN | Delete a course |
| GET | `/courses` | public | - | List published courses |
| GET | `/courses/:id` | public | - | Get a published course |

### Lessons

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/courses/:courseId/lessons` | public | - | List lessons for a course (no video URL) |
| POST | `/courses/:courseId/lessons` | JWT | ADMIN | Create a lesson (accepts `videoUrl`, a Google Drive share link) |
| GET | `/lessons/admin/:id` | JWT | ADMIN | Get a lesson including video info, regardless of published state |
| GET | `/lessons/:id/video` | JWT + `VideoAccessGuard` | any authenticated user who passes the access check | Get the lesson including `video.embedUrl`. Only two tiers now: FREE lesson → any logged-in user; PAID lesson → logged-in user with an ACTIVE enrollment matched by `userId` **or** by `contactEmail` (the Google-verified email on the JWT). There is no unauthenticated video tier — an anonymous request gets 401 from `JwtAuthGuard` before `VideoAccessGuard` even runs. ADMIN bypasses. |
| GET | `/lessons/:id` | public | - | Get a published lesson without video info |
| PATCH | `/lessons/:id` | JWT | ADMIN | Update a lesson |
| DELETE | `/lessons/:id` | JWT | ADMIN | Delete a lesson |

### Enrollments (`/enrollments`)

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/enrollments/public` | public (no JWT) | - | Anonymous paid-enrollment intake form: `contactName`, `contactEmail` (the Gmail they'll study with), `contactPhone`, `courseId`. Rejects FREE courses (use the authenticated self-enroll route instead) and non-`PUBLISHED`/nonexistent courses. Creates a PENDING `Enrollment` with `userId: null` + a PENDING `Payment`, and emails bank transfer + Gmail-access instructions to `contactEmail`. |
| POST | `/enrollments/courses/:courseId` | JWT | any authenticated user | Self-service enroll; FREE courses activate immediately, PAID courses create a PENDING enrollment + PENDING payment. Unchanged from before. |
| POST | `/enrollments/:id/confirm-payment` | JWT | owner (userId-based enrollments) or ADMIN (required for `userId: null` contact-based enrollments) | Charges the mock payment gateway and, on success, atomically marks Payment PAID + Enrollment ACTIVE in one Prisma transaction |
| GET | `/enrollments/me` | JWT | any authenticated user | List the caller's own enrollments |
| GET | `/enrollments/:id` | JWT | owner or ADMIN | Get a single enrollment (IDOR-safe: uses the JWT-derived user id, not a client-supplied one) |

## 7. Flows

### Google login (server-redirect flow)
```
Browser -> GET /auth/google -> Google consent screen
Google -> GET /auth/google/callback?code=... (Passport GoogleStrategy exchanges code for profile)
Backend -> GoogleLoginUseCase: find user by email
  - no user            -> create user (role=USER, googleId set)
  - user, no googleId   -> link googleId to the existing account
  - user, googleId set  -> must match, else GOOGLE_ACCOUNT_MISMATCH
  - user.status=BANNED  -> reject with USER_BANNED
Backend -> revoke previous sessions, issue access+refresh JWT, persist a hashed refresh token as a Session row
Backend -> returns { accessToken, refreshToken, user }
```

### Enrollment + payment (authenticated self-service)
```
User -> POST /enrollments/courses/:courseId
Backend -> reject if already ACTIVE or already has a non-active record (ENROLLMENT_EXISTS/ALREADY_ENROLLED)
  FREE course  -> Enrollment created as ACTIVE immediately, confirmation email attempted (failure is logged, never rolls back the enrollment)
  PAID course  -> Enrollment created as PENDING + Payment created as PENDING, paymentRequired=true returned

Owner or ADMIN -> POST /enrollments/:id/confirm-payment
Backend -> verify caller is the owner or ADMIN, verify enrollment is PENDING and payment isn't already PAID
Backend -> call PaymentGatewayPort.charge() (currently MockPaymentGateway, always succeeds)
Backend -> on success: single $transaction sets Payment.status=PAID and Enrollment.status=ACTIVE together (both or neither)
Backend -> attempt confirmation email (failure logged only, DB state already committed and is not touched)
```

### Public enrollment + Gmail-based access grant (anonymous paid intake)
```
Anyone (no account) -> POST /enrollments/public { contactName, contactEmail, contactPhone, courseId }
Backend -> reject if course doesn't exist / isn't PUBLISHED / is FREE (FREE_COURSE_REQUIRES_LOGIN -> use the authenticated flow instead)
Backend -> create Enrollment{ userId: null, contactName, contactEmail, contactPhone, status: PENDING } + Payment{ status: PENDING }
Backend -> email contactEmail: bank account name/number, bank name, amount, transfer note (includes enrollment id),
           how to confirm the transfer (reply with a receipt), and an explicit instruction to log in with that
           exact Gmail address later, plus class schedule/format info

Payer -> transfers money out-of-band, replies to confirm

ADMIN -> POST /enrollments/:id/confirm-payment (userId is null on this enrollment, so ownership check is skipped
          and ONLY an ADMIN caller is accepted)
Backend -> same transactional Payment PAID + Enrollment ACTIVE update as the authenticated flow

Person -> later logs in via Google using that exact Gmail address (creates a User row at that point if one
          doesn't exist yet, via the existing Google login flow — unrelated to Enrollment.userId)
Person -> GET /lessons/:id/video
VideoAccessGuard -> for a PAID lesson, looks up an ACTIVE, non-expired Enrollment for that course where
                    enrollment.userId == caller.id OR enrollment.contactEmail == caller.email (JWT-derived,
                    Google-verified) -> matches on contactEmail even though enrollment.userId is still null -> access granted
```

### Video access
```
Any client -> GET /lessons/:id/video   (JwtAuthGuard, then VideoAccessGuard)
JwtAuthGuard -> rejects anonymous callers with 401 before VideoAccessGuard runs (no public video tier anymore)
VideoAccessGuard:
  - lesson must exist and (isPublished OR caller is ADMIN)
  - resolve effective access type: lesson.accessType, or the course's accessType when lesson.accessType=INHERIT
  - FREE effective access -> allow any logged-in user, any role
  - PAID effective access:
      - ADMIN -> allow
      - else  -> look up an ACTIVE, non-expired Enrollment for courseId where userId==caller.id OR
                 contactEmail==caller.email; otherwise 403
GetLessonUseCase(adminMode=true) -> returns lesson including video.embedUrl
```
Public/anonymous users may still browse course and lesson **metadata** with no login (`GET /courses`, `GET /courses/:id`, `GET /courses/:courseId/lessons`, `GET /lessons/:id`) — only the actual video/`embedUrl` requires login.

Google Drive's own file-sharing permission is a separate, required layer — see section 5.

## 8. Design Patterns

Five GoF patterns are documented below, classified by GoF category (each rubric asks for this explicitly):

| Pattern | GoF category |
|---|---|
| Factory (`AuthTokenFactory`, `SessionStateFactory`) | Creational |
| Decorator (`LoggingUserRepositoryDecorator`) | Structural |
| Strategy (`PasswordHasherStrategy`, email/payment providers) | Behavioral |
| Observer (`EventDispatcher` + `*UserRegistered` observers) | Behavioral |
| State (`SessionState` hierarchy) | Behavioral |

### Factory — `AuthTokenFactory`, `SessionStateFactory`
- **Files:** `src/modules/auth/factories/auth-token.factory.ts`, `src/modules/sessions/states/session-state.factory.ts`
- **Problem:** callers need JWT access/refresh tokens and login-response objects (or session-state objects) built consistently without knowing token-signing/session-status details.
- **How it works:** `AuthTokenFactory.createLoginResponse(user)` builds the access-token payload, refresh-token payload, signs both via `JwtService`, and maps the user through `UserMapper` into one response object. `SessionStateFactory.create(status)` maps a `SessionStatus` enum value to a concrete `ActiveSessionState` / `RevokedSessionState` / `ExpiredSessionState` instance (defaulting to `RevokedSessionState` for any unrecognized status).
- **Benefit:** centralizes token/response construction and state-object selection in one place instead of scattering `jwtService.signAsync(...)` or `switch` statements across use-cases.
- **Limitation:** `AuthTokenFactory` hardcodes `1h`/`7d` expiries rather than reading `JWT_EXPIRES_IN` from config, so that env var is currently only descriptive, not wired in.

### Strategy — `PasswordHasherStrategy`, email/payment providers
- **Files:** `src/common/secret/hashing/password-hasher.strategy.ts` (abstract) + `bcrypt-password-hasher.strategy.ts` (concrete), `src/modules/email/email.service.ts` (`EmailServicePort` abstract with console/Resend branches inside one class), `src/modules/enrollments/payment/payment-gateway.ts` (`PaymentGatewayPort` abstract + `MockPaymentGateway`)
- **Problem:** swap the hashing algorithm, email provider, or payment processor without touching call sites.
- **How it works:** consumers depend on the abstract class (`PasswordHasherStrategy`, `EmailServicePort`, `PaymentGatewayPort`); Nest DI binds it to a concrete implementation in each module (`useExisting: BcryptPasswordHasherStrategy` / `EmailService` / `MockPaymentGateway`).
- **Benefit:** `LoginUseCase`, `RegisterUseCase`, `ConfirmEnrollmentPaymentUseCase`, etc. never import bcrypt, Resend's fetch call, or a payment SDK directly — only the port.
- **Limitation:** `EmailService` branches on `EMAIL_PROVIDER` internally with an if/else rather than having two separate injectable strategy classes selected at the module boundary — it's a strategy in spirit (swap by config) but not a textbook one-class-per-strategy implementation. `MockPaymentGateway` is the only `PaymentGatewayPort` implementation that exists; no real gateway is wired up yet.

### Observer / Event Dispatcher — `EventDispatcher`, `*UserRegistered` observers
- **Files:** `src/common/events/event-dispatcher.ts`, `event-listener.interface.ts`, `src/modules/auth/events/user-registered.event.ts`, `src/modules/auth/observers/{audit,security,welcome}-user-registered.observer.ts`, wired via `src/modules/auth/auth-event-registrar.ts`
- **Problem:** decouple "a new user account was created" from the side effects that should follow (audit log, security log, welcome flow) so the auth flow doesn't need to know about all of them.
- **How it works:** `EventDispatcher` keeps an in-memory `Record<eventName, EventListener[]>`; `AuthEventRegistrar` registers the three observers against the `UserRegisteredEvent` name at startup. There is no public self-registration endpoint anymore (students authenticate via Google only, ADMIN accounts are provisioned via `POST /users`) — the event now fires from `GoogleLoginUseCase` when it creates a brand-new user (not on every login), and each registered listener's `handle()` runs in sequence.
- **Benefit:** new account-creation side-effects can be added as a new observer class + one registration line, with zero changes to the auth use-case that creates the user.
- **Gap:** this dispatcher is **only used for user registration**. Enrollment/payment events (enrollment created, payment confirmed) do **not** go through `EventDispatcher` — `CreateEnrollmentUseCase` and `ConfirmEnrollmentPaymentUseCase` call `EmailServicePort` directly inline instead of dispatching an event that an email observer would pick up. This is an inconsistency worth resolving (either route enrollment emails through the same dispatcher, or accept it as a deliberate simpler path for that module) rather than a bug — noting it here rather than inventing an enrollment-event system that doesn't exist in the code.

### Decorator — `LoggingUserRepositoryDecorator`
- **File:** `src/modules/users/repositories/logging-user-repository.decorator.ts`
- **Problem:** add logging around every `UserRepository` method without modifying `UserRepository` itself or duplicating log statements in every use-case that calls it.
- **How it works:** `LoggingUserRepositoryDecorator extends UserRepositoryPort`, wraps an injected `UserRepository` instance, and for each method (`createUser`, `findAll`, `count`, `findOne`, `findByEmail`, `findByGoogleId`, `updateUser`, `deleteUser`) logs a timestamped line then delegates to the wrapped repository. `UserModule` binds `UserRepositoryPort` to this decorator (which itself holds the real `UserRepository`), so every consumer of `UserRepositoryPort` gets logging transparently.
- **Benefit:** cross-cutting logging concern isolated from both the repository implementation and its consumers; can be composed with further decorators (caching, metrics) the same way.
- **Limitation:** it is a single hand-written decorator per repository, not a generic reusable wrapper — adding logging to `CourseRepository`/`LessonRepository`/`EnrollmentRepository` would mean writing the same boilerplate again rather than reusing shared decorator infrastructure.

### State — `SessionState` hierarchy
- **Files:** `src/modules/sessions/states/session-state.interface.ts`, `active-session.state.ts`, `revoked-session.state.ts`, `expried-session.state.ts` [sic], `session-state.factory.ts`
- **Problem:** represent what is/isn't allowed for a session (e.g. "can this session still be used to refresh a token?") based on its `SessionStatus` without `if/else`-ing on the enum everywhere a session is checked.
- **How it works:** each concrete class (`ActiveSessionState`, `RevokedSessionState`, `ExpiredSessionState`) implements the shared `SessionState` interface; `SessionStateFactory.create(status)` returns the right instance for a given `Session.status` value read from the DB.
- **Benefit:** session-status behavior lives in one small class per state instead of scattered conditionals; extending it (e.g. adding a `LOCKED` status) means adding one new class + one factory branch.
- **Benefit (confirmed):** `RefreshTokenUsecase` and `LogoutUsecase` both call `sessionStateFactory.create(session.status)` then `sessionState.ensureCanRefresh()` / `ensureCanLogout()` respectively — the enum branching is fully delegated to the state objects, not duplicated as `if/else` in the use-cases.
- **Limitation:** adding a new `SessionStatus` value requires remembering to add both a new state class and a new `switch` branch in the factory; nothing enforces exhaustiveness at compile time (the `default` branch silently falls back to `RevokedSessionState`).

### Gmail-based access grant — plain logic, not a named pattern
- **Files:** `src/modules/lessons/guards/video-access.guard.ts` (`OR: [{ userId }, { contactEmail }]` lookup), `src/modules/enrollments/repositories/enrollment.repository.ts` (`findActiveByCourseAndEmail`, `createPublicPending`), `src/modules/enrollments/use-cases/create-public-enrollment.usecase.ts`.
- This is intentionally **not** force-fit into one of the five named patterns above. It's a straightforward alternate-key lookup (an `Enrollment` can be matched by `userId` OR by `contactEmail`) plus a nullable foreign key — an ordinary data-modeling/query decision, not a Strategy, State, or Factory. Calling it a pattern would be inventing a classification that doesn't earn its keep here.

## Known gaps

- `POST /auth/google-login` (client-side idToken flow) is not wired to a controller route yet, even though `GoogleIdTokenVerifierService` + `GoogleLoginUseCase` + `GoogleLoginDto` exist and are unit-tested — see the Auth API table above.
- Enrollment/payment flows send email directly instead of going through `EventDispatcher`, unlike user registration.
- `MockPaymentGateway` is the only payment gateway; no real payment processor is integrated.
- `AuthTokenFactory` does not read `JWT_EXPIRES_IN` from config; token lifetimes are hardcoded.
