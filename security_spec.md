# Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Default Deny**: All unmatched paths in Firestore are strictly denied (`allow read, write: if false;`).
2. **Master Admin Authority**: Only verified administrators (`johndavedeleon005@gmail.com` with `email_verified == true` or a UID present in `/admins/{uid}`) can approve/reject staff accounts or upload/modify/delete documents in `/custom_documents/{docId}`.
3. **Zero Self-Privilege Escalation**: Standard users registering `/users/{userId}` can only create a profile for their own `request.auth.uid` with `role == 'staff'` and `status == 'pending'`. They can never self-assign `role == 'master'` or `status == 'approved'`.
4. **PII Isolation**: `/users/{userId}` contains `email` and staff metadata; `get` and `list` are strictly restricted to the document owner (`resource.data.uid == request.auth.uid`) or `isAdmin()`. Blanket `isSignedIn()` reads on `/users` are forbidden.
5. **Strict Schema & Size Validation**: Every string field has explicit `.size()` bounds matching `firebase-blueprint.json`, and every ID path variable is validated with `isValidId()`.
6. **Temporal Integrity**: `createdAt` and `updatedAt` must equal `request.time` on creation, `createdAt` is immutable on update, and `updatedAt` must equal `request.time` on update.

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Write**: `auth = null` attempting to create `/users/user_1`.
2. **Self-Assigned Master Role**: Standard user creating `/users/user_1` with `role: 'master', status: 'approved'`.
3. **Identity Spoofing on User Create**: Authenticated `user_1` creating `/users/user_2` or setting `uid: 'user_2'`.
4. **Shadow Field Injection on User Update**: Authenticated `user_1` updating `/users/user_1` with an undeclared key `isSuperAdmin: true`.
5. **Unverified Admin Email Spoof**: User with `email: 'johndavedeleon005@gmail.com'` but `email_verified: false` attempting to approve a user or upload a custom document.
6. **PII Blanket Read on Users**: Authenticated `user_1` attempting `get` or `list` on `/users/user_2`.
7. **Privilege Escalation on User Update**: Pending staff `user_1` attempting to update their own `status` from `'pending'` to `'approved'`.
8. **Immutable Field Mutation**: Approved user attempting to mutate `createdAt` or `email` or `uid` during profile update.
9. **Unauthorized Document Upload**: Non-admin staff user attempting to create `/custom_documents/doc_1`.
10. **ID Poisoning Attack**: Attempting to create `/custom_documents/bad..id$$` or an ID exceeding 128 characters.
11. **Value Poisoning / Oversized Payload**: Admin attempting to update `/custom_documents/doc_1` with `title` as a number or exceeding 240 chars.
12. **Client Timestamp Spoofing**: Submitting a past or future `createdAt` or `updatedAt` timestamp instead of `request.time`.
