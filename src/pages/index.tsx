import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { FilterBar } from '../components/FilterBar';
import { fetchSpeakers, fetchTalks } from '../utils/api';
import { Talk, Speaker } from '../types/supabase';
import { expand } from '../utils/telegram';

interface TalkWithSpeaker extends Talk {
  speaker: Speaker;
}

const testSpeakers: Speaker[] = [
  {
    id: '1',
    name: 'Иван Иванов',
    photoUrl: 'https://via.placeholder.com/150',
    description: 'Frontend разработчик',
  },
];

const testTalks: Talk[] = [
  {
    id: 't1',
    speakerId: '1',
    title: 'Реактивный фронтенд',
    description: 'Всё о React',
    eventName: 'Frontend Conf',
    direction: 'frontend',
    status: 'upcoming',
    date: '2024-08-10',
    registrationLink: 'https://example.com',
  },
];

const HomePage: React.FC = () => {
  const [direction, setDirection] = useState('all');
  const [status, setStatus] = useState('all');
  const [talks, setTalks] = useState<TalkWithSpeaker[]>([]);

  useEffect(() => {
    expand();
    // Здесь будет загрузка данных с сервера
    const combined = testTalks.map((talk) => ({
      ...talk,
      speaker: testSpeakers.find((s) => s.id === talk.speakerId)!,
    }));
    setTalks(combined);
  }, []);

  const filtered = talks.filter((t) => {
    return (
      (direction === 'all' || t.direction === direction) &&
      (status === 'all' || t.status === status)
    );
  });

  return (
    <div className="p-4">
      <FilterBar direction={direction} status={status} setDirection={setDirection} setStatus={setStatus} />
      <div className="flex gap-4 overflow-x-auto py-4">
        {filtered.map((talk) => (
          <Card key={talk.id} talk={talk} />
        ))}
      </div>
    </div>
  );
};

export default HomePage;
