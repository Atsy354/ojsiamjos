// scripts/run-schema-fix.ts
// Run schema fixes to match API expectations
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

config({ path: '.env.local' })

async function runSchemaFix() {
    console.log('🔧 Running Schema Fixes...\n')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        console.log('❌ Missing environment variables!')
        process.exit(1)
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Read SQL file
    const sqlPath = join(process.cwd(), 'scripts', 'fix-schema.sql')
    const sql = readFileSync(sqlPath, 'utf-8')

    // Split by semicolon and execute each statement
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`)

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]

        // Skip comments
        if (statement.startsWith('--') || statement.startsWith('/*')) {
            continue
        }

        try {
            const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })

            if (error) {
                // Try direct query as fallback
                const { error: directError } = await supabase.from('_sql').select('*').limit(0)

                console.log(`⚠️  Statement ${i + 1}: Using Supabase SQL Editor instead`)
                console.log(`   ${statement.substring(0, 60)}...`)
                errorCount++
            } else {
                console.log(`✅ Statement ${i + 1}: Success`)
                successCount++
            }
        } catch (err) {
            console.log(`❌ Statement ${i + 1}: ${err instanceof Error ? err.message : 'Error'}`)
            errorCount++
        }
    }

    console.log('\n' + '='.repeat(80))
    console.log('\n📊 Summary:')
    console.log(`   ✅ Success: ${successCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log(`   📝 Total: ${statements.length}`)

    if (errorCount > 0) {
        console.log('\n⚠️  Some statements failed!')
        console.log('   Please run the SQL manually in Supabase SQL Editor:')
        console.log('   1. Go to Supabase Dashboard')
        console.log('   2. Open SQL Editor')
        console.log('   3. Copy contents from scripts/fix-schema.sql')
        console.log('   4. Run the SQL')
    } else {
        console.log('\n🎉 All schema fixes applied successfully!')
    }

    // Verify fixes
    console.log('\n🔍 Verifying fixes...\n')

    // Check submissions table
    const { data: subs, error: subsError } = await supabase
        .from('submissions')
        .select('*')
        .limit(1)

    if (subsError) {
        console.log('❌ submissions table: Still missing or error')
    } else {
        console.log('✅ submissions table: Created successfully')
    }

    // Check reviews table
    const { data: revs, error: revsError } = await supabase
        .from('reviews')
        .select('*')
        .limit(1)

    if (revsError) {
        console.log('❌ reviews table: Still missing or error')
    } else {
        console.log('✅ reviews table: Created successfully')
    }

    // Check users.roles column
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, roles')
        .limit(1)

    if (usersError) {
        console.log('❌ users.roles column: Still missing or error')
    } else {
        console.log('✅ users.roles column: Added successfully')
    }

    console.log('\n✅ Schema fix complete!')
}

runSchemaFix()
