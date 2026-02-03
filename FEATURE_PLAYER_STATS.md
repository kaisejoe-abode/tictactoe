# Feature: Player Statistics Display

## Summary
Displays a player's win/loss/draw statistics at the top of the game board page. Stats are calculated from all completed games in the database and update automatically when games finish.

## User Experience

### Statistics Display
At the top of the game board, players see their personal statistics:
- **Wins**: Number of games won
- **Losses**: Number of games lost
- **Draws**: Number of tied games
- **Total**: Total number of completed games

### Visual Design
- Beautiful gradient card (purple-to-pink gradient)
- Four-column grid layout showing all stats
- Color-coded numbers:
  - 🟢 Wins: Green
  - 🔴 Losses: Red
  - 🟡 Draws: Yellow
  - 🔵 Total: Blue
- Responsive design that works on all screen sizes

## Implementation

### Backend

**New Endpoint: `GET /api/players/:playerName/stats`**

**File: `packages/backend/src/routes.ts`**

```typescript
router.get('/players/:playerName/stats', async (req: Request, res: Response) => {
  const { playerName } = req.params;
  const name = decodeURIComponent(playerName.trim());

  // Query all completed games where the player participated
  const result = await query(
    `SELECT 
      winner,
      player_x_name,
      player_o_name
     FROM games 
     WHERE status = 'done' 
       AND (LOWER(player_x_name) = LOWER($1) OR LOWER(player_o_name) = LOWER($1))`,
    [name]
  );

  // Calculate wins, losses, draws
  // ...

  res.json({ playerName: name, wins, losses, draws, totalGames });
});
```

**Query Logic:**
1. Find all completed games (`status = 'done'`)
2. Filter where player participated (either as X or O)
3. Case-insensitive name matching
4. Calculate stats by checking winner field

**Stats Calculation:**
```typescript
result.rows.forEach((game) => {
  if (game.winner === 'draw') {
    draws++;
  } else if (
    (game.winner === 'X' && game.player_x_name.toLowerCase() === name.toLowerCase()) ||
    (game.winner === 'O' && game.player_o_name.toLowerCase() === name.toLowerCase())
  ) {
    wins++;
  } else {
    losses++;
  }
});
```

### Frontend

**File: `packages/frontend/src/types.ts`**

New interface:
```typescript
export interface PlayerStats {
  playerName: string;
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
}
```

**File: `packages/frontend/src/api.ts`**

New API method:
```typescript
getPlayerStats: async (playerName: string): Promise<PlayerStats> => {
  const encodedName = encodeURIComponent(playerName);
  const response = await fetch(`${API_URL}/api/players/${encodedName}/stats`);
  if (!response.ok) throw new Error('Failed to fetch player stats');
  return response.json();
}
```

**File: `packages/frontend/src/queries.ts`**

New query hook:
```typescript
export const usePlayerStats = (playerName: string | undefined) => {
  return useQuery<PlayerStats>({
    queryKey: ['playerStats', playerName],
    queryFn: () => api.getPlayerStats(playerName!),
    enabled: !!playerName && playerName.trim().length > 0,
    staleTime: 5000, // Consider data fresh for 5 seconds
  });
};
```

**File: `packages/frontend/src/components/Game.tsx`**

1. Import and call the hook:
```typescript
const { data: stats } = usePlayerStats(playerName);
```

2. Display stats in UI (after status message, before players info):
```tsx
{stats && hasJoined && (
  <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
    <h3 className="text-sm font-semibold text-gray-700 text-center mb-3">Your Stats</h3>
    <div className="grid grid-cols-4 gap-3">
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{stats.wins}</div>
        <div className="text-xs text-gray-600 uppercase tracking-wide">Wins</div>
      </div>
      {/* ... losses, draws, total ... */}
    </div>
  </div>
)}
```

3. Auto-refresh when game finishes:
```typescript
useEffect(() => {
  if (!game || !playerName) return;
  
  if (game.status === 'done') {
    queryClient.invalidateQueries({ queryKey: ['playerStats', playerName] });
  }
}, [game?.status, playerName, queryClient]);
```

## Features

### ✅ Real-Time Updates
- Stats automatically refresh when a game finishes
- Uses TanStack Query's cache invalidation
- No manual refresh needed

### ✅ Case-Insensitive Matching
- "Alice", "alice", "ALICE" all return same stats
- Consistent with player name validation

### ✅ Performance Optimized
- Query only runs when player name is available
- 5-second stale time prevents excessive API calls
- Efficient database query with indexes

### ✅ Conditional Display
- Only shows when player has joined (`hasJoined`)
- Only shows when stats are available
- Hidden during join flow

## API Documentation

### GET /api/players/:playerName/stats

**Parameters:**
- `playerName` (URL parameter): The player's name (URL-encoded)

**Example Request:**
```bash
GET /api/players/Alice/stats
```

**Success Response (200):**
```json
{
  "playerName": "Alice",
  "wins": 5,
  "losses": 3,
  "draws": 1,
  "totalGames": 9
}
```

**Error Responses:**

| Status | Error Message |
|--------|---------------|
| 400 | Player name is required |
| 500 | Failed to fetch player stats |

**Edge Cases:**
- New players return all zeros: `{ wins: 0, losses: 0, draws: 0, totalGames: 0 }`
- Special characters in names are URL-encoded/decoded properly
- Case variations treated as same player

## Database Query

```sql
SELECT 
  winner,
  player_x_name,
  player_o_name
FROM games 
WHERE status = 'done' 
  AND (LOWER(player_x_name) = LOWER($1) OR LOWER(player_o_name) = LOWER($1))
```

**Performance Considerations:**
- Consider adding index on `status` column for faster filtering
- Consider adding index on `LOWER(player_x_name)` and `LOWER(player_o_name)`
- Current implementation is O(n) on completed games per player

**Suggested Index:**
```sql
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_player_x_name_lower ON games(LOWER(player_x_name));
CREATE INDEX idx_games_player_o_name_lower ON games(LOWER(player_o_name));
```

## Visual Layout

```
┌─────────────────────────────────────────┐
│        Tic-Tac-Toe (Title)              │
├─────────────────────────────────────────┤
│      Alice's turn (Status)              │
├─────────────────────────────────────────┤
│      📊 Your Stats                      │
│  ┌─────┬─────┬─────┬─────┐             │
│  │ 5   │ 3   │ 1   │ 9   │             │
│  │Wins │Loss │Draw │Total│             │
│  └─────┴─────┴─────┴─────┘             │
├─────────────────────────────────────────┤
│  ┌────────┐      ┌────────┐            │
│  │   X    │      │   O    │            │
│  │ Alice  │      │  Bob   │            │
│  │ (You)  │      │        │            │
│  └────────┘      └────────┘            │
├─────────────────────────────────────────┤
│         [Game Board]                    │
└─────────────────────────────────────────┘
```

## Testing

### Test Cases

**Test 1: New Player (No History)**
- Player: "NewUser"
- Expected: `{ wins: 0, losses: 0, draws: 0, totalGames: 0 }`

**Test 2: Player With History**
```sql
-- Setup: Create 3 games for Alice
-- Game 1: Alice (X) wins
-- Game 2: Bob (X) wins vs Alice (O)
-- Game 3: Alice (O) vs Bob (X) - draw

-- Query: GET /api/players/Alice/stats
-- Expected: { wins: 1, losses: 1, draws: 1, totalGames: 3 }
```

**Test 3: Case Insensitive**
```bash
# All should return same results:
GET /api/players/alice/stats
GET /api/players/Alice/stats
GET /api/players/ALICE/stats
```

**Test 4: Special Characters**
```bash
GET /api/players/Alice%20Smith/stats  # "Alice Smith"
GET /api/players/Jos%C3%A9/stats      # "José"
```

**Test 5: Auto-Refresh on Game End**
1. Start game with stats showing (e.g., 5 wins)
2. Finish game (win)
3. Verify stats update to 6 wins automatically

## Benefits

### 🎯 Player Engagement
- Players can track their progress
- Competitive element encourages replaying
- Sense of achievement

### 📊 Transparency
- Clear record of performance
- No ambiguity about results
- Historical context for current game

### 🔄 Real-Time Feedback
- Immediate satisfaction when winning
- Stats update automatically
- No manual refresh needed

## Future Enhancements

Potential improvements (not implemented):

1. **Win Rate Percentage**: Calculate and display win%
2. **Streak Tracking**: Current win/loss streak
3. **Head-to-Head Stats**: Stats vs specific opponents
4. **Leaderboard**: Global rankings of all players
5. **Time-Based Stats**: Stats for last 7 days, 30 days, etc.
6. **Chart Visualization**: Pie chart or bar chart of results
7. **Export Stats**: Download stats as CSV/JSON
8. **Achievement Badges**: Unlock badges for milestones (10 wins, etc.)

## Related Files

- `packages/backend/src/routes.ts` - Stats endpoint
- `packages/frontend/src/api.ts` - API method
- `packages/frontend/src/types.ts` - PlayerStats interface
- `packages/frontend/src/queries.ts` - Query hook
- `packages/frontend/src/components/Game.tsx` - UI display

## Status
✅ Fully implemented and integrated
