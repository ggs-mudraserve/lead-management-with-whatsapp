// Test script to verify BL filtering works
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testBLFilter() {
  // Test 1: Direct query with BL filter
  console.log('Test 1: Direct query for BL tasks');
  const { data: directBL, error: directError } = await supabase
    .from('daily_tasks')
    .select(`
      *,
      lead:leads!daily_tasks_lead_id_fkey(
        id,
        segment,
        first_name,
        last_name,
        created_at
      )
    `)
    .eq('scheduled_date', new Date().toISOString().split('T')[0])
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(100);

  if (directError) {
    console.error('Direct query error:', directError);
  } else {
    const blTasks = directBL.filter(task => task.lead?.segment === 'BL');
    console.log(`Found ${blTasks.length} BL tasks out of ${directBL.length} total tasks`);
    if (blTasks.length > 0) {
      console.log('Sample BL task:', blTasks[0]);
    }
  }

  // Test 2: Verify the foreign key relationship
  console.log('\nTest 2: Testing foreign key relationship');
  const { data: testData, error: testError } = await supabase
    .from('daily_tasks')
    .select('*, lead:lead_id(*)')
    .eq('scheduled_date', new Date().toISOString().split('T')[0])
    .limit(5);

  if (testError) {
    console.error('Relationship test error:', testError);
  } else {
    console.log('Relationship test successful, sample:', testData?.[0]);
  }
}

testBLFilter().catch(console.error);