
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkRpc() {
    console.log('Checking for exec_sql RPC...')
    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1' })
        if (error) {
            console.log('RPC exec_sql check failed:', error.message)
        } else {
            console.log('RPC exec_sql EXISTS! We can use it.')
        }
    } catch (e) {
        console.log('RPC check threw:', e)
    }
}

function checkEnv() {
    const direct = process.env.DIRECT_URL
    const db = process.env.DATABASE_URL
    console.log('Checking Envs:')
    if (direct) {
        try {
            const url = new URL(direct)
            console.log('DIRECT_URL Host:', url.hostname)
        } catch { console.log('DIRECT_URL: Invalid URL format') }
    } else {
        console.log('DIRECT_URL: Not set')
    }

    if (db) {
        try {
            const url = new URL(db)
            console.log('DATABASE_URL Host:', url.hostname)
        } catch { console.log('DATABASE_URL: Invalid URL format') }
    } else {
        console.log('DATABASE_URL: Not set')
    }
}

checkRpc().then(() => checkEnv())
