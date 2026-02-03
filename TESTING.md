# Testing Guide

This guide will help you test all the new features.

## Prerequisites

Make sure you have:
1. ✅ Installed all dependencies: `npm install`
2. ✅ PostgreSQL running (Docker or local)
3. ✅ Run database migrations: `npm run migrate --workspace=backend`
4. ✅ Both servers running: `npm run dev`

## Test Cases

### 1. Landing Page

**Test**: Initial Load
- [ ] Open `http://localhost:3000`
- [ ] Verify gradient background displays
- [ ] Verify "Tic-Tac-Toe" title is visible
- [ ] Verify name input field is present
- [ ] Verify "Create New Game" button is present
- [ ] Verify "Game ID" input is present
- [ ] Verify "Join Game" button is present

**Test**: Validation
- [ ] Try clicking "Create New Game" without entering a name
- [ ] Verify error message appears: "Please enter your name"
- [ ] Try clicking "Join Game" without entering a name
- [ ] Verify error message appears
- [ ] Try clicking "Join Game" with name but no game ID
- [ ] Verify error message appears

### 2. Creating a Game

**Test**: Basic Flow
- [ ] Enter name "Alice" in the name field
- [ ] Click "Create New Game"
- [ ] Verify redirect to game page `/game/{uuid}`
- [ ] Verify game board is displayed
- [ ] Verify "Waiting for another player to join..." message appears
- [ ] Verify "Copy Game Link" button is visible and prominent
- [ ] Verify Alice's name appears in either X or O player card
- [ ] Verify the other player card shows "Waiting..."
- [ ] Verify "(You)" label appears next to Alice's name

**Test**: Random Assignment
- [ ] Create 5 different games with different names
- [ ] Note which symbol (X or O) each player gets
- [ ] Verify it's not always the same (should be random)

### 3. Joining a Game

**Test**: Join via Link
- [ ] From a created game, click "Copy Game Link"
- [ ] Open the link in an incognito window or different browser
- [ ] Verify join prompt appears
- [ ] Verify name input is focused
- [ ] Enter name "Bob"
- [ ] Click "Join Game"
- [ ] Verify redirect to game board
- [ ] Verify both player names now appear
- [ ] Verify "Waiting..." message disappears
- [ ] Verify turn indicator shows whose turn it is

**Test**: Join via Game ID
- [ ] From landing page, enter name "Charlie"
- [ ] Enter an existing game ID in the "Game ID" field
- [ ] Click "Join Game"
- [ ] Verify successful join
- [ ] Verify both players see each other's names

**Test**: Join Full Game
- [ ] Try to join a game that already has 2 players
- [ ] Verify error message: "Game is full"

### 4. Playing the Game

**Test**: First Move
- [ ] Create game as "Alice"
- [ ] Join as "Bob" in another window
- [ ] Verify X goes first (check whose turn indicator is highlighted)
- [ ] Player with X clicks any cell
- [ ] Verify the X appears in the cell
- [ ] Verify turn indicator switches to the other player
- [ ] Verify both windows update in real-time

**Test**: Turn Enforcement
- [ ] It's Alice's turn
- [ ] Try clicking a cell in Bob's window
- [ ] Verify error: "Not your turn"
- [ ] Verify board doesn't change

**Test**: Occupied Cell
- [ ] Try clicking a cell that already has X or O
- [ ] Verify nothing happens (cell is disabled)
- [ ] Verify no error message (button is disabled)

**Test**: Win Condition - Horizontal
- [ ] Play a game until one player gets 3 in a row horizontally
- [ ] Verify winner message appears: "{Name} wins!"
- [ ] Verify no more moves can be made
- [ ] Verify both players see the winner

**Test**: Win Condition - Vertical
- [ ] Play a game until one player gets 3 in a column
- [ ] Verify winner is detected

**Test**: Win Condition - Diagonal
- [ ] Play a game until one player gets 3 diagonally
- [ ] Verify winner is detected

**Test**: Draw
- [ ] Fill the entire board without a winner
- [ ] Verify "It's a draw!" message appears
- [ ] Verify no more moves can be made

### 5. Real-Time Updates

**Test**: WebSocket Sync
- [ ] Have two browser windows open to same game
- [ ] Make a move in window 1
- [ ] Verify window 2 updates instantly (< 1 second)
- [ ] Make a move in window 2
- [ ] Verify window 1 updates instantly

**Test**: Polling Fallback
- [ ] Open browser dev tools, Network tab
- [ ] Disable WebSocket or close WebSocket connection
- [ ] Make a move
- [ ] Verify other window still updates (within 2 seconds via polling)

### 6. Game Reset

**Test**: Reset After Completion
- [ ] Finish a game (win or draw)
- [ ] Click "Reset Game" button
- [ ] Verify board clears
- [ ] Verify player names remain
- [ ] Verify game status changes to "playing"
- [ ] Verify X goes first again
- [ ] Verify both players can make moves

**Test**: Reset Before Completion
- [ ] Make a few moves (game not finished)
- [ ] Click "Reset Game"
- [ ] Verify board clears and game resets

### 7. UI/UX Elements

**Test**: Responsive Design
- [ ] Resize browser window to mobile size (375px width)
- [ ] Verify layout adjusts appropriately
- [ ] Verify game board is still playable
- [ ] Verify all buttons are accessible
- [ ] Test on actual mobile device if possible

**Test**: Player Cards
- [ ] Verify current player's card is highlighted (border color)
- [ ] Verify inactive player's card is gray
- [ ] Verify X player card has blue accent
- [ ] Verify O player card has red accent
- [ ] Verify "(You)" label appears in your card only

**Test**: Status Messages
- [ ] Waiting state: Verify yellow badge "Waiting for another player..."
- [ ] Your turn: Verify green badge "Your turn!"
- [ ] Other's turn: Verify current player's name is shown
- [ ] Win: Verify winner name is shown
- [ ] Draw: Verify "It's a draw!" message

**Test**: Buttons
- [ ] Hover over buttons, verify hover effects work
- [ ] Verify disabled buttons have reduced opacity
- [ ] Verify disabled buttons don't respond to clicks
- [ ] Verify button shadows appear on hover

### 8. Error Handling

**Test**: Invalid Game ID
- [ ] Enter name on landing page
- [ ] Enter invalid/non-existent game ID
- [ ] Click "Join Game"
- [ ] Verify error page or message appears
- [ ] Verify "Go Home" button works

**Test**: Network Errors
- [ ] Stop the backend server
- [ ] Try to create a game
- [ ] Verify error message appears
- [ ] Restart backend
- [ ] Verify app recovers

**Test**: Database Connection
- [ ] Stop PostgreSQL
- [ ] Try to create a game
- [ ] Verify graceful error handling
- [ ] Restart PostgreSQL
- [ ] Verify app recovers

### 9. Multiple Games

**Test**: Concurrent Games
- [ ] Create game 1 with Alice and Bob
- [ ] Create game 2 with Charlie and Dana
- [ ] Verify each game operates independently
- [ ] Make moves in game 1
- [ ] Verify game 2 is unaffected
- [ ] Verify WebSocket broadcasts only affect relevant game

### 10. Browser Compatibility

**Test**: Different Browsers
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge
- [ ] Verify all features work in each

**Test**: Mobile Browsers
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Verify touch interactions work
- [ ] Verify layout is responsive

## Performance Tests

**Test**: Load Time
- [ ] Clear browser cache
- [ ] Open landing page
- [ ] Verify page loads in < 2 seconds
- [ ] Open game page
- [ ] Verify game loads in < 2 seconds

**Test**: Real-Time Latency
- [ ] Make a move
- [ ] Measure time until other player sees update
- [ ] Should be < 500ms with WebSocket
- [ ] Should be < 2.5s with polling

## Checklist Summary

After testing, you should have verified:
- ✅ Landing page UI with Tailwind styling
- ✅ Player name input and validation
- ✅ Game creation with random X/O assignment
- ✅ Game joining flow with name prompt
- ✅ Player info display on game board
- ✅ Turn indicators and status messages
- ✅ Real-time updates via WebSocket
- ✅ Game rules enforcement
- ✅ Win/draw detection
- ✅ Game reset functionality
- ✅ Responsive design
- ✅ Error handling
- ✅ Multiple concurrent games

## Known Issues to Watch For

- WebSocket connection may fail on some corporate networks (polling fallback should work)
- Very slow networks may have > 2 second delays
- Player names with special characters should be tested
- Very long player names (> 50 chars) may overflow UI

## Reporting Issues

If you find bugs, note:
1. What were you trying to do?
2. What happened instead?
3. Browser and version
4. Console errors (F12 → Console tab)
5. Network requests (F12 → Network tab)
