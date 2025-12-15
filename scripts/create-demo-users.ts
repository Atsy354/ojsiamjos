// scripts/create-demo-users.ts
// Script to create demo users in Supabase Auth
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const demoUsers = [
    // Platform Admin
    { email: 'admin@iamjos.org', password: 'admin123', firstName: 'Admin', lastName: 'User', roles: ['admin'] },
    { email: 'reader@iamjos.org', password: 'demo123', firstName: 'Reader', lastName: 'User', roles: ['reader'] },

    // JCST Users
    { email: 'editor@jcst.org', password: 'editor123', firstName: 'JCST', lastName: 'Editor', roles: ['editor'] },
    { email: 'author@jcst.org', password: 'author123', firstName: 'JCST', lastName: 'Author', roles: ['author'] },
    { email: 'reviewer@jcst.org', password: 'reviewer123', firstName: 'JCST', lastName: 'Reviewer', roles: ['reviewer'] },

    // IJMS Users
    { email: 'editor@ijms.org', password: 'editor123', firstName: 'IJMS', lastName: 'Editor', roles: ['editor'] },
    { email: 'author@ijms.org', password: 'author123', firstName: 'IJMS', lastName: 'Author', roles: ['author'] },
    { email: 'reviewer@ijms.org', password: 'reviewer123', firstName: 'IJMS', lastName: 'Reviewer', roles: ['reviewer'] },

    // JEE Users
    { email: 'editor@jee.org', password: 'editor123', firstName: 'JEE', lastName: 'Editor', roles: ['editor'] },
    { email: 'author@jee.org', password: 'author123', firstName: 'JEE', lastName: 'Author', roles: ['author'] },
    { email: 'reviewer@jee.org', password: 'reviewer123', firstName: 'JEE', lastName: 'Reviewer', roles: ['reviewer'] },

    // JBF Users
    { email: 'editor@jbf.org', password: 'editor123', firstName: 'JBF', lastName: 'Editor', roles: ['editor'] },
    { email: 'author@jbf.org', password: 'author123', firstName: 'JBF', lastName: 'Author', roles: ['author'] },
    { email: 'reviewer@jbf.org', password: 'reviewer123', firstName: 'JBF', lastName: 'Reviewer', roles: ['reviewer'] },

    // JEDU Users
    { email: 'editor@jedu.org', password: 'editor123', firstName: 'JEDU', lastName: 'Editor', roles: ['editor'] },
    { email: 'author@jedu.org', password: 'author123', firstName: 'JEDU', lastName: 'Author', roles: ['author'] },
    { email: 'reviewer@jedu.org', password: 'reviewer123', firstName: 'JEDU', lastName: 'Reviewer', roles: ['reviewer'] },
]

async function createDemoUsers() {
    console.log('🔐 Creating Demo Users in Supabase Auth...\n')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        console.log('❌ Missing environment variables!')
        console.log('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
        process.exit(1)
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })

    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    for (const user of demoUsers) {
        try {
            // Try to create user in Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: user.email,
                password: user.password,
                email_confirm: true,
                user_metadata: {
                    first_name: user.firstName,
                    last_name: user.lastName,
                    roles: user.roles
                }
            })

            if (authError) {
                if (authError.message.includes('already registered')) {
                    console.log(`⏭️  SKIP: ${user.email} (already exists)`)
                    skipCount++
                } else {
                    console.log(`❌ FAIL: ${user.email} - ${authError.message}`)
                    errorCount++
                }
                continue
            }

            // Check if user exists in users table
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', user.email)
                .single()

            if (!existingUser && authData.user) {
                // Create user in users table
                const { error: dbError } = await supabase
                    .from('users')
                    .insert({
                        id: authData.user.id,
                        email: user.email,
                        first_name: user.firstName,
                        last_name: user.lastName,
                        roles: user.roles,
                        created_at: new Date().toISOString()
                    })

                if (dbError) {
                    console.log(`⚠️  AUTH OK but DB FAIL: ${user.email} - ${dbError.message}`)
                } else {
                    console.log(`✅ SUCCESS: ${user.email} (Auth + DB)`)
                    successCount++
                }
            } else {
                console.log(`✅ SUCCESS: ${user.email} (Auth only, DB exists)`)
                successCount++
            }

        } catch (error) {
            console.log(`❌ ERROR: ${user.email} - ${error instanceof Error ? error.message : 'Unknown'}`)
            errorCount++
        }
    }

    console.log('\n' + '='.repeat(80))
    console.log('\n📊 Summary:')
    console.log(`   ✅ Created: ${successCount}`)
    console.log(`   ⏭️  Skipped: ${skipCount}`)
    console.log(`   ❌ Failed: ${errorCount}`)
    console.log(`   📝 Total: ${demoUsers.length}`)

    if (successCount + skipCount === demoUsers.length) {
        console.log('\n   🎉 All demo users are ready!')
        console.log('\n📝 You can now login with:')
        console.log('   - admin@iamjos.org / admin123')
        console.log('   - editor@jcst.org / editor123')
        console.log('   - author@jcst.org / author123')
        console.log('   - reviewer@jcst.org / reviewer123')
        console.log('   (and similar for other journals)')
    }
}

createDemoUsers()
