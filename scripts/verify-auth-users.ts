// scripts/verify-auth-users.ts
// Verify users exist in Supabase Auth
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

async function verifyAuthUsers() {
    console.log('🔍 Verifying Supabase Auth Users...\n')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        console.log('❌ Missing environment variables!')
        process.exit(1)
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })

    try {
        // List all users from Auth
        const { data: { users }, error } = await supabase.auth.admin.listUsers()

        if (error) {
            console.log('❌ Error listing users:', error.message)
            process.exit(1)
        }

        console.log(`✅ Found ${users.length} users in Supabase Auth:\n`)

        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email}`)
            console.log(`   ID: ${user.id}`)
            console.log(`   Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
            console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`)
            console.log('')
        })

        // Test login with one user
        console.log('🧪 Testing login with admin@iamjos.org...')
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: 'admin@iamjos.org',
            password: 'admin123'
        })

        if (loginError) {
            console.log('❌ Login test FAILED:', loginError.message)
        } else {
            console.log('✅ Login test PASSED!')
            console.log(`   User: ${loginData.user?.email}`)
            console.log(`   Session: ${loginData.session ? 'Active' : 'None'}`)
        }

        // Check journals in database
        console.log('\n📚 Checking Journals in Database...')
        const { data: journals, error: journalsError } = await supabase
            .from('journals')
            .select('id, name, path, enabled')
            .limit(10)

        if (journalsError) {
            console.log('❌ Error fetching journals:', journalsError.message)
        } else {
            console.log(`✅ Found ${journals?.length || 0} journals:`)
            journals?.forEach((j, i) => {
                console.log(`   ${i + 1}. ${j.name} (${j.path}) - ${j.enabled ? 'Enabled' : 'Disabled'}`)
            })
        }

    } catch (error) {
        console.log('❌ Error:', error instanceof Error ? error.message : 'Unknown')
    }
}

verifyAuthUsers()
