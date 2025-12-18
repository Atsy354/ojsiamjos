
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifySchema() {
    console.log('Verifying submission_files schema...')

    // Try to insert a dummy record that requires the new columns
    // If it fails, we know we need to migrate
    // We will rollback immediately (delete)

    try {
        // Check columns by selecting headers (if possible) or just inspecting
        // Supabase JS doesn't give schema info easily.
        // We'll try to select columns that SHOULD exist

        const { data, error } = await supabase
            .from('submission_files')
            .select('file_id, submission_id, file_stage, original_file_name, file_name')
            .limit(1)

        if (error) {
            console.error('Schema check failed:', error.message)
            if (error.message.includes('does not exist')) {
                console.log('Column missing! Migration is needed.')
            }
        } else {
            console.log('Schema appears correct (columns exist).')
        }

        // Check activity_logs
        console.log('Verifying activity_logs...')
        const { error: logError } = await supabase
            .from('activity_logs')
            .select('*')
            .limit(1)

        if (logError) {
            console.error('activity_logs check failed:', logError.message)
        } else {
            console.log('activity_logs table exists.')
        }

    } catch (err) {
        console.error('Verification script error:', err)
    }
}

verifySchema()
