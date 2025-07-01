import type { NextApiRequest, NextApiResponse } from 'next';
import { getSpeakers, addSpeaker } from '../../../lib/localDb';
import { Speaker } from '../../../types/supabase';
import { randomUUID } from 'crypto';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json(getSpeakers());
  }

  if (req.method === 'POST') {
    const body = req.body as Omit<Speaker, 'id'>;
    const newSpeaker: Speaker = { id: randomUUID(), ...body };
    addSpeaker(newSpeaker);
    return res.status(200).json(newSpeaker);
  }

  res.status(405).end();
}
