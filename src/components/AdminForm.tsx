import React, { useEffect, useState } from 'react';
import {
  fetchSpeakers,
  fetchTalks,
  createSpeaker,
  updateSpeaker,
  deleteSpeaker,
  createTalk,
  updateTalk,
  deleteTalk,
  uploadPhoto,
} from '../utils/api';
import type { Speaker, Talk } from '../types/supabase';

interface SpeakerForm extends Omit<Speaker, 'id' | 'photoUrl'> {
  photoUrl?: string;
}

interface TalkForm extends Omit<Talk, 'id'> {}

const emptySpeaker: SpeakerForm = { name: '', description: '' };

const emptyTalk: TalkForm = {
  speakerId: '',
  title: '',
  description: '',
  eventName: '',
  direction: 'frontend',
  status: 'upcoming',
  date: '',
  registrationLink: '',
  recordingLink: '',
};

export const AdminForm: React.FC = () => {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [talks, setTalks] = useState<Talk[]>([]);
  const [speakerForm, setSpeakerForm] = useState<SpeakerForm>(emptySpeaker);
  const [speakerFile, setSpeakerFile] = useState<File | null>(null);
  const [editingSpeaker, setEditingSpeaker] = useState<string | null>(null);

  const [talkForm, setTalkForm] = useState<TalkForm>(emptyTalk);
  const [editingTalk, setEditingTalk] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [sp, ta] = await Promise.all([fetchSpeakers(), fetchTalks()]);
      setSpeakers(sp);
      setTalks(ta);
    };
    load();
  }, []);

  const startAddSpeaker = () => {
    setEditingSpeaker(null);
    setSpeakerForm(emptySpeaker);
    setSpeakerFile(null);
  };

  const startEditSpeaker = (s: Speaker) => {
    setEditingSpeaker(s.id);
    setSpeakerForm({ name: s.name, description: s.description || '', photoUrl: s.photoUrl });
    setSpeakerFile(null);
  };

  const handleSaveSpeaker = async () => {
    let photoUrl = speakerForm.photoUrl;
    if (speakerFile) {
      photoUrl = await uploadPhoto(speakerFile);
    }

    if (editingSpeaker) {
      const updated = await updateSpeaker(editingSpeaker, {
        name: speakerForm.name,
        description: speakerForm.description,
        photoUrl,
      });
      setSpeakers((prev) => prev.map((s) => (s.id === editingSpeaker ? updated : s)));
    } else {
      const created = await createSpeaker({
        name: speakerForm.name,
        description: speakerForm.description,
        photoUrl: photoUrl || '',
      });
      setSpeakers((prev) => [...prev, created]);
    }

    startAddSpeaker();
  };

  const handleDeleteSpeaker = async (id: string) => {
    await deleteSpeaker(id);
    setSpeakers((prev) => prev.filter((s) => s.id !== id));
  };

  const startAddTalk = () => {
    setEditingTalk(null);
    setTalkForm({ ...emptyTalk, speakerId: speakers[0]?.id || '' });
  };

  const startEditTalk = (t: Talk) => {
    setEditingTalk(t.id);
    setTalkForm({
      speakerId: t.speakerId,
      title: t.title,
      description: t.description,
      eventName: t.eventName,
      direction: t.direction,
      status: t.status,
      date: t.date || '',
      registrationLink: t.registrationLink || '',
      recordingLink: t.recordingLink || '',
    });
  };

  const handleSaveTalk = async () => {
    if (editingTalk) {
      const updated = await updateTalk(editingTalk, talkForm);
      setTalks((prev) => prev.map((t) => (t.id === editingTalk ? updated : t)));
    } else {
      const created = await createTalk(talkForm);
      setTalks((prev) => [...prev, created]);
    }

    startAddTalk();
  };

  const handleDeleteTalk = async (id: string) => {
    await deleteTalk(id);
    setTalks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">Админская форма</h1>

      <section>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Спикеры</h2>
          <button
            onClick={startAddSpeaker}
            className="bg-green-500 text-white px-2 py-1 rounded"
          >
            Добавить
          </button>
        </div>

        <ul className="space-y-2">
          {speakers.map((s) => (
            <li key={s.id} className="flex items-center gap-2">
              <img src={s.photoUrl} alt={s.name} className="w-10 h-10 rounded-full object-cover" />
              <span className="flex-1">{s.name}</span>
              <button
                onClick={() => startEditSpeaker(s)}
                className="text-blue-600"
              >
                Редактировать
              </button>
              <button
                onClick={() => handleDeleteSpeaker(s.id)}
                className="text-red-600"
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-4 border p-4 rounded">
          <h3 className="font-semibold mb-2">
            {editingSpeaker ? 'Редактирование спикера' : 'Новый спикер'}
          </h3>
          <input
            type="text"
            placeholder="Имя"
            className="w-full mb-2 p-2 rounded border"
            value={speakerForm.name}
            onChange={(e) => setSpeakerForm({ ...speakerForm, name: e.target.value })}
          />
          <textarea
            placeholder="Описание"
            className="w-full mb-2 p-2 rounded border"
            value={speakerForm.description}
            onChange={(e) =>
              setSpeakerForm({ ...speakerForm, description: e.target.value })
            }
          />
          <input
            type="file"
            className="mb-2"
            onChange={(e) => setSpeakerFile(e.target.files ? e.target.files[0] : null)}
          />
          <button
            onClick={handleSaveSpeaker}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            Сохранить
          </button>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Доклады</h2>
          <button
            onClick={startAddTalk}
            className="bg-green-500 text-white px-2 py-1 rounded"
          >
            Добавить
          </button>
        </div>

        <ul className="space-y-2">
          {talks.map((t) => (
            <li key={t.id} className="flex items-center gap-2">
              <span className="flex-1">
                {t.title} - {speakers.find((s) => s.id === t.speakerId)?.name}
              </span>
              <button
                onClick={() => startEditTalk(t)}
                className="text-blue-600"
              >
                Редактировать
              </button>
              <button
                onClick={() => handleDeleteTalk(t.id)}
                className="text-red-600"
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-4 border p-4 rounded">
          <h3 className="font-semibold mb-2">
            {editingTalk ? 'Редактирование доклада' : 'Новый доклад'}
          </h3>
          <select
            className="w-full mb-2 p-2 rounded border"
            value={talkForm.speakerId}
            onChange={(e) => setTalkForm({ ...talkForm, speakerId: e.target.value })}
          >
            <option value="" disabled>
              Выберите спикера
            </option>
            {speakers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Название доклада"
            className="w-full mb-2 p-2 rounded border"
            value={talkForm.title}
            onChange={(e) => setTalkForm({ ...talkForm, title: e.target.value })}
          />
          <textarea
            placeholder="Описание"
            className="w-full mb-2 p-2 rounded border"
            value={talkForm.description}
            onChange={(e) => setTalkForm({ ...talkForm, description: e.target.value })}
          />
          <input
            type="text"
            placeholder="Мероприятие"
            className="w-full mb-2 p-2 rounded border"
            value={talkForm.eventName}
            onChange={(e) => setTalkForm({ ...talkForm, eventName: e.target.value })}
          />
          <select
            className="w-full mb-2 p-2 rounded border"
            value={talkForm.direction}
            onChange={(e) =>
              setTalkForm({ ...talkForm, direction: e.target.value as Talk['direction'] })
            }
          >
            <option value="frontend">frontend</option>
            <option value="backend">backend</option>
            <option value="QA">QA</option>
            <option value="mobile">mobile</option>
            <option value="product">product</option>
            <option value="data">data</option>
            <option value="manager">manager</option>
          </select>
          <select
            className="w-full mb-2 p-2 rounded border"
            value={talkForm.status}
            onChange={(e) =>
              setTalkForm({ ...talkForm, status: e.target.value as Talk['status'] })
            }
          >
            <option value="upcoming">upcoming</option>
            <option value="past">past</option>
          </select>
          <input
            type="text"
            placeholder="Дата"
            className="w-full mb-2 p-2 rounded border"
            value={talkForm.date}
            onChange={(e) => setTalkForm({ ...talkForm, date: e.target.value })}
          />
          <input
            type="text"
            placeholder="Ссылка на регистрацию"
            className="w-full mb-2 p-2 rounded border"
            value={talkForm.registrationLink}
            onChange={(e) =>
              setTalkForm({ ...talkForm, registrationLink: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Ссылка на запись"
            className="w-full mb-2 p-2 rounded border"
            value={talkForm.recordingLink}
            onChange={(e) =>
              setTalkForm({ ...talkForm, recordingLink: e.target.value })
            }
          />
          <button
            onClick={handleSaveTalk}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            Сохранить
          </button>
        </div>
      </section>
    </div>
  );
};
