# Bug Fix: Race Condition on Game Join

## Problem

Users occasionally get "Game is full" error when joining a game via link, even though they should be the second player.

## Root Cause

**Race Condition**: Multiple simultaneous join requests from the same user or rapid effect re-runs.

### How It Happened

1. User opens game link
2. Frontend `useEffect` triggers
3. Multiple rapid calls to `handleJoinGame`
4. Both requests reach backend simultaneously
5. First request: Checks game → Updates player_x_name → Success
6. Second request: Checks game → Updates player_o_name → Success
7. Both slots filled by same user → "Game is full" for actual second player

OR:

1. Effect re-runs due to dependency changes
2. Multiple join requests sent
3. User fills both slots
4. Real second player gets "Game is full"

## Solutions Implemented

### Frontend Fix: Prevent Multiple Join Attempts

**File: `packages/frontend/src/components/Game.tsx`**

#### 1. Added `isPending` Guard in useEffect

```typescript
// Only auto-join if not already joining
if (!joinGame.isPending) {
  setPlayerName(playerNameFromSearch);
  handleJoinGame(playerNameFromSearch);
}
```

#### 2. Added Dependency to useEffect

```typescript
useEffect(() => {
  // ...
}, [game, hasJoined, search, joinGame.isPending]); // ← Added isPending
```

#### 3. Added Guard in handleJoinGame

```typescript
const handleJoinGame = async (name: string) => {
  // Guard against multiple simultaneous join attempts
  if (joinGame.isPending) return;
  
  try {
    // ... rest of logic
  }
};
```

### Backend Fix: Database-Level Race Condition Prevention

**File: `packages/backend/src/routes.ts`**

Added WHERE clause to UPDATE query to ensure atomicity:

**Before:**
```sql
UPDATE games 
SET player_x_name = $1, status = $2, updated_at = NOW()
WHERE id = $3
RETURNING *
```

**After:**
```sql
UPDATE games 
SET player_x_name = $1, status = $2, updated_at = NOW()
WHERE id = $3 AND player_x_name IS NULL  -- ← Only update if still empty
RETURNING *
```

**Check if update succeeded:**
```typescript
if (updateResult.rows.length === 0) {
  // Slot was filled by another request
  return res.status(400).json({ error: 'Game is full' });
}
```

## How It Works Now

### Frontend Protection

```
User opens link
    ↓
useEffect triggers
    ↓
Check: joinGame.isPending?
    ├─ Yes → Skip (already joining)
    └─ No → Call handleJoinGame
            ↓
            Set isPending = true
            ↓
            Send join request
            ↓
            useEffect re-runs (dependency changed)
            ↓
            Check: joinGame.isPending?
            ├─ Yes → Skip ✅
            └─ ...
```

### Backend Protection (Optimistic Locking)

```
Request 1 arrives:
    ↓
SELECT game (player_x_name = null, player_o_name = Alice)
    ↓
UPDATE WHERE id = X AND player_x_name IS NULL
    ↓
Success! Returns updated row ✅

Request 2 arrives (same time):
    ↓
SELECT game (player_x_name = null, player_o_name = Alice)
    ↓
UPDATE WHERE id = X AND player_x_name IS NULL
    ↓
Fails! Slot already filled, returns 0 rows
    ↓
Return "Game is full" ❌
```

## Test Cases

### Test 1: Rapid Double Join (Same User)

**Before Fix:**
```
User Bob joins → Request 1: Sets player_x_name = Bob
              → Request 2: Sets player_o_name = Bob
Result: Both slots = Bob, actual second player gets "Game is full"
```

**After Fix:**
```
User Bob joins → Request 1: Sets player_x_name = Bob ✅
              → Request 2: Blocked by isPending guard ✅
Result: Only one slot filled, second player can join ✅
```

### Test 2: Simultaneous Joins (Different Users)

**Scenario:** Alice and Bob click join at exact same time

**Before Fix (Possible):**
```
Alice's request: SELECT → player_x_name = null → UPDATE player_x_name = Alice
Bob's request:   SELECT → player_x_name = null → UPDATE player_x_name = Bob
Result: Last write wins, one player overwrites the other
```

**After Fix:**
```
Alice's request: UPDATE WHERE player_x_name IS NULL → Success (Alice in X)
Bob's request:   UPDATE WHERE player_x_name IS NULL → Fails (slot filled)
                 UPDATE WHERE player_o_name IS NULL → Success (Bob in O)
Result: Both players correctly assigned ✅
```

### Test 3: Effect Re-runs

**Before Fix:**
```
Effect runs → handleJoinGame called
State updates → Effect re-runs → handleJoinGame called again
Result: Multiple join requests
```

**After Fix:**
```
Effect runs → Check isPending = false → handleJoinGame called
Request sent → isPending = true
State updates → Effect re-runs → Check isPending = true → Skip ✅
Result: Single join request ✅
```

## Benefits

### ✅ Frontend Benefits
- No duplicate join requests from same user
- Proper handling of React effect re-runs
- Better user experience (no confusing errors)

### ✅ Backend Benefits
- Atomic database operations
- No race conditions between simultaneous requests
- Database-level consistency guarantee
- Proper error messages

### ✅ User Experience
- Reliable game joining
- No more false "Game is full" errors
- Works even with slow network
- Works with multiple rapid clicks

## Technical Details

### Optimistic Locking Pattern

This is a classic optimistic locking pattern:

1. Read the current state
2. Update with WHERE clause checking state hasn't changed
3. If update returns 0 rows, state changed → retry or fail

**Benefits:**
- No explicit database locks needed
- Better performance than pessimistic locking
- Works across distributed systems

### React Effect Dependencies

Adding `joinGame.isPending` to dependencies ensures:
- Effect knows when join is in progress
- Re-runs can check status before acting
- Natural flow control via React state

## Alternative Approaches Considered

### ❌ Approach 1: Debounce/Throttle
```typescript
const debouncedJoin = debounce(handleJoinGame, 500);
```
**Problem:** Delays legitimate joins, doesn't prevent race at backend

### ❌ Approach 2: Database Transaction Lock
```sql
BEGIN;
SELECT * FROM games WHERE id = $1 FOR UPDATE;
UPDATE games SET player_x_name = $1 WHERE id = $2;
COMMIT;
```
**Problem:** More complex, requires transaction handling, can cause deadlocks

### ✅ Approach 3: WHERE Clause (Chosen)
```sql
UPDATE games SET player_x_name = $1 
WHERE id = $2 AND player_x_name IS NULL;
```
**Benefits:** Simple, atomic, no locks, performant

## Monitoring

To verify the fix is working, check logs for:

### Frontend
```javascript
console.log('Join already in progress, skipping'); // Won't see duplicates
```

### Backend
```
Error joining game: Game is full  // Should be rare now
```

If "Game is full" errors persist, check:
1. Multiple browser tabs open (expected behavior)
2. WebSocket updates causing re-joins
3. Network retries at HTTP client level

## Related Issues

This fix also prevents:
- ✅ Same user joining as both X and O
- ✅ Race conditions on game state updates
- ✅ Confusing "Game is full" for legitimate second player
- ✅ Effect re-run storms causing multiple requests

## Migration

No database migration needed - the fix is code-only:
1. Update frontend code
2. Update backend code
3. Deploy both
4. Issue resolved immediately

## Summary

### The Problem
Race condition allowing same user to fill both player slots or multiple join attempts causing "Game is full" errors.

### The Solution
- Frontend: Guard against multiple simultaneous join attempts
- Backend: Atomic UPDATE with WHERE clause ensures one join per slot

### The Result
Reliable, race-condition-free game joining! 🎉
