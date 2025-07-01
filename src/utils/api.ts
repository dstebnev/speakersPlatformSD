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

const PHOTOS_BUCKET = 'photos';

const ensureSpeakersBucket = async () => {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;
  const exists = buckets?.some((b) => b.name === PHOTOS_BUCKET);
  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket(PHOTOS_BUCKET, {
      public: true,
    });
    if (createError) throw createError;
  }
};

export const uploadPhoto = async (file: File) => {
  await ensureSpeakersBucket();
  const filePath = `speakers/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from(PHOTOS_BUCKET).upload(filePath, file);
  if (error) throw error;
  const { data } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
};
