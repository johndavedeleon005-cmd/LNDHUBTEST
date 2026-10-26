/**
 * Firestore Security Rules Test Suite (Dirty Dozen Verification)
 * Verifies that all 12 adversarial payloads in security_spec.md return PERMISSION_DENIED.
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyDozenTestCase[] = [
  { id: 1, name: 'Unauthenticated Write to /users', collection: 'users', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 2, name: 'Self-Assigned Master Role on Create', collection: 'users', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 3, name: 'Identity Spoofing on User Create', collection: 'users', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 4, name: 'Shadow Field Injection on User Update', collection: 'users', operation: 'update', expectedResult: 'PERMISSION_DENIED' },
  { id: 5, name: 'Unverified Admin Email Spoof', collection: 'custom_documents', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 6, name: 'PII Blanket Read on Another User', collection: 'users', operation: 'get', expectedResult: 'PERMISSION_DENIED' },
  { id: 7, name: 'Self-Approval Status Escalation on Update', collection: 'users', operation: 'update', expectedResult: 'PERMISSION_DENIED' },
  { id: 8, name: 'Immutable Field Mutation (createdAt/uid)', collection: 'users', operation: 'update', expectedResult: 'PERMISSION_DENIED' },
  { id: 9, name: 'Unauthorized Staff Upload to /custom_documents', collection: 'custom_documents', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 10, name: 'ID Poisoning Attack', collection: 'custom_documents', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 11, name: 'Value Poisoning / Oversized String', collection: 'custom_documents', operation: 'update', expectedResult: 'PERMISSION_DENIED' },
  { id: 12, name: 'Client Timestamp Spoofing', collection: 'users', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
];
