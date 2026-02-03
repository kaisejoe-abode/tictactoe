const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const createTables = async () => {
  try {
    console.log('Creating tables...');

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

    console.log('Tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
};

createTables();
