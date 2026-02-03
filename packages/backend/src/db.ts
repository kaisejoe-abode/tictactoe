import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Support both connection string and individual credentials
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

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export const getClient = () => {
  return pool.connect();
};

export default pool;
