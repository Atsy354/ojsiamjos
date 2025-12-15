// scripts/audit-database-schema.ts
// Audit actual database schema vs what routes expect
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

async function auditDatabaseSchema() {
    console.log('🔍 Auditing Database Schema...\n')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        console.log('❌ Missing environment variables!')
        process.exit(1)
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const tablesToCheck = [
        'journals',
        'users',
        'submissions',
        'issues',
        'publications',
        'reviews',
        'sections',
        'authors',
        'submission_files',
        'editorial_decisions',
        'workflow_stages',
        'notifications',
        'discussions',
        'galleys'
    ]

    console.log('📋 Checking Tables and Columns:\n')

    for (const table of tablesToCheck) {
        try {
            // Get one row to see actual columns
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1)

            if (error) {
                console.log(`❌ ${table}: ${error.message}`)
            } else if (data && data.length > 0) {
                const columns = Object.keys(data[0])
                console.log(`✅ ${table}:`)
                console.log(`   Columns: ${columns.join(', ')}`)
                console.log(`   Sample ID: ${data[0].id || data[0][columns[0]]}`)
            } else {
                console.log(`⚠️  ${table}: Table exists but empty`)
            }
            console.log('')
        } catch (err) {
            console.log(`❌ ${table}: ${err instanceof Error ? err.message : 'Unknown error'}`)
            console.log('')
        }
    }

    // Test specific queries that might be failing
    console.log('\n🧪 Testing Specific Queries:\n')

    // Test 1: Journals query
    console.log('1. Testing journals query...')
    const { data: journals, error: jError } = await supabase
        .from('journals')
        .select('*')
        .limit(3)

    if (jError) {
        console.log(`   ❌ FAIL: ${jError.message}`)
    } else {
        console.log(`   ✅ PASS: Found ${journals?.length || 0} journals`)
        if (journals && journals.length > 0) {
            console.log(`   Sample: ${JSON.stringify(journals[0], null, 2)}`)
        }
    }

    // Test 2: Users query
    console.log('\n2. Testing users query...')
    const { data: users, error: uError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, roles')
        .limit(3)

    if (uError) {
        console.log(`   ❌ FAIL: ${uError.message}`)
    } else {
        console.log(`   ✅ PASS: Found ${users?.length || 0} users`)
        if (users && users.length > 0) {
            console.log(`   Sample: ${users[0].email}`)
        }
    }

    // Test 3: Submissions with joins
    console.log('\n3. Testing submissions with joins...')
    const { data: subs, error: sError } = await supabase
        .from('submissions')
        .select('*, submitter:users!submissions_submitter_id_fkey(*)')
        .limit(1)

    if (sError) {
        console.log(`   ❌ FAIL: ${sError.message}`)
    } else {
        console.log(`   ✅ PASS: Joins working`)
    }
}

auditDatabaseSchema()
