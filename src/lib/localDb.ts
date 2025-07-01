import fs from 'fs';
import path from 'path';
import { Speaker, Talk } from '../types/supabase';

export type Db = {
  speakers: Speaker[];
  talks: Talk[];
};

const dbPath = path.join(process.cwd(), 'db.json');

function readDb(): Db {
  if (!fs.existsSync(dbPath)) {
    return { speakers: [], talks: [] };
  }
  try {
    const data = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(data) as Db;
  } catch {
    return { speakers: [], talks: [] };
  }
}

function writeDb(db: Db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

export function getSpeakers(): Speaker[] {
  return readDb().speakers;
}

export function getTalks(): Talk[] {
  return readDb().talks;
}

export function addSpeaker(s: Speaker): Speaker {
  const db = readDb();
  db.speakers.push(s);
  writeDb(db);
  return s;
}

export function updateSpeaker(id: string, upd: Partial<Speaker>): Speaker | null {
  const db = readDb();
  const idx = db.speakers.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  db.speakers[idx] = { ...db.speakers[idx], ...upd };
  writeDb(db);
  return db.speakers[idx];
}

export function deleteSpeaker(id: string) {
  const db = readDb();
  db.speakers = db.speakers.filter((s) => s.id !== id);
  writeDb(db);
}

export function addTalk(t: Talk): Talk {
  const db = readDb();
  db.talks.push(t);
  writeDb(db);
  return t;
}

export function updateTalk(id: string, upd: Partial<Talk>): Talk | null {
  const db = readDb();
  const idx = db.talks.findIndex((talk) => talk.id === id);
  if (idx === -1) return null;
  db.talks[idx] = { ...db.talks[idx], ...upd };
  writeDb(db);
  return db.talks[idx];
}

export function deleteTalk(id: string) {
  const db = readDb();
  db.talks = db.talks.filter((t) => t.id !== id);
  writeDb(db);
}
