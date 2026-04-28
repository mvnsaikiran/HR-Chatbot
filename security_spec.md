# security_spec.md - Lumina HR

## Data Invariants
1. A user profile must match the authenticated UID.
2. A chat message must belong to the authenticated user.
3. A leave request must have a valid employeeId matching the creator.
4. Only users with `role == 'admin'` can read the set of all leave requests (list).
5. Leave request status can only be 'pending' upon creation by a regular employee.

## The "Dirty Dozen" Payloads (Anti-Patterns)
1. **Identity Theft (Profile):** Authenticated User A tries to write to `users/UserB`.
2. **Role Escalation:** Regular user tries to set their own `role` to 'admin' during profile creation.
3. **Chat Snooping:** User A tries to read `users/UserB/chatHistory/msg1`.
4. **Chat Injection:** User A tries to write a message into User B's history.
5. **Leave Forgery:** User A tries to create a `leaveRequest` with `employeeId: 'UserB'`.
6. **Policy Sabotage:** Regular user tries to update `settings/policies`.
7. **Status Hijacking:** Regular user tries to create a leave request with `status: 'approved'`.
8. **Approve Own Leave:** Regular employee tries to update their own `leaveRequest` status from 'pending' to 'approved'.
9. **Zombie User:** Creation of a profile without a `uid` or with a non-string `role`.
10. **Data Poisoning:** Injecting a 2MB string into `User.displayName`.
11. **Future Leave Tampering:** Updating `startDate` on an already approved/rejected leave request.
12. **Anonymous Spam:** Unauthenticated user trying to write anything.

## The Test Runner (Plan)
We will implement rules that prevent all of the above.
- `isValidUser`
- `isValidLeave`
- `isValidMessage`
- `isAdmin` (via lookups)

[Proceeding to DRAFT_firestore.rules...]
