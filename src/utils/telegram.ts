export const tg = typeof window !== 'undefined' && (window as any).Telegram?.WebApp;

export const getUsername = (): string | undefined => {
  return tg?.initDataUnsafe?.user?.username;
};

export const expand = () => {
  tg?.expand();
};
