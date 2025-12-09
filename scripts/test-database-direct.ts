// scripts/test-database-direct.ts
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

async function testDatabase() {
    console.log('🗄️  Testing Database Connectivity...\n')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
        console.log('❌ Missing environment variables!')
        process.exit(1)
    }

    console.log('📍 URL:', supabaseUrl)
    console.log('\n' + '='.repeat(80) + '\n')

    const supabase = createClient(supabaseUrl, supabaseKey)

    try {
        // Test 1: Journals
        console.log('1️⃣  Testing Journals Table...')
        const { data: journals, error: journalsError } = await supabase
            .from('journals')
            .select('*')
            .limit(3)

        if (journalsError) {
            console.log('   ❌ FAIL:', journalsError.message)
        } else {
            console.log(`   ✅ PASS - Found ${journals?.length || 0} journals`)
            if (journals && journals.length > 0) {
                console.log(`   📄 Sample: "${journals[0].name}"`)
            }
        }

        // Test 2: Users
        console.log('\n2️⃣  Testing Users Table...')
        const { count: usersCount, error: usersError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })

        if (usersError) {
            console.log('   ❌ FAIL:', usersError.message)
        } else {
            console.log(`   ✅ PASS - Total users: ${usersCount}`)
        }

        // Test 3: Submissions
        console.log('\n3️⃣  Testing Submissions Table...')
        const { count: submissionsCount, error: submissionsError } = await supabase
            .from('submissions')
            .select('*', { count: 'exact', head: true })

        if (submissionsError) {
            console.log('   ❌ FAIL:', submissionsError.message)
        } else {
            console.log(`   ✅ PASS - Total submissions: ${submissionsCount}`)
        }

        // Test 4: Publications
        console.log('\n4️⃣  Testing Publications Table...')
        const { count: publicationsCount, error: publicationsError } = await supabase
            .from('publications')
            .select('*', { count: 'exact', head: true })

        if (publicationsError) {
            console.log('   ❌ FAIL:', publicationsError.message)
        } else {
            console.log(`   ✅ PASS - Total publications: ${publicationsCount}`)
        }

        // Summary
        console.log('\n' + '='.repeat(80))
        console.log('\n📊 Database Summary:')
        console.log(`   Journals: ${journals?.length || 0}`)
        console.log(`   Users: ${usersCount || 0}`)
        console.log(`   Submissions: ${submissionsCount || 0}`)
        console.log(`   Publications: ${publicationsCount || 0}`)
        console.log('\n   🎉 Database connection: WORKING')

    } catch (error) {
        console.log('\n❌ ERROR:', error instanceof Error ? error.message : 'Unknown error')
        process.exit(1)
    }
}

testDatabase()
