# MoneyMate Firestore Security Specification

## Data Invariants
1. Every document under `/users/{userId}` and its subcollections (`budgets`, `expenses`, `settings`, `checkins`, `events`) is owned exclusively by `userId` (`request.auth.uid == userId`), with `userId`/`uid` immutable after creation.
2. Users must be authenticated with verified email (`request.auth != null && request.auth.token.email_verified == true`) for all user-scoped operations.
3. No user can read, list, update, or delete another user's private expenses, budgets, or profile data.
4. Only the bootstrapped pilot administrator (`priyanka.0251mba689@dgu.ac.in`, verified email) can list all `/waitlist` and `/pilotMetrics` records for pilot research export.
5. Every string field enforces strict `.size()` bounds; every array (`fixedCosts`) enforces bounded size (`<= 25`); every numeric field enforces sane positive/non-negative bounds.
6. Document IDs are validated via `isValidId(id)` (`^[a-zA-Z0-9_\-]+$`, max 128 chars).

## Dirty Dozen Adversarial Payloads (All Must Return PERMISSION_DENIED)
1. Unauthenticated read on `/users/userA/expenses/exp1` -> DENIED
2. Authenticated User B reading `/users/userA/budgets/current` -> DENIED
3. Authenticated User A creating an expense with `userId: "userB"` (identity spoofing) -> DENIED
4. Authenticated User A creating an expense with `amount: -500` or `amount: "100"` -> DENIED
5. Authenticated User A adding a shadow field `isAdmin: true` on `/users/userA` -> DENIED
6. Authenticated User A updating `uid` or `createdAt` on `/users/userA` -> DENIED
7. Authenticated User A creating a budget with `fixedCosts` array length > 25 -> DENIED
8. Authenticated User A creating an expense with `note` > 140 chars -> DENIED
9. Non-admin User B listing `/waitlist` -> DENIED
10. Non-admin User B listing `/pilotMetrics` -> DENIED
11. Unverified email admin token spoofing `email: "priyanka.0251mba689@dgu.ac.in"` with `email_verified: false` -> DENIED
12. Path ID poisoning with 500-character document ID on `/users/userA/expenses/{id}` -> DENIED
