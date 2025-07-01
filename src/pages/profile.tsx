import React, { useEffect } from 'react';
import { expand } from '../utils/telegram';

const ProfilePage: React.FC = () => {
  useEffect(() => {
    expand();
  }, []);

  return <p className="p-4">Личный кабинет</p>;
};

export default ProfilePage;
