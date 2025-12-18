
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
    const file = process.argv[2]
    if (!file) {
        console.error('No file provided')
        process.exit(1)
    }
    const sqlPath = path.resolve(process.cwd(), file)
    console.log(`Reading SQL from ${sqlPath}`)
    const sql = fs.readFileSync(sqlPath, 'utf8')

    console.log('Executing RPC exec_sql...')
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
        console.error('RPC Error:', error)
        // Try fallback parameter name 'sql' just in case
        console.log('Retrying with parameter "sql"...')
        const { error: error2 } = await supabase.rpc('exec_sql', { sql: sql })
        if (error2) {
            console.error('Retry failed:', error2)
            process.exit(1)
        }
    }
    console.log('Migration Success!')
}

run()
