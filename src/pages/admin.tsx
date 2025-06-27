import React, { useEffect, useState } from 'react';
import { AdminForm } from '../components/AdminForm';
import { getUsername, expand } from '../utils/telegram';

const allowedUsers = (process.env.ADMIN_USERNAMES || '').split(',');

const AdminPage: React.FC = () => {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    expand();
    const username = getUsername();
    if (username && allowedUsers.includes(username)) {
      setAllowed(true);
    }
  }, []);

  if (!allowed) {
    return <p className="p-4">Доступ запрещён</p>;
  }

  return <AdminForm />;
};

export default AdminPage;
