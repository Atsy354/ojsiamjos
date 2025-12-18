
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function checkColumns() {
    console.log('Checking columns...')
    // Try to select specific columns to see if they error
    const cols = ['file_id', 'submission_id', 'file_stage', 'original_file_name', 'created_by']

    for (const col of cols) {
        const { error } = await supabase.from('submission_files').select(col).limit(1)
        if (error) {
            console.log(`Column '${col}' missing or error: ${error.message}`)
        } else {
            console.log(`Column '${col}' OK`)
        }
    }
}

checkColumns()
