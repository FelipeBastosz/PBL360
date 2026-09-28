export const getAppUrl = (env = import.meta.env): string => {
  return (
    env.VITE_APP_URL ??
    (env.MODE === 'development' ? 'http://localhost:5173' : 'https://pbl360.com')
  );
};
export const APP_URL: string = getAppUrl();
