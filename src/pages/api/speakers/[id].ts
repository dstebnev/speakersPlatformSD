import type { NextApiRequest, NextApiResponse } from 'next';
import { updateSpeaker, deleteSpeaker } from '../../../lib/localDb';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  if (req.method === 'PUT') {
    const updated = updateSpeaker(id, req.body);
    if (!updated) return res.status(404).end();
    return res.status(200).json(updated);
  }

  if (req.method === 'DELETE') {
    deleteSpeaker(id);
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}
