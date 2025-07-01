import type { Database } from '../types/supabase';

const headers = { 'Content-Type': 'application/json' };

export const fetchTalks = async () => {
  const res = await fetch('/api/talks');
  if (!res.ok) throw new Error('Failed to load talks');
  return (await res.json()) as Database['public']['Tables']['talks']['Row'][];
};

export const fetchSpeakers = async () => {
  const res = await fetch('/api/speakers');
  if (!res.ok) throw new Error('Failed to load speakers');
  return (await res.json()) as Database['public']['Tables']['speakers']['Row'][];
};

export const createSpeaker = async (
  speaker: Omit<Database['public']['Tables']['speakers']['Row'], 'id'>,
) => {
  const res = await fetch('/api/speakers', {
    method: 'POST',
    headers,
    body: JSON.stringify(speaker),
  });
  if (!res.ok) throw new Error('Failed to create speaker');
  return (await res.json()) as Database['public']['Tables']['speakers']['Row'];
};

export const updateSpeaker = async (
  id: string,
  speaker: Partial<Database['public']['Tables']['speakers']['Row']>,
) => {
  const res = await fetch(`/api/speakers/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(speaker),
  });
  if (!res.ok) throw new Error('Failed to update speaker');
  return (await res.json()) as Database['public']['Tables']['speakers']['Row'];
};

export const deleteSpeaker = async (id: string) => {
  const res = await fetch(`/api/speakers/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete speaker');
};

export const createTalk = async (
  talk: Omit<Database['public']['Tables']['talks']['Row'], 'id'>,
) => {
  const res = await fetch('/api/talks', {
    method: 'POST',
    headers,
    body: JSON.stringify(talk),
  });
  if (!res.ok) throw new Error('Failed to create talk');
  return (await res.json()) as Database['public']['Tables']['talks']['Row'];
};

export const updateTalk = async (
  id: string,
  talk: Partial<Database['public']['Tables']['talks']['Row']>,
) => {
  const res = await fetch(`/api/talks/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(talk),
  });
  if (!res.ok) throw new Error('Failed to update talk');
  return (await res.json()) as Database['public']['Tables']['talks']['Row'];
};

export const deleteTalk = async (id: string) => {
  const res = await fetch(`/api/talks/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete talk');
};

export const uploadPhoto = async (file: File) => {
  const reader = new FileReader();
  return new Promise<string>((resolve, reject) => {
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
};
