export type Speaker = {
  id: string;
  name: string;
  photoUrl: string;
  description?: string;
};

export type Talk = {
  id: string;
  speakerId: string;
  title: string;
  description: string;
  eventName: string;
  direction: 'frontend' | 'backend' | 'QA' | 'mobile' | 'product' | 'data' | 'manager';
  status: 'past' | 'upcoming';
  date?: string;
  registrationLink?: string;
  recordingLink?: string;
};

export type Database = {
  public: {
    Tables: {
      speakers: {
        Row: Speaker;
      };
      talks: {
        Row: Talk;
      };
    };
  };
};
