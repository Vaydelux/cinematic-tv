# Firestore Security Specification

## Data Invariants
- A Watchlist item must have a `movieId` (string limit), `userId` matching the authenticated user's ID, and a valid `createdAt` timestamp.
- A user can only access their own `/users/{userId}/watchlist/{itemId}` items.

## The "Dirty Dozen" Payloads
1. Unauthorized Create: Not signed in.
2. Read Other's Watchlist: Trying to read another user's watchlist.
3. Poison ID Create: Creating an ID of 5KB.
4. Foreign UserId: Setting `userId` to someone else's ID.
5. Missing Required Field: Submitting an item without `movieId`.
6. Incorrect Type: `movieId` as a boolean.
7. Oversized Field: `movieId` > 128 chars.
8. Update userId: Attempt to change `userId` after creation.
9. Ghost Field: Adding an arbitrary `isAdmin: true` field.
10. System Field Tamper: Trying to spoof `createdAt`.
11. Blanket Read: Reading all watchlists.
12. Malformed collection creation.

## Testing Setup
Will be verified via firestore.rules logic structure.
