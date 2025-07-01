import type { NextApiRequest, NextApiResponse } from 'next';
import { getTalks, addTalk } from '../../../lib/localDb';
import { Talk } from '../../../types/supabase';
import { randomUUID } from 'crypto';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json(getTalks());
  }

  if (req.method === 'POST') {
    const body = req.body as Omit<Talk, 'id'>;
    const newTalk: Talk = { id: randomUUID(), ...body };
    addTalk(newTalk);
    return res.status(200).json(newTalk);
  }

  res.status(405).end();
}
