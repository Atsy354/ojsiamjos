
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing Supabase environment variables');
    console.error('Check .env.local for NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration(filePath) {
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Running migration: ${filePath}`);

    // Strategy 1: Direct Postgres Connection
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (connectionString) {
        try {
            console.log('Attempting direct PG connection...');
            const { Client } = require('pg');
            const client = new Client({
                connectionString,
                ssl: { rejectUnauthorized: false }
            });
            await client.connect();
            await client.query(sql);
            await client.end();
            console.log('Migration successful via PG driver.');
            return;
        } catch (pgError) {
            console.warn('PG Connection failed, falling back to RPC:', pgError.message);
        }
    }

    // Strategy 2: Supabase RPC (exec_sql)
    try {
        console.log('Attempting via Supabase RPC (exec_sql)...');
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
        if (error) {
            throw new Error(`RPC failed: ${error.message}`);
        }
        console.log('Migration successful via RPC.');
    } catch (rpcError) {
        console.error('All migration strategies failed.');
        console.error('Last error:', rpcError);
        process.exit(1);
    }
}

const migrationFile = process.argv[2];
if (!migrationFile) {
    console.error('Usage: node scripts/run-migration.js <path-to-sql-file>');
    process.exit(1);
}

runMigration(migrationFile);
