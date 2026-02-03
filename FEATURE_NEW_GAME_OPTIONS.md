# Feature: New Game Options

## Overview
When a game ends or players want to start fresh, the "New Game" button now opens a modal with two options:
1. **Play Again** - Reset the board and play with the same opponent
2. **Find New Opponent** - Create a completely new game

## User Flow

### Scenario 1: Play Again with Same Opponent

```
Game Ends (Win/Draw)
    ↓
Player clicks "New Game"
    ↓
Modal appears with options
    ↓
Player clicks "Play Again with [Opponent Name]"
    ↓
Board resets, game status returns to 'playing'
    ↓
Opponent receives toast notification: "[Player] wants to play again!"
    ↓
Both players can immediately start playing
```

### Scenario 2: Find New Opponent

```
Game Ends (Win/Draw)
    ↓
Player clicks "New Game"
    ↓
Modal appears with options
    ↓
Player clicks "Find New Opponent"
    ↓
New game created with same player name
    ↓
Player redirected to new game page
    ↓
"Waiting for opponent..." message shown
    ↓
Player can share new game link
```

## UI Components

### New Game Modal
- **Trigger**: "New Game" button click
- **Location**: Fixed overlay (centered on screen)
- **Options**:
  1. Green button: "Play Again with [Opponent Name]"
     - Icon: Refresh/replay icon
     - Action: Resets current game
  2. Blue button: "Find New Opponent"
     - Icon: Add user icon
     - Action: Creates new game
  3. Gray button: "Cancel"
     - Action: Closes modal

### Toast Notification
- **Trigger**: When opponent resets the game
- **Location**: Top-right corner
- **Duration**: 5 seconds (auto-dismiss)
- **Message**: "[Opponent Name] wants to play again!"
- **Type**: Info (blue background)
- **Features**:
  - Slide-in animation
  - Manual close button
  - Auto-dismiss after 5 seconds

## Technical Implementation

### Files Created

**`packages/frontend/src/components/Toast.tsx`**
- Reusable toast notification component
- Support for info/success/warning types
- Auto-dismiss with configurable duration
- Slide-in animation

### Files Modified

**`packages/frontend/src/components/Game.tsx`**
- Added `showNewGameModal` state
- Added `showToast` and `toastMessage` state
- Added `lastBoardState` to track board changes
- Added `handleNewGameClick()` - Opens modal
- Added `handlePlayAgain()` - Resets game
- Added `handleNewOpponent()` - Creates new game
- Added useEffect to detect opponent's reset
- Updated "New Game" button to open modal
- Added modal UI with both options
- Added Toast component

**`packages/frontend/src/index.css`**
- Added slide-in animation keyframes
- Added `.animate-slide-in` utility class

### State Management

```typescript
// Modal state
const [showNewGameModal, setShowNewGameModal] = useState(false);

// Toast state
const [showToast, setShowToast] = useState(false);
const [toastMessage, setToastMessage] = useState('');

// Track board changes for notification
const [lastBoardState, setLastBoardState] = useState<string>('');
```

### Detection Logic

The component detects when the opponent resets the board:

```typescript
useEffect(() => {
  const currentBoardState = JSON.stringify(game.board);
  
  // If board went from having moves to being empty
  if (lastBoardState !== '[]' && 
      currentBoardState === JSON.stringify(Array(9).fill(null))) {
    // Show notification
    const opponentName = myPlayerSymbol === 'X' ? 
      game.playerOName : game.playerXName;
    setToastMessage(`${opponentName} wants to play again!`);
    setShowToast(true);
  }
  
  setLastBoardState(currentBoardState);
}, [game?.board]);
```

## API Usage

### Play Again (Reset)
```http
POST /api/games/:id/reset

Response: GameState with empty board, status='playing'
```

### Find New Opponent (Create)
```http
POST /api/games
Content-Type: application/json

{
  "playerName": "Alice"
}

Response: New GameState with unique ID
```

## Benefits

### User Experience
✅ Clear options for next steps after game ends
✅ No confusion about what "New Game" does
✅ Real-time notification when opponent wants rematch
✅ Keeps players engaged with quick rematch option
✅ Easy to find new opponents

### Technical
✅ Reuses existing game state
✅ Minimal API calls
✅ Real-time sync via WebSocket
✅ Smooth animations and transitions

## Testing

### Test Case 1: Play Again Flow
1. Complete a game (win or draw)
2. Click "New Game"
3. Verify modal appears
4. Click "Play Again with [Opponent]"
5. Verify board resets
6. Check opponent's browser for toast notification
7. Verify both players can play immediately

### Test Case 2: New Opponent Flow
1. Click "New Game" during any game
2. Click "Find New Opponent"
3. Verify redirect to new game
4. Verify new unique game ID
5. Verify "Waiting for opponent..." message
6. Verify "Copy Game Link" button present

### Test Case 3: Toast Notification
1. Have two browsers open to same game
2. In browser A, reset the game (play again)
3. Verify browser B shows toast notification
4. Verify notification auto-dismisses after 5s
5. Verify manual close button works

### Test Case 4: Modal Cancel
1. Click "New Game"
2. Modal appears
3. Click "Cancel"
4. Verify modal closes
5. Verify game state unchanged

## Edge Cases Handled

✅ **Modal during waiting**: Modal works even when waiting for opponent
✅ **Multiple resets**: Toast only shows for actual resets (not initial load)
✅ **Concurrent actions**: Disable buttons during pending operations
✅ **Navigation**: Modal closes when navigating away
✅ **Toast stacking**: Only one toast shown at a time

## Future Enhancements

Potential improvements:
- Add "Best of 3" or "Best of 5" series mode
- Track wins/losses per player pair
- Add rematch counter
- Add "Revenge!" label when losing player initiates rematch
- Add sound effects for notifications
- Add rematch history

## Accessibility

- Modal has proper z-index layering
- Buttons have clear labels and icons
- Toast has manual close option
- Keyboard navigation support (implicit through buttons)
- Screen reader friendly text

## Performance

- Toast auto-dismisses to prevent memory leaks
- Modal unmounts when hidden
- Efficient board state comparison
- No unnecessary re-renders

## Related Files

- `packages/frontend/src/components/Toast.tsx` - Toast component
- `packages/frontend/src/components/Game.tsx` - Main game logic
- `packages/frontend/src/index.css` - Animations
- `packages/backend/src/routes.ts` - Reset endpoint

## Status
✅ Implemented and ready for testing
