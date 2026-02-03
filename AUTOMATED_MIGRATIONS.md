# Automated Database Migrations

## Overview

The backend automatically runs database migrations on startup, eliminating the need to manually run migrations after deployment.

## How It Works

### Production Start Script

The `start:prod` script in `package.json` runs migrations before starting the server:

```json
{
  "scripts": {
    "start:prod": "npm run migrate && npm start"
  }
}
```

**Execution flow:**
1. `npm run migrate` - Creates/updates database tables
2. `&&` - Only continues if migration succeeds
3. `npm start` - Starts the Express server

If migrations fail, the server won't start, preventing the app from running with an outdated schema.

## Migration Script

**Location**: `packages/backend/scripts/migrate.js`

The migration script:
- Supports both `DATABASE_URL` and individual credentials (`DB_HOST`, `DB_USER`, etc.)
- Creates tables if they don't exist (`CREATE TABLE IF NOT EXISTS`)
- Is idempotent (safe to run multiple times)
- Exits with code 0 on success, 1 on failure

```javascript
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'tictactoe',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      }
);
```

## Database Schema

Current schema created by migrations:

```sql
CREATE TABLE IF NOT EXISTS games (
  id VARCHAR(255) PRIMARY KEY,
  board JSONB NOT NULL,
  current_player VARCHAR(1) NOT NULL,
  winner VARCHAR(10),
  player_x_name VARCHAR(255),
  player_o_name VARCHAR(255),
  player_x_id VARCHAR(1) DEFAULT 'X',
  player_o_id VARCHAR(1) DEFAULT 'O',
  status VARCHAR(20) DEFAULT 'waiting',
  reset_requested_by VARCHAR(1),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Deployment Platforms

### Render

**Configuration:**
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start:prod`

**Logs to verify:**
```
Running database migrations...
✅ Database migrations completed successfully!
WebSocket server initialized
Server running on port 3001
```

### Heroku

**Configuration:**
- Add to `Procfile`:
  ```
  web: npm run start:prod
  ```

**Or use release phase** (runs before deployment):
```
release: npm run migrate
web: npm start
```

### Railway

**Configuration:**
- **Start Command**: `npm run start:prod`
- Migrations run automatically on deploy

### Docker

**In Dockerfile:**
```dockerfile
CMD ["npm", "run", "start:prod"]
```

**Or in docker-compose.yml:**
```yaml
services:
  backend:
    command: npm run start:prod
```

## Manual Migration

### Run Migration Manually

If needed, you can run migrations separately:

```bash
# Local development
npm run migrate

# On deployed server (via shell/SSH)
npm run migrate

# Using Node directly
node -r dotenv/config scripts/migrate.js
```

### Verify Migration Success

Check for success message:
```
Running database migrations...
✅ Database migrations completed successfully!
```

### Check Tables Exist

```bash
# Using psql
psql $DATABASE_URL -c "\dt"

# Using Node
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT tablename FROM pg_tables WHERE schemaname = \'public\'')
  .then(res => console.log('Tables:', res.rows))
  .catch(err => console.error('Error:', err.message));
"
```

## Development vs Production

### Local Development

**Option 1: Automatic (recommended)**
```bash
npm run start:prod
```

**Option 2: Manual**
```bash
npm run migrate  # Run once
npm run dev      # Start dev server with watch
```

### Production Deployment

**Always use:**
```bash
npm run start:prod
```

This ensures:
- ✅ Database is always up-to-date
- ✅ No manual intervention needed
- ✅ Safe to deploy at any time
- ✅ Consistent across all environments

## Troubleshooting

### Migration Fails, Server Won't Start

**Symptoms:**
```
❌ Error running migrations: ...
```

**Common Causes:**

1. **Database not accessible**
   - Check `DATABASE_URL` or `DB_*` environment variables
   - Verify database is running
   - Check firewall/network settings
   - For Render: Use internal database URL, not external

2. **Permission denied**
   - Check database user has CREATE TABLE permission
   - Verify credentials are correct

3. **Syntax error**
   - Review migration script for SQL errors
   - Check PostgreSQL version compatibility

**Debug Steps:**

1. Test database connection:
   ```bash
   node -e "
   const { Pool } = require('pg');
   const pool = new Pool({ connectionString: process.env.DATABASE_URL });
   pool.query('SELECT NOW()')
     .then(() => console.log('✅ Connected'))
     .catch(err => console.error('❌', err.message));
   "
   ```

2. Check environment variables:
   ```bash
   echo $DATABASE_URL
   # or
   node -e "console.log(process.env.DATABASE_URL)"
   ```

3. Run migration with verbose output:
   ```bash
   DEBUG=* npm run migrate
   ```

### Migration Succeeds but Tables Not Created

**Check schema:**
```sql
-- List all tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Check specific table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'games';
```

**Possible causes:**
- Migration ran on wrong database
- Using external URL instead of internal (Render)
- Multiple databases with similar names

### Server Starts but Migration Skipped

If using `npm start` instead of `npm run start:prod`:
- Migration won't run
- Server starts without updated schema
- May cause runtime errors

**Fix:** Always use `npm run start:prod` in production.

## Adding New Migrations

### Step 1: Update Migration Script

Add new schema changes to `scripts/migrate.js`:

```javascript
// Add new column
await pool.query(`
  ALTER TABLE games 
  ADD COLUMN IF NOT EXISTS new_column VARCHAR(255);
`);

// Create new table
await pool.query(`
  CREATE TABLE IF NOT EXISTS new_table (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
  );
`);
```

### Step 2: Test Locally

```bash
npm run migrate
```

### Step 3: Deploy

```bash
git add packages/backend/scripts/migrate.js
git commit -m "Add new database migration"
git push
```

Render will automatically:
1. Build the new version
2. Run migrations (with new changes)
3. Start the server

### Best Practices

1. **Always use `IF NOT EXISTS`** for tables
2. **Use `IF NOT EXISTS`** for columns (PostgreSQL 9.6+):
   ```sql
   ALTER TABLE games 
   ADD COLUMN IF NOT EXISTS new_col VARCHAR(255);
   ```
3. **Test migrations on local database first**
4. **Make migrations backwards compatible** when possible
5. **Don't drop columns/tables** unless absolutely necessary
6. **Add indexes carefully** (can be slow on large tables)

## Migration Strategies

### Current: Single Migration File

**Pros:**
- ✅ Simple
- ✅ Easy to understand
- ✅ No version tracking needed
- ✅ Idempotent with `IF NOT EXISTS`

**Cons:**
- ⚠️ Hard to rollback individual changes
- ⚠️ Can grow large over time
- ⚠️ No migration history tracking

**Best for:** Small to medium apps with infrequent schema changes

### Alternative: Versioned Migrations

For larger apps, consider migration tools:

**Option 1: node-pg-migrate**
```bash
npm install node-pg-migrate
```

**Option 2: db-migrate**
```bash
npm install db-migrate db-migrate-pg
```

**Option 3: Sequelize/TypeORM migrations**
If using an ORM

## Environment-Specific Migrations

### Development

```bash
# .env.development
DATABASE_URL=postgresql://localhost:5432/tictactoe_dev
```

### Staging

```bash
# .env.staging
DATABASE_URL=postgresql://staging-host:5432/tictactoe_staging
```

### Production

```bash
# .env.production (or set in Render dashboard)
DATABASE_URL=postgresql://prod-host:5432/tictactoe
```

## Rollback Strategy

### Current Setup

With single migration file:
- No built-in rollback
- To rollback: Drop table and redeploy previous version

### Manual Rollback

```sql
-- Drop table (loses all data!)
DROP TABLE IF EXISTS games;

-- Or drop specific column
ALTER TABLE games DROP COLUMN IF EXISTS column_name;
```

### Rollback Best Practice

1. Backup database before major migrations:
   ```bash
   pg_dump $DATABASE_URL > backup.sql
   ```

2. Test migrations on staging first

3. Consider blue-green deployments for risky changes

4. Keep backups for at least 7 days

## Monitoring

### Check Migration Status

**On Render:**
- Dashboard → Service → Logs
- Look for migration success message

**Via API:**
Add health check that verifies tables exist:

```typescript
app.get('/health', async (req, res) => {
  try {
    await query('SELECT 1 FROM games LIMIT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'failed' });
  }
});
```

### Migration Metrics

Track in logs:
- Migration duration
- Success/failure rate
- Database connection time

## Security

### Migration User Permissions

Production database user should have:
- ✅ `CREATE TABLE`
- ✅ `ALTER TABLE`
- ✅ `SELECT`, `INSERT`, `UPDATE`, `DELETE`
- ❌ `DROP DATABASE` (not needed)
- ❌ `CREATE USER` (not needed)

### Sensitive Data

⚠️ **Never log:**
- Database credentials
- Connection strings with passwords
- User data during migrations

✅ **Do log:**
- Migration success/failure
- Tables created
- Execution time

## Summary

### ✅ Automated Migrations Benefits

- No manual steps after deployment
- Consistent across all environments
- Reduces deployment errors
- Safe with `IF NOT EXISTS`
- Works on all platforms

### 📋 Quick Reference

**Start server with migrations:**
```bash
npm run start:prod
```

**Run migration only:**
```bash
npm run migrate
```

**Development with auto-reload:**
```bash
npm run dev
```

**Render start command:**
```
npm run start:prod
```

The automated migration system ensures your database is always in sync with your application code! 🎉
