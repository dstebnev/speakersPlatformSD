import type { NextApiRequest, NextApiResponse } from 'next';
import { updateSpeaker, deleteSpeaker } from '../../../lib/localDb';
import type { Speaker } from '../../../types/supabase';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  if (req.method === 'PUT') {
    const body = req.body as Partial<Speaker>;
    if (!body.photoUrl) {
      body.photoUrl = '/default_icon.png';
    }
    const updated = updateSpeaker(id, body);
    if (!updated) return res.status(404).end();
    return res.status(200).json(updated);
  }

  if (req.method === 'DELETE') {
    deleteSpeaker(id);
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};
