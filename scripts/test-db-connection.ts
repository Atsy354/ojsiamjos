// scripts/test-db-connection.ts
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables!')
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
    console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
    console.log('🔍 Testing Supabase Connection...\n')
    console.log('📍 URL:', supabaseUrl)

    // Test 1: Check connection with journals table
    const { data: journals, error: journalError } = await supabase
        .from('journals')
        .select('*')
        .limit(1)

    if (journalError) {
        console.error('\n❌ Connection failed:', journalError.message)
        return
    }

    console.log('\n✅ Connection successful!')
    if (journals && journals.length > 0) {
        console.log('📊 Journal found:', journals[0].name)
    }

    // Test 2: Check key tables
    const keyTables = [
        'users', 'journals', 'submissions', 'authors',
        'review_rounds', 'review_assignments', 'issues',
        'publications', 'files', 'email_templates',
        'sections', 'roles', 'user_user_groups'
    ]

    console.log('\n🔑 Checking key tables:')
    let existingTables = 0

    for (const table of keyTables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })

        if (!error) {
            console.log(`  ✅ ${table.padEnd(20)} - ${count} rows`)
            existingTables++
        } else {
            console.log(`  ❌ ${table.padEnd(20)} - Not found`)
        }
    }

    console.log(`\n📊 Summary: ${existingTables}/${keyTables.length} key tables exist`)

    if (existingTables === keyTables.length) {
        console.log('\n🎉 All key tables found! Database is ready!')
    } else {
        console.log('\n⚠️  Some tables missing. You may need to run SQL schemas.')
    }
}

testConnection().catch(console.error)
