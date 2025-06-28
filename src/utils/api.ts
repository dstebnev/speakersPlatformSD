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

export const createSpeaker = async (speaker: Omit<Database['public']['Tables']['speakers']['Row'], 'id'>) => {
  const { data, error } = await supabase
    .from('speakers')
    .insert(speaker)
    .select()
    .single();
  if (error) throw error;
  return data as Database['public']['Tables']['speakers']['Row'];
};

export const updateSpeaker = async (
  id: string,
  speaker: Partial<Database['public']['Tables']['speakers']['Row']>
) => {
  const { data, error } = await supabase
    .from('speakers')
    .update(speaker)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Database['public']['Tables']['speakers']['Row'];
};

export const deleteSpeaker = async (id: string) => {
  const { error } = await supabase.from('speakers').delete().eq('id', id);
  if (error) throw error;
};

export const createTalk = async (talk: Omit<Database['public']['Tables']['talks']['Row'], 'id'>) => {
  const { data, error } = await supabase
    .from('talks')
    .insert(talk)
    .select()
    .single();
  if (error) throw error;
  return data as Database['public']['Tables']['talks']['Row'];
};

export const updateTalk = async (
  id: string,
  talk: Partial<Database['public']['Tables']['talks']['Row']>
) => {
  const { data, error } = await supabase
    .from('talks')
    .update(talk)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Database['public']['Tables']['talks']['Row'];
};

export const deleteTalk = async (id: string) => {
  const { error } = await supabase.from('talks').delete().eq('id', id);
  if (error) throw error;
};

export const uploadPhoto = async (file: File) => {
  const filePath = `speakers/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from('photos').upload(filePath, file);
  if (error) throw error;
  const { data } = supabase.storage.from('photos').getPublicUrl(filePath);
  return data.publicUrl;
};
