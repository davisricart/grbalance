// Client Script Management Service
// Handles all operations related to loading and managing client scripts

import { supabase } from '../config/supabase';

export interface ClientScript {
  id: string;
  name: string;
  url: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

/**
 * Load client script from Supabase
 */
export async function loadClientScript(clientId: string): Promise<string | null> {
  try {
    console.log(`🔄 Loading script for client: ${clientId}`);
    
    // Using direct fetch to Supabase REST API (as done in MainPage)
    const supabaseUrl = 'https://qkrptazfydtaoyhhczyr.supabase.co';
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcnB0YXpmeWR0YW95aGhjenlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjk4MjEsImV4cCI6MjA2NTk0NTgyMX0.1RMndlLkNeztTMsWP6_Iu8Q0VNGPYRp2H9ij7OJQVaM';
    
    const response = await fetch(`${supabaseUrl}/rest/v1/client_scripts?client_id=eq.${clientId}&select=*`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.info(`📝 No scripts uploaded yet for client ${clientId} - this is normal for new clients`);
      } else {
        console.warn(`⚠️ Script fetch error for client ${clientId}: ${response.status}`);
      }
      return null;
    }

    const scripts = await response.json();
    
    if (!scripts || scripts.length === 0) {
      console.info(`📝 No scripts found for client: ${clientId} - scripts need to be uploaded in admin`);
      return null;
    }

    const script = scripts[0]; // Get first script
    console.log(`✅ Loaded script for client ${clientId}:`, script.name);
    
    return script.content || null;

  } catch (error) {
    console.error(`❌ Error loading script for client ${clientId}:`, error);
    return null;
  }
}

/**
 * Get all client scripts
 */
export async function getAllClientScripts(): Promise<ClientScript[]> {
  try {
    const { data, error } = await supabase
      .from('client_scripts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('clientScriptService: Error fetching scripts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('clientScriptService: Error in getAllClientScripts:', error);
    return [];
  }
}

/**
 * Create or update client script
 */
export async function saveClientScript(scriptData: {
  client_id: string;
  name: string;
  content: string;
  status?: 'active' | 'inactive';
}): Promise<ClientScript | null> {
  try {
    const { data, error } = await supabase
      .from('client_scripts')
      .upsert({
        client_id: scriptData.client_id,
        name: scriptData.name,
        content: scriptData.content,
        status: scriptData.status || 'active',
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('clientScriptService: Error saving script:', error);
      return null;
    }

    console.log('clientScriptService: Script saved successfully:', data.name);
    return data;
  } catch (error) {
    console.error('clientScriptService: Error in saveClientScript:', error);
    return null;
  }
}

/**
 * Delete client script
 */
export async function deleteClientScript(scriptId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('client_scripts')
      .delete()
      .eq('id', scriptId);

    if (error) {
      console.error('clientScriptService: Error deleting script:', error);
      return false;
    }

    console.log('clientScriptService: Script deleted successfully:', scriptId);
    return true;
  } catch (error) {
    console.error('clientScriptService: Error in deleteClientScript:', error);
    return false;
  }
}

/**
 * Get script by client ID
 */
export async function getScriptByClientId(clientId: string): Promise<ClientScript | null> {
  try {
    const { data, error } = await supabase
      .from('client_scripts')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('clientScriptService: Error fetching script by client ID:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('clientScriptService: Error in getScriptByClientId:', error);
    return null;
  }
}