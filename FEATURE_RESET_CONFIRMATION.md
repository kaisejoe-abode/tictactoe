# Feature: Reset Game with Opponent Confirmation

## Overview
The "Reset Game" button now requires confirmation from the opponent before the game is reset. This prevents accidental resets and ensures both players agree to start fresh.

## User Flow

### Player A Requests Reset

```
Player A clicks "Request Reset"
    ↓
Button changes to "Reset Requested..."
    ↓
Toast notification: "Reset request sent to opponent"
    ↓
WebSocket broadcasts to Player B
    ↓
Player B sees confirmation modal
```

### Player B Receives Request

```
Confirmation modal appears on Player B's screen
    ↓
Modal shows: "[Player A] wants to reset the game"
    ↓
Player B has two options:
    1. Accept & Reset Game (Green button)
    2. Decline (Red button)
```

### If Player B Accepts

```
Player B clicks "Accept & Reset Game"
    ↓
Game board resets
    ↓
Both players see toast: "Game reset! Starting fresh with [opponent]"
    ↓
Game status = 'playing'
    ↓
Both players can play immediately
```

### If Player B Declines

```
Player B clicks "Decline"
    ↓
Reset request is cancelled
    ↓
Player B sees toast: "Reset request denied"
    ↓
Player A sees their button return to "Request Reset"
    ↓
Game continues unchanged
```

## Database Schema

### New Column
```sql
reset_requested_by VARCHAR(1)
```

Stores which player ('X' or 'O') requested the reset, or NULL if no request is pending.

## API Endpoints

### Request Reset
```http
POST /api/games/:id/reset-request
Content-Type: application/json

{
  "player": "X"
}

Response: GameState with resetRequestedBy = "X"
```

### Confirm Reset
```http
POST /api/games/:id/reset-confirm

Response: GameState with empty board, resetRequestedBy = null
```

### Deny Reset
```http
POST /api/games/:id/reset-deny

Response: GameState with resetRequestedBy = null
```

## UI Components

### Request Reset Button
**States:**
- Default: "Request Reset" (blue)
- After request: "Reset Requested..." (blue, disabled)
- Waiting for opponent: Disabled

### Confirmation Modal (Player B)
**Elements:**
- Yellow warning icon
- Title: "Reset Game Request"
- Message: "[Player Name] wants to reset the game and start fresh."
- Accept button (green): "Accept & Reset Game"
- Decline button (red): "Decline"
- Info box: Explanation of what will happen

### Toast Notifications

1. **Request Sent** (Player A)
   - Type: Info (blue)
   - Message: "Reset request sent to opponent"

2. **Request Denied** (Player B)
   - Type: Warning (yellow)
   - Message: "Reset request denied"

3. **Game Reset** (Both players)
   - Type: Success (green)
   - Message: "Game reset! Starting fresh with [opponent]"

## Technical Implementation

### Backend Files Modified

**`packages/backend/scripts/migrate.js`**
- Added `reset_requested_by VARCHAR(1)` column

**`packages/backend/src/game-logic.ts`**
- Added `resetRequestedBy` to `GameState` interface

**`packages/backend/src/routes.ts`**
- Added `POST /games/:id/reset-request`
- Added `POST /games/:id/reset-confirm`
- Added `POST /games/:id/reset-deny`
- Updated `dbRowToGameState()` to include `resetRequestedBy`
- Kept old `/reset` endpoint for backward compatibility

### Frontend Files Modified

**`packages/frontend/src/types.ts`**
- Added `resetRequestedBy: Player | null` to `GameState`

**`packages/frontend/src/api.ts`**
- Added `requestReset()`
- Added `confirmReset()`
- Added `denyReset()`

**`packages/frontend/src/queries.ts`**
- Added `useRequestReset()` hook
- Added `useConfirmReset()` hook
- Added `useDenyReset()` hook

**`packages/frontend/src/components/Game.tsx`**
- Added `showResetConfirmModal` state
- Added `toastType` state for different toast colors
- Added useEffect to detect reset requests
- Updated `handleReset()` to request instead of reset
- Added `handleConfirmReset()`
- Added `handleDenyReset()`
- Updated button text and disabled logic
- Added confirmation modal UI

## State Management

### Database State
```typescript
reset_requested_by: 'X' | 'O' | null
```

### Frontend State
```typescript
showResetConfirmModal: boolean  // Show modal to opponent
toastType: 'info' | 'success' | 'warning'  // Toast color
```

## Real-time Sync

All reset actions broadcast via WebSocket:
1. Request sent → Opponent receives update
2. Confirmation → Both players receive reset state
3. Denial → Requester receives cleared state

## Edge Cases Handled

✅ **Request already pending**: Button disabled when `resetRequestedBy` is set
✅ **Waiting for player**: Reset disabled when only one player present
✅ **Game finished**: Can still request reset after win/draw
✅ **Modal auto-close**: Modal closes automatically after accept/deny
✅ **Network errors**: Toast notifications on failure
✅ **Multiple requests**: Only one request can be pending at a time

## Button States

| Condition | Button Text | Disabled | Reason |
|-----------|-------------|----------|---------|
| Normal | "Request Reset" | No | Ready to request |
| After request | "Reset Requested..." | Yes | Waiting for opponent |
| Waiting for player | "Request Reset" | Yes | Need 2 players |
| Opponent requested | "Request Reset" | Yes | Modal shown instead |

## Testing Checklist

### Test Case 1: Basic Flow
- [ ] Player A clicks "Request Reset"
- [ ] Button changes to "Reset Requested..."
- [ ] Player A sees toast: "Reset request sent"
- [ ] Player B sees confirmation modal
- [ ] Player B clicks "Accept"
- [ ] Both see toast: "Game reset!"
- [ ] Board is cleared
- [ ] Both can play

### Test Case 2: Denial Flow
- [ ] Player A requests reset
- [ ] Player B clicks "Decline"
- [ ] Player B sees toast: "Reset request denied"
- [ ] Player A's button returns to "Request Reset"
- [ ] Game continues unchanged

### Test Case 3: Edge Cases
- [ ] Cannot request reset when waiting for player
- [ ] Cannot request reset twice (button disabled)
- [ ] Modal doesn't show to requester
- [ ] WebSocket updates both clients
- [ ] Toast auto-dismisses after 5 seconds

## Benefits

### User Experience
✅ Prevents accidental resets
✅ Requires mutual agreement
✅ Clear feedback for both players
✅ Non-intrusive (modal only for recipient)
✅ Toast notifications keep players informed

### Technical
✅ Real-time sync via WebSocket
✅ Database tracks request state
✅ Backward compatible (old endpoint still works)
✅ Proper error handling
✅ Clean state management

## Migration Required

For existing installations:

```sql
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS reset_requested_by VARCHAR(1);
```

Or run the updated migration script:
```bash
npm run migrate --workspace=backend
```

## Future Enhancements

Potential improvements:
- Timeout for requests (auto-deny after 30 seconds)
- Allow cancelling your own request
- Show pending request indicator on game board
- Add "Always accept resets" preference
- Track reset count per game

## Comparison: Before vs After

### Before
- Click "Reset Game" → Instant reset
- No opponent input required
- Could reset accidentally
- Disruptive to opponent

### After
- Click "Request Reset" → Send request
- Opponent must confirm
- Prevents accidents
- Respectful of opponent's time

## Status
✅ Implemented and ready for testing
