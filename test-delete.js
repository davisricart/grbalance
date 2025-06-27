// Quick test script to verify Supabase delete functionality
// Run this in browser console or as a standalone test

const testSupabaseDelete = async () => {
  const supabaseUrl = 'https://qkrptazfydtaoyhhczyr.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcnB0YXpmeWR0YW95aGhjenlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjk4MjEsImV4cCI6MjA2NTk0NTgyMX0.1RMndlLkNeztTMsWP6_Iu8Q0VNGPYRp2H9ij7OJQVaM';
  
  // Test 1: Check if user exists
  console.log('🔍 Step 1: Checking if test user exists...');
  const checkResponse = await fetch(`${supabaseUrl}/rest/v1/usage?select=*&email=eq.test@test.com`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  const users = await checkResponse.json();
  console.log('📋 Users found:', users);
  
  if (users.length === 0) {
    console.log('❌ No test@test.com user found');
    return;
  }
  
  const testUser = users[0];
  console.log('✅ Found test user:', testUser);
  
  // Test 2: Try to delete
  console.log('🗑️ Step 2: Attempting to delete user...');
  const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/usage?id=eq.${testUser.id}`, {
    method: 'DELETE',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  });
  
  console.log('📋 Delete response status:', deleteResponse.status);
  console.log('📋 Delete response:', await deleteResponse.text());
  
  // Test 3: Verify deletion
  console.log('🔍 Step 3: Verifying deletion...');
  const verifyResponse = await fetch(`${supabaseUrl}/rest/v1/usage?select=*&id=eq.${testUser.id}`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  const remainingUsers = await verifyResponse.json();
  console.log('📋 Remaining users:', remainingUsers);
  
  if (remainingUsers.length === 0) {
    console.log('✅ SUCCESS: User successfully deleted!');
  } else {
    console.log('❌ FAILED: User still exists after delete');
  }
};

// Run the test
testSupabaseDelete().catch(console.error);