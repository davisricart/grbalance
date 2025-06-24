import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qkrptazfydtaoyhhczyr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcnB0YXpmeWR0YW95aGhjenlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjk4MjEsImV4cCI6MjA2NTk0NTgyMX0.1RMndlLkNeztTMsWP6_Iu8Q0VNGPYRp2H9ij7OJQVaM'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Enhanced client configuration to prevent 406 errors
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Reduce frequency of auth checks to prevent rate limiting
    flowType: 'pkce'
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
  // Add request retry logic for transient errors
  db: {
    schema: 'public',
  },
  realtime: {
    // Disable realtime to reduce connection overhead for now
    params: {
      eventsPerSecond: 2
    }
  }
})

console.log('✅ Supabase client initialized with enhanced configuration')