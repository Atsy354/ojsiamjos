const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.resolve(__dirname, '../../.env.local');
const envConfig = require('dotenv').config({ path: envPath });

if (envConfig.error) {
  console.error('Error loading .env.local:', envConfig.error);
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for admin access

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase URL or Service Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function checkSubmission(id) {
  console.log(`\n🔍 CHECKING SUBMISSION ID: ${id}`);
  
  // 1. Raw Check
  const { data: raw, error: rawError } = await supabase
    .from('submissions')
    .select('*')
    .or(`id.eq.${id},submission_id.eq.${id}`)
    .maybeSingle();
    
  if (rawError) {
    console.error('❌ Database Error (Raw Check):', rawError);
    return;
  }
  
  if (!raw) {
    console.error('❌ VALIDATION FAILED: Submission ID ' + id + ' does NOT exist in database.');
    
    // Check recent to prove DB connection works
    const { data: recent } = await supabase.from('submissions').select('id, title').order('id', { ascending: false }).limit(5);
    console.log('ℹ️ Recent Submissions (to prove DB is UP):', recent);
    return;
  }
  
  console.log('✅ Submission Exists (Raw):', { id: raw.id, title: raw.title, journal_id: raw.journal_id, submitter_id: raw.submitter_id });
  
  // 2. Check Relations
  console.log('\n🔍 CHECKING RELATIONS:');
  
  // Submitter
  const { data: user, error: userError } = await supabase.from('users').select('id, email').eq('id', raw.submitter_id).maybeSingle();
  if (user) console.log(`✅ Submitter Found: ${user.email} (${user.id})`);
  else {
    console.error(`❌ Submitter MISSING: ${raw.submitter_id} - This will cause API failures!`);
    const {data: anyUser} = await supabase.from('users').select('id').limit(1);
    console.log(`ℹ️ Debug: Users table has ${anyUser ? 'data' : 'no data'}`);
  }
  
  // Section
  if (raw.section_id) {
    const { data: sec, error: secError } = await supabase.from('sections').select('id, title').eq('id', raw.section_id).maybeSingle();
    if (sec) console.log(`✅ Section Found: ${sec.title} (${sec.id})`);
    else console.error(`❌ Section MISSING: ${raw.section_id}`);
  }
  
  // Review Rounds
  const { data: rounds, error: roundError } = await supabase.from('review_rounds').select('*').eq('submission_id', raw.id);
  console.log(`ℹ️ Review Rounds: ${rounds ? rounds.length : 0}`);

  // Files
  const { data: files, error: fileError } = await supabase.from('submission_files').select('*').eq('submission_id', raw.id);
  console.log(`ℹ️ Files: ${files ? files.length : 0}`);
}

// Check ID 24 (from user screenshot)
checkSubmission(24);
