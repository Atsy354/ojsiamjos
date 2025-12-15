const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load env
try {
  const envPath = path.resolve(__dirname, '../../.env.local');
  require('dotenv').config({ path: envPath });
} catch (e) {
  console.error("Dotenv error:", e);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase URL or Service Key');
  console.log("URL:", supabaseUrl ? "Set" : "Missing");
  console.log("Key:", serviceKey ? "Set" : "Missing");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function debug() {
  console.log("--- DEBUG START ---");
  
  // 1. List ALL submissions to see what IDs actually exist
  console.log("\n1. Listing Top 10 Submissions:");
  const { data: all, error: err1 } = await supabase
    .from('submissions')
    .select('id, title, journal_id, submitter_id, status')
    .order('id', { ascending: false })
    .limit(10);
    
  if (err1) console.error("Error listing:", err1);
  else console.table(all);

  // 2. Check specific ID 24
  const targetId = 24;
  console.log(`\n2. Checking ID ${targetId} specifically:`);
  
  const { data: one, error: err2 } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', targetId)
    .maybeSingle();

  if (err2) console.error("Error getting specific:", err2);
  else if (!one) console.log(`❌ ID ${targetId} NOT FOUND in 'submissions' table`);
  else {
    console.log(`✅ ID ${targetId} FOUND!`);
    console.log("Data:", one);
    
    // Check relations for this valid submission
    console.log("\n3. Checking Relations for ID " + targetId);
    
    // User
    const { data: u } = await supabase.from('users').select('id, email').eq('id', one.submitter_id).maybeSingle();
    console.log(`Submitter (${one.submitter_id}):`, u ? `Found (${u.email})` : "❌ MISSING in users table");
    
    // Files
    const { data: f } = await supabase.from('submission_files').select('file_id').eq('submission_id', targetId);
    console.log("Files:", f ? f.length : "Error");
    
    // Review Rounds
    const { data: r } = await supabase.from('review_rounds').select('id').eq('submission_id', targetId);
    console.log("Review Rounds:", r ? r.length : "Error");
  }
}

debug();
