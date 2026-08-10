import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// TODO: Replace these with your actual Supabase URL and Anon Key
const supabaseUrl = 'https://gzvizgozojrczqvfcxgl.supabase.co';
const supabaseAnonKey = 'sb_publishable_B47vblzm93uf099TyyvfYg_GyeBWg1c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
