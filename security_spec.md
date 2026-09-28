# Security Specification: FoodWise AI Institutional Firestore Rules

## 1. Data Invariants

1. **Institutional Authentication Guard**: Only authenticated institutional users (`request.auth != null`) with verified email identity can read or write institutional operational data. Unauthenticated public access is strictly forbidden across all collections.
2. **Identity Integrity**: All mutations that record `createdByUser` must match `request.auth.uid`. Users cannot spoof another staff member's UID.
3. **Surplus & Manifest Atomicity**: Surplus quantities and redistribution delivery states must be updated consistently. Once delivered, records reach terminal state and cannot be rolled back without supervisor authorization.
4. **String & Boundary Sizing**: All document IDs and string fields are strictly bounded (`<= 128` or `<= 512` characters) to prevent Denial of Wallet and payload injection.
5. **No Blanket Reads**: Every collection evaluated enforces authenticated access, with sensitive user profile reads restricted to the user themselves or an institutional administrator.
6. **Immutable Fields**: Document creation timestamps (`createdAt`) and primary owner identifiers (`uid`, `createdByUser`) cannot be mutated during updates.

## 2. The "Dirty Dozen" Payloads

1. **Unauthenticated Read on Inventory**: Public visitor attempting `GET /inventory/inv-101` -> **PERMISSION_DENIED**.
2. **Unauthenticated Waste Write**: Anonymous caller attempting `POST /waste_entries` -> **PERMISSION_DENIED**.
3. **User Profile Hijacking**: User `staff_A` attempting to write into `users/staff_B` -> **PERMISSION_DENIED**.
4. **Identity Spoofing in Waste Log**: User `uid_123` submitting `createdByUser: "admin_456"` -> **PERMISSION_DENIED**.
5. **Surplus Terminal State Tampering**: Modifying a completed delivery record from `Delivered` back to `Available` -> **PERMISSION_DENIED**.
6. **Oversized String Injection**: Submitting an inventory item with a 50KB name string -> **PERMISSION_DENIED**.
7. **Invalid Path Injection**: Document path with non-alphanumeric junk characters (e.g. `../../etc`) -> **PERMISSION_DENIED**.
8. **Shadow Field Injection**: Writing into `inventory` with an unapproved shadow attribute `__shadowPrivilege: true` -> **PERMISSION_DENIED**.
9. **Negative Weight Exploit**: Submitting a waste log with `weightKg: -500` -> **PERMISSION_DENIED**.
10. **Delivery Confirmation Without Verification Code**: Marking dispatch `Received & Verified` without destination or receiver data -> **PERMISSION_DENIED**.
11. **Spoofed Sensor Telemetry**: Writing sensor telemetry with invalid status strings -> **PERMISSION_DENIED**.
12. **Tampering with Past Impact Metrics**: Modifying historical audit snapshots from a non-staff origin -> **PERMISSION_DENIED**.

## 3. Test Runner Outline

Tests verify that each of the Dirty Dozen requests fails with `PERMISSION_DENIED` and that valid authenticated institutional staff can perform legitimate CRUD operations on operational collections.
