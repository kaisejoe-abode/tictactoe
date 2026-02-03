# Migration Guide

If you had an earlier version of this app installed, you'll need to update your database schema.

## Option 1: Drop and Recreate (Easiest - loses data)

```bash
# Connect to PostgreSQL
psql -U postgres

# Drop existing database
DROP DATABASE tictactoe;

# Create new database
CREATE DATABASE tictactoe;

# Exit psql
\q

# Run migrations
npm run migrate --workspace=backend
```

## Option 2: Alter Existing Tables (Preserves data)

```bash
# Connect to your database
psql -U postgres -d tictactoe
```

Then run:

```sql
-- Add new columns to games table
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS player_x_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS player_o_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS player_x_id VARCHAR(1) DEFAULT 'X',
ADD COLUMN IF NOT EXISTS player_o_id VARCHAR(1) DEFAULT 'O',
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'waiting';

-- Update existing games to have finished status if they have a winner
UPDATE games SET status = 'finished' WHERE winner IS NOT NULL;

-- Update existing games to have playing status if they have moves but no winner
UPDATE games SET status = 'playing' WHERE winner IS NULL AND board != '[]';
```

Exit psql with `\q`

## Verify Migration

```bash
psql -U postgres -d tictactoe -c "\d games"
```

You should see all the new columns listed.
