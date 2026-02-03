# Change: Game Status "finished" → "done"

## Summary
Changed the game status value from "finished" to "done" when a game ends (win or draw).

## Reason
Using "done" is:
- ✅ Shorter and more concise
- ✅ Common in task/game state management
- ✅ Clearer intent (game is complete)
- ✅ Better API/database terminology

## Changes Made

### Backend

**File: `packages/backend/src/game-logic.ts`**
- Updated `Game` interface: `status: 'waiting' | 'playing' | 'done'`
- Updated `GameState` interface: `status: 'waiting' | 'playing' | 'done'`

**File: `packages/backend/src/routes.ts`**
- Line 200: Changed `const newStatus = newWinner ? 'done' : 'playing';`

### Frontend

**File: `packages/frontend/src/types.ts`**
- Updated `GameState` interface: `status: 'waiting' | 'playing' | 'done'`

### Database

**Migration:** Updated existing games
```sql
UPDATE games SET status = 'done' WHERE status = 'finished';
```

Result: 0 games updated (no finished games existed)

## Status Values

| Value | Meaning |
|-------|---------|
| `waiting` | Game created, waiting for second player to join |
| `playing` | Both players joined, game in progress |
| `done` | Game completed (win or draw) |

## Usage in Code

### Setting Status
```typescript
// When game ends
const newStatus = newWinner ? 'done' : 'playing';
```

### Checking Status
```typescript
// Frontend
if (game.status === 'done') {
  // Game is over
}

// Check if game is active
const canPlay = game.status === 'playing' && !game.winner;
```

## API Response

**Example game state when done:**
```json
{
  "id": "abc123",
  "board": ["X", "O", "X", "O", "X", "O", null, null, null],
  "currentPlayer": "O",
  "winner": "X",
  "status": "done",
  "playerXName": "Alice",
  "playerOName": "Bob"
}
```

## Backward Compatibility

⚠️ **Breaking Change**: API clients expecting "finished" will need to update to "done"

However, this is an internal app with no external consumers, so this is safe to change.

## Testing

### Verify Status Updates

1. **Play a game to completion**
   - Start a game
   - Make moves until someone wins
   - Check game status in response: should be "done"

2. **Check draw**
   - Fill entire board with no winner
   - Check game status: should be "done"

3. **Check database**
   ```sql
   SELECT id, status, winner FROM games;
   ```
   Should show "done" for completed games

### Query Examples

```sql
-- Get all active games
SELECT * FROM games WHERE status = 'playing';

-- Get all completed games
SELECT * FROM games WHERE status = 'done';

-- Get waiting games
SELECT * FROM games WHERE status = 'waiting';

-- Get games by completion
SELECT status, COUNT(*) FROM games GROUP BY status;
```

## Benefits

### Code Clarity
✅ Shorter property value
✅ More concise logs
✅ Standard terminology

### API Responses
✅ Smaller JSON payloads (marginally)
✅ More professional naming
✅ Matches common game/task APIs

### Database
✅ Clearer query intent
✅ Easier to read in database tools
✅ Standard state machine pattern

## Related Files
- `packages/backend/src/game-logic.ts` - Type definitions
- `packages/backend/src/routes.ts` - Status assignment
- `packages/frontend/src/types.ts` - Frontend types

## Status
✅ Fully implemented and migrated
