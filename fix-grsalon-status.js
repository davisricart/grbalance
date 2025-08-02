const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qkrptazfydtaoyhhczyr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcnB0YXpmeWR0YW95aGhjenlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjk4MjEsImV4cCI6MjA2NTk0NTgyMX0.1RMndlLkNeztTMsWP6_Iu8Q0VNGPYRp2H9ij7OJQVaM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixGRSalonStatus() {
  console.log('🔧 Fixing GR Salon status for admin visibility...');
  
  try {
    // Update usage table to 'approved' status so it shows in admin dashboard
    const { error: usageError } = await supabase
      .from('usage')
      .update({
        status: 'approved', // This makes it visible in approved tab
        updatedAt: new Date().toISOString()
      })
      .eq('email', 'grbalancetesting@gmail.com');
    
    if (usageError) {
      console.error('❌ Usage update failed:', usageError);
      return;
    }
    
    // Ensure clients table has active status (for portal access)
    const { error: clientError } = await supabase
      .from('clients')
      .update({
        status: 'active' // Portal access works with active status
      })
      .eq('email', 'grbalancetesting@gmail.com');
    
    if (clientError) {
      console.error('❌ Client update failed:', clientError);
      return;
    }
    
    console.log('✅ GR Salon status fixed!');
    console.log('📋 Now has:');
    console.log('   - usage.status = "approved" (visible in admin dashboard)');
    console.log('   - clients.status = "active" (portal access works)');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

fixGRSalonStatus();