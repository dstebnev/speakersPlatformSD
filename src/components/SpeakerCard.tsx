import React from 'react';

interface Speaker {
  name: string;
  photoUrl: string;
}

interface Talk {
  title: string;
  description: string;
  eventName: string;
  status: 'past' | 'upcoming';
  date?: string;
  registrationLink?: string;
  recordingLink?: string;
}

interface SpeakerCardProps {
  speaker: Speaker;
  talk: Talk;
  /**
   * Tailwind gradient classes, e.g. "from-yellow-400 via-pink-400 to-red-500"
   */
  gradient?: string;
}

export const SpeakerCard: React.FC<SpeakerCardProps> = ({
  speaker,
  talk,
  gradient = 'from-yellow-300 via-pink-400 to-pink-600',
}) => {
  const badgeLabel = talk.status === 'past' ? 'Прошло' : 'Будет';
  const link =
    talk.status === 'past' ? talk.recordingLink : talk.registrationLink;
  const buttonLabel =
    talk.status === 'past' ? 'Смотреть запись' : 'Регистрация';

  const openLink = () => {
    if (link) {
      window.open(link, '_blank');
    }
  };

  return (
    <div
      className={`relative rounded-2xl shadow-xl p-4 text-center overflow-hidden bg-gradient-to-br ${gradient}`}
    >
      <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-20 pointer-events-none rounded-2xl" />
      <span
        className="absolute top-4 right-4 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full"
      >
        {badgeLabel}
      </span>
      <div className="relative flex flex-col items-center gap-2">
        <img
          src={speaker.photoUrl}
          alt={speaker.name}
          className="w-24 h-24 rounded-full border-4 border-white shadow-lg -mt-12 object-cover"
        />
        <h2 className="text-xl font-bold text-white">{speaker.name}</h2>
        <h3 className="text-base font-semibold text-white">{talk.title}</h3>
        <p className="text-sm text-white/90">{talk.eventName}</p>
        {talk.status === 'upcoming' && talk.date && (
          <p className="text-sm text-white/90">{talk.date}</p>
        )}
        {link && (
          <button
            onClick={openLink}
            className="mt-2 bg-pink-500 hover:bg-pink-600 text-white rounded-full px-4 py-2 font-semibold"
          >
            {buttonLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default SpeakerCard;
