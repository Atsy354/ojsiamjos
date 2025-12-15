/**
 * Create Demo Users via Supabase Auth API
 * 
 * This script creates all 23 demo users in Supabase Authentication
 * so they can login to the system.
 * 
 * Run: node scripts/create-demo-users.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Initialize Supabase client with service role key (has admin privileges)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Need service role key for admin API
)

// All 23 demo users grouped by role
const demoUsers = [
    // Site Administrators (3)
    { email: 'admin@ojs.local', password: 'password', role: 'admin', roleId: 1 },
    { email: 'admin@iamjos.org', password: 'password', role: 'admin', roleId: 1 },
    { email: 'anjarbdn@gmail.com', password: 'password', role: 'admin', roleId: 1 },

    // Journal Manager (1)
    { email: 'manager@ojs.local', password: 'password', role: 'manager', roleId: 16 },

    // Section Editors (6)
    { email: 'editor@ojs.local', password: 'password', role: 'editor', roleId: 17 },
    { email: 'editor@jcst.org', password: 'password', role: 'editor', roleId: 17 },
    { email: 'editor@ijms.org', password: 'password', role: 'editor', roleId: 17 },
    { email: 'editor@jee.org', password: 'password', role: 'editor', roleId: 17 },
    { email: 'editor@jbf.org', password: 'password', role: 'editor', roleId: 17 },
    { email: 'editor@jedu.org', password: 'password', role: 'editor', roleId: 17 },

    // Reviewers (6)
    { email: 'reviewer@ojs.local', password: 'password', role: 'reviewer', roleId: 4096 },
    { email: 'reviewer@jcst.org', password: 'password', role: 'reviewer', roleId: 4096 },
    { email: 'reviewer@ijms.org', password: 'password', role: 'reviewer', roleId: 4096 },
    { email: 'reviewer@jee.org', password: 'password', role: 'reviewer', roleId: 4096 },
    { email: 'reviewer@jbf.org', password: 'password', role: 'reviewer', roleId: 4096 },
    { email: 'reviewer@jedu.org', password: 'password', role: 'reviewer', roleId: 4096 },

    // Authors (6)
    { email: 'author@ojs.local', password: 'password', role: 'author', roleId: 65536 },
    { email: 'author@jcst.org', password: 'password', role: 'author', roleId: 65536 },
    { email: 'author@ijms.org', password: 'password', role: 'author', roleId: 65536 },
    { email: 'author@jee.org', password: 'password', role: 'author', roleId: 65536 },
    { email: 'author@jbf.org', password: 'password', role: 'author', roleId: 65536 },
    { email: 'author@jedu.org', password: 'password', role: 'author', roleId: 65536 },

    // Reader (1)
    { email: 'reader@iamjos.org', password: 'password', role: 'reader', roleId: 1048576 },
]

async function createDemoUsers() {
    console.log('🚀 Starting to create 23 demo users...\n')

    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    for (const user of demoUsers) {
        try {
            // Create user in Supabase Auth
            const { data, error } = await supabase.auth.admin.createUser({
                email: user.email,
                password: user.password,
                email_confirm: true, // Auto-confirm email
                user_metadata: {
                    role: user.role,
                    role_id: user.roleId
                }
            })

            if (error) {
                if (error.message.includes('already registered')) {
                    console.log(`⏭️  SKIP: ${user.email} (already exists)`)
                    skipCount++
                } else {
                    console.error(`❌ ERROR: ${user.email} - ${error.message}`)
                    errorCount++
                }
            } else {
                console.log(`✅ CREATED: ${user.email} (${user.role}, ID: ${user.roleId})`)
                successCount++

                // Update users table with role_ids
                const { error: updateError } = await supabase
                    .from('users')
                    .update({
                        roles: [user.role],
                        role_ids: [user.roleId]
                    })
                    .eq('id', data.user.id)

                if (updateError) {
                    console.log(`   ⚠️  Warning: Could not update role_ids in users table`)
                }
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100))

        } catch (err) {
            console.error(`❌ EXCEPTION: ${user.email} - ${err.message}`)
            errorCount++
        }
    }

    console.log('\n📊 SUMMARY:')
    console.log(`✅ Created: ${successCount}`)
    console.log(`⏭️  Skipped: ${skipCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log(`📝 Total: ${demoUsers.length}`)

    if (successCount + skipCount === demoUsers.length) {
        console.log('\n🎉 All users are ready!')
        console.log('You can now login with any of these accounts.')
        console.log('Password for all: password')
    }
}

// Run the script
createDemoUsers()
    .then(() => {
        console.log('\n✅ Script completed!')
        process.exit(0)
    })
    .catch((err) => {
        console.error('\n❌ Script failed:', err)
        process.exit(1)
    })
