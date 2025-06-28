import React from 'react';
import SpeakerCard from '../components/SpeakerCard';

const Examples = () => {
  const upcoming = {
    speaker: {
      name: 'Анна Каренина',
      photoUrl: 'https://via.placeholder.com/150',
    },
    talk: {
      title: 'Будущие тренды фронтенда',
      description: 'О новинках',
      eventName: 'Frontend Conf',
      status: 'upcoming' as const,
      date: '2025-05-20',
      registrationLink: 'https://example.com/reg',
    },
  };

  const past = {
    speaker: {
      name: 'Лев Толстой',
      photoUrl: 'https://via.placeholder.com/150',
    },
    talk: {
      title: 'История JavaScript',
      description: 'От начала до наших дней',
      eventName: 'JS Meetup',
      status: 'past' as const,
      recordingLink: 'https://example.com/video',
    },
  };

  return (
    <div className="p-4 flex flex-col gap-6 items-center">
      <SpeakerCard
        speaker={upcoming.speaker}
        talk={upcoming.talk}
        gradient="from-yellow-300 via-pink-400 to-pink-600"
      />
      <SpeakerCard
        speaker={past.speaker}
        talk={past.talk}
        gradient="from-green-300 via-blue-400 to-purple-500"
      />
    </div>
  );
};

export default Examples;
