import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('\n🔍 Checking Supabase Setup...\n');
  console.log(`URL: ${supabaseUrl.substring(0, 30)}...`);

  // Check tables
  const tables = ['articles', 'daily_digests', 'tools', 'sources'];
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ ${table}: ERROR - ${error.message}`);
    } else {
      console.log(`✅ ${table}: ${count} rows`);
    }
  }

  // Check articles for slug column
  console.log('\n📋 Column Checks:');
  const { data: articleCols, error: slugError } = await supabase
    .from('articles')
    .select('slug')
    .limit(1);
  
  if (slugError) {
    console.log(`❌ articles.slug: ${slugError.message}`);
  } else {
    console.log(`✅ articles.slug column exists`);
  }

  // Check storage buckets
  console.log('\n📦 Storage Buckets:');
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  
  if (bucketError) {
    console.log(`❌ Cannot list buckets: ${bucketError.message}`);
  } else if (buckets) {
    if (buckets.length === 0) {
      console.log(`⚠️  No buckets found - create 'digests' bucket`);
    } else {
      buckets.forEach(b => console.log(`   - ${b.name} (public: ${b.public})`));
      
      const hasDigests = buckets.some(b => b.name === 'digests');
      if (!hasDigests) {
        console.log(`\n⚠️  'digests' bucket NOT found - create it in Dashboard → Storage`);
      } else {
        console.log(`\n✅ 'digests' bucket exists`);
      }
    }
  }

  console.log('\n✨ Check complete!\n');
}

check().catch(console.error);
