# Update: Play Again Requires Confirmation

## Change Summary
The "Play Again" button in the "New Game" modal now requires confirmation from the opponent, just like the "Request Reset" button.

## What Changed

### Before
- Clicking "Play Again with [Opponent]" immediately reset the game
- No confirmation required from opponent
- Could be disruptive if opponent wasn't ready

### After
- Clicking "Play Again with [Opponent]" sends a request
- Shows toast: "Play again request sent to opponent"
- Button disabled and shows "Request Pending..." while waiting
- Opponent receives confirmation modal
- Game only resets after opponent accepts

## User Flow

### Player A wants to play again:
1. Game ends (win/draw)
2. Clicks "New Game" button
3. Modal appears with two options
4. Clicks "Play Again with [Opponent Name]"
5. Modal closes
6. Button becomes disabled showing "Request Pending..."
7. Toast: "Play again request sent to opponent"

### Player B receives request:
1. Confirmation modal pops up
2. Shows: "[Player A] wants to reset the game and start fresh"
3. Two options:
   - **Accept & Reset Game** → Game resets, both players notified
   - **Decline** → Request cancelled, both players notified

## Code Changes

### `packages/frontend/src/components/Game.tsx`

**Updated `handlePlayAgain()` function:**
```typescript
const handlePlayAgain = async () => {
  // Request reset to play again with same opponent (requires confirmation)
  if (!myPlayerSymbol) return;
  
  try {
    await requestReset.mutateAsync(myPlayerSymbol);
    setShowNewGameModal(false);
    setToastMessage('Play again request sent to opponent');
    setToastType('info');
    setShowToast(true);
  } catch (error) {
    alert('Failed to request play again');
  }
};
```

**Updated button state:**
- Disabled when: `requestReset.isPending` OR `game.resetRequestedBy` exists
- Text changes to: "Request Pending..." when request is active
- Shows opponent name when no request pending

**Updated info box:**
- Old: "Resets the board and notifies your opponent to start a fresh match."
- New: "Sends a request to your opponent. They must accept before the game resets."

## Benefits

### User Experience
✅ Prevents unwanted resets
✅ Requires mutual agreement to start new game
✅ Both players know when opponent wants to continue
✅ Respectful of opponent's time
✅ Clear feedback with toast notifications

### Consistency
✅ Both "Request Reset" and "Play Again" work the same way
✅ Unified confirmation flow
✅ Same modal UI for both scenarios
✅ Consistent terminology

## Technical Details

Both buttons now use the same backend endpoints:
- `POST /games/:id/reset-request` - Send request
- `POST /games/:id/reset-confirm` - Accept request
- `POST /games/:id/reset-deny` - Decline request

The confirmation modal is shared between both flows, showing:
- Who requested the reset
- Accept/Decline buttons
- Explanation of what will happen

## Complete Flow Comparison

### "Play Again" (New Game Modal)
```
Player A                          Player B
   │                                 │
   │ Clicks "Play Again"            │
   ├─────────────────────────────→ │
   │ (Reset request sent)           │
   │                                 │
   │                      Modal appears
   │                                 │
   │              Accept or Decline │
   │←─────────────────────────────┤
   │                                 │
Both see result (reset or denied)
```

### "Request Reset" (Game Board Button)
```
Player A                          Player B
   │                                 │
   │ Clicks "Request Reset"         │
   ├─────────────────────────────→ │
   │ (Reset request sent)           │
   │                                 │
   │                      Modal appears
   │                                 │
   │              Accept or Decline │
   │←─────────────────────────────┤
   │                                 │
Both see result (reset or denied)
```

Both flows are identical!

## Testing

### Test "Play Again" Flow
1. Complete a game
2. Click "New Game"
3. Click "Play Again with [Opponent]"
4. Verify toast: "Play again request sent"
5. Verify button shows "Request Pending..."
6. On other browser, verify modal appears
7. Click "Accept"
8. Verify both see: "Game reset! Starting fresh"
9. Verify board is cleared

### Test Decline Flow
1. Request play again
2. Opponent clicks "Decline"
3. Verify requester's modal can be opened again
4. Verify button returns to normal state

### Test Multiple Requests
1. Click "Request Reset" from game board
2. Try clicking "Play Again" from modal
3. Verify only one request can be active
4. Verify button states are correct

## Status
✅ Implemented and ready to test

## Related Files
- `packages/frontend/src/components/Game.tsx` - Updated play again handler
- Backend reset endpoints (already implemented)
- Confirmation modal (shared between both flows)
