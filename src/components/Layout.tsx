import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getUsername } from '../utils/telegram';

const allowedUsers = (process.env.ADMIN_USERNAMES || '').split(',');

interface Props {
  children: React.ReactNode;
}

const Layout: React.FC<Props> = ({ children }) => {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const username = getUsername();
    if (username && allowedUsers.includes(username)) {
      setIsAdmin(true);
    }
  }, []);

  const linkClass = (path: string) =>
    `p-2 ${router.pathname === path ? 'text-blue-600' : 'text-gray-600'}`;

  return (
    <div className="pb-20">
      {children}
      <nav className="fixed bottom-0 left-0 right-0 flex justify-around border-t bg-white">
        <Link href="/" className={linkClass('/')}
          aria-label="Выступления">
          <span className="text-2xl">🎤</span>
        </Link>
        {isAdmin && (
          <Link href="/admin" className={linkClass('/admin')}
            aria-label="Админка">
            <span className="text-2xl">🛠</span>
          </Link>
        )}
        <Link href="/profile" className={linkClass('/profile')} aria-label="Личный кабинет">
          <span className="text-2xl">👤</span>
        </Link>
      </nav>
    </div>
  );
};

export default Layout;
