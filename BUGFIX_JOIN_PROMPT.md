# Bug Fix: Join Prompt Shown to Game Creator

## Issue
When creating a game, users were incorrectly shown the "Join Game" prompt instead of seeing the game board with the "Copy Game Link" button.

## Root Cause
The `Home` component was not passing the player's name to the `Game` component when navigating after game creation. Without this information, the `Game` component couldn't identify the creator as an existing player.

## Files Changed

### 1. `packages/frontend/src/components/Home.tsx`
**Line 21**: Added `search` parameter to pass player name

```typescript
// Before
navigate({ to: '/game/$gameId', params: { gameId: game.id } });

// After
navigate({ 
  to: '/game/$gameId', 
  params: { gameId: game.id },
  search: { playerName: playerName.trim() }
});
```

### 2. `packages/frontend/src/components/Game.tsx`
**Lines 32-66**: Reordered logic to check for existing player first

```typescript
// New logic flow:
1. Check if user's name from URL matches either player in the game
   - If yes, identify them and mark as joined (no prompt needed)
2. Check if both players are present but user isn't one of them
   - If yes, show join prompt (spectator or wrong URL)
3. Check if one slot is open and name provided
   - If yes, auto-join them
4. Otherwise, show join prompt
```

## Expected Behavior After Fix

### Creating a Game
1. User enters name "Alice" on landing page
2. Clicks "Create New Game"
3. **Immediately sees game board** with:
   - Their name displayed (Alice as X or O)
   - "Waiting for another player..." message
   - Prominent "Copy Game Link" button
   - "(You)" label next to their name

### Joining a Game
1. User opens shared game link
2. Prompted to enter their name
3. Clicks "Join Game"
4. Sees game board with both player names

## Testing

To verify the fix works:

```bash
# 1. Ensure dev server is running
npm run dev

# 2. Open http://localhost:3000
# 3. Enter name "Alice"
# 4. Click "Create New Game"
# 5. Should immediately see game board (NOT join prompt)
# 6. Should see "Copy Game Link" button
# 7. Should see "Alice" in either X or O card with "(You)" label
```

## Technical Details

The fix ensures the creator's identity is preserved through:
- URL search parameters (`?playerName=Alice`)
- Database state (player already in DB from creation)
- Client-side state management (React state for `myPlayerSymbol` and `hasJoined`)

## Related Issues Prevented

This fix also prevents:
- Creator needing to "join" their own game
- Confusion about which player the creator is
- Unnecessary API calls to the join endpoint
- Race conditions with game state

## Status
✅ Fixed and tested
