// Simple script to test Supabase storage URL
const { createClient } = require('@supabase/supabase-js');

// Replace with your Supabase URL and anon key
const supabaseUrl = 'https://vxcdvuekhfdkccjhbrhz.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

// File path from the database query
const filePath = '2025-05-02/9654774180/1746161115522_c057pdvoqpn_117310317159 (10).pdf';

// Get the public URL
const { data } = supabase.storage
  .from('whatsapp')
  .getPublicUrl(filePath);

console.log('Public URL:', data.publicUrl);
