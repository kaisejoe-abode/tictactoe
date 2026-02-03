const { Pool } = require('pg');
require('dotenv').config();

// Support both connection string and individual credentials (same as db.ts)
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'tictactoe',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      }
);

const createTables = async () => {
  try {
    console.log('Running database migrations...');

    await pool.query(`
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
    `);

    console.log('✅ Database migrations completed successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running migrations:', error.message);
    await pool.end();
    process.exit(1);
  }
};

createTables();
