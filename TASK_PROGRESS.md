# Task Progress: Auth & RBAC Implementation

## Phase 1: Prisma Schema Updates
- [ ] Update User model to add googleId field (unique, optional)
- [ ] Make passwordHash optional in User model
- [ ] Run prisma generate and migrate

## Phase 2: RBAC Implementation
- [ ] Create @Roles decorator (roles.decorator.ts)
- [ ] Create RolesGuard (roles.guard.ts)
- [ ] Create RolesGuard unit tests (roles.guard.spec.ts)
- [ ] Update JwtStrategy to check user status (BANNED)
- [ ] Update LoginUseCase to check user status (BANNED)

## Phase 3: Google OAuth2 Integration
- [ ] Install passport-google-oauth20 package
- [ ] Create GoogleStrategy (google.strategy.ts)
- [ ] Create GoogleAuthGuard (google-auth.guard.ts)
- [ ] Create GoogleLoginUseCase (google-login.usecase.ts)
- [ ] Add Google OAuth2 endpoints to AuthController
- [ ] Update AuthModule with Google providers

## Phase 4: Testing & Quality
- [ ] Write unit tests for GoogleLoginUseCase
- [ ] Run ESLint
- [ ] Run NestJS build
- [ ] Run all unit tests

## Phase 5: Documentation
- [ ] Update .env.example with Google OAuth2 config
- [ ] Verify all endpoints work correctly