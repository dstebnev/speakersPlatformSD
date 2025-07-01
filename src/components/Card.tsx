import React from 'react';
import { Talk, Speaker } from '../types/supabase';
import { useSwipeable } from 'react-swipeable';

interface Props {
  talk: Talk & { speaker: Speaker };
}

export const Card: React.FC<Props> = ({ talk }) => {
  const handlers = useSwipeable({
    onSwipedLeft: () => {},
    onSwipedRight: () => {},
  });

  const directionColors: Record<Talk['direction'], string> = {
    frontend: 'bg-green-200',
    backend: 'bg-red-200',
    QA: 'bg-yellow-200',
    mobile: 'bg-purple-200',
    product: 'bg-orange-200',
    data: 'bg-blue-200',
    manager: 'bg-pink-200',
  };

  const color = directionColors[talk.direction];

  const photoUrl = talk.speaker.photoUrl || '/default_icon.png';

  return (
    <div
      {...handlers}
      className={`p-4 rounded-xl shadow-md ${color} flex flex-col gap-2 min-w-[250px]`}
    >
      <img src={photoUrl} alt={talk.speaker.name} className="w-full h-40 object-cover rounded-md" />
      <h2 className="text-xl font-bold">{talk.speaker.name}</h2>
      <h3 className="text-lg font-semibold">{talk.title}</h3>
      <p className="text-sm">{talk.description}</p>
      <p className="text-sm italic">{talk.eventName}</p>
      {talk.status === 'past' ? (
        <a
          href={talk.recordingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-700 underline"
        >
          Смотреть запись
        </a>
      ) : (
        <>
          <p className="text-sm">{talk.date}</p>
          <a
            href={talk.registrationLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 underline"
          >
            Регистрация
          </a>
        </>
      )}
    </div>
  );
};
