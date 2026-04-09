const { Client } = require('pg');
require('dotenv').config({ path: __dirname + '/server/.env' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('Error: DATABASE_URL not found in server/.env');
    process.exit(1);
}

async function init() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected to Neon PostgreSQL');

        await client.query(`
      DROP TABLE IF EXISTS search_logs;
      CREATE TABLE search_logs (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        query_text TEXT,
        search_results_json JSONB,
        gemini_response_raw TEXT,
        gemini_inferred_json JSONB,
        singer_name TEXT,
        song_title TEXT,
        creators JSONB,
        confidence TEXT
      );
    `);

        console.log('Table "search_logs" initialized successfully.');
    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        await client.end();
    }
}

init();
