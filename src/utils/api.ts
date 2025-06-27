import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';

export const fetchTalks = async () => {
  const { data, error } = await supabase
    .from('talks')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return data as Database['public']['Tables']['talks']['Row'][];
};

export const fetchSpeakers = async () => {
  const { data, error } = await supabase
    .from('speakers')
    .select('*');
  if (error) throw error;
  return data as Database['public']['Tables']['speakers']['Row'][];
};
