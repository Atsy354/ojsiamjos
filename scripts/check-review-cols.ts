
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function checkReviewCols() {
    console.log('Checking review_assignments columns...')
    const cols = ['review_round_id', 'recommendation', 'quality', 'comments_for_editor']

    for (const col of cols) {
        const { error } = await supabase.from('review_assignments').select(col).limit(1)
        if (error) {
            console.log(`Column '${col}' missing: ${error.message}`)
        } else {
            console.log(`Column '${col}' OK`)
        }
    }
}

checkReviewCols()
