import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@/interfaces/Player';
import { usersApi, authApi } from '@/api';

interface UserContextProps {
  user: User | null | undefined;
  setUser: (u: User | null | undefined) => void;
  refreshUser: () => Promise<void>;
  login: () => void;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextProps>({
  user: undefined,
  setUser: () => { },
  refreshUser: async () => { },
  login: () => { },
  logout: async () => { },
});

export const UserContextProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null | undefined>(() => {
    try {
      const raw = localStorage.getItem('gg_user');
      return raw ? (JSON.parse(raw) as User) : undefined;
    } catch {
      return undefined;
    }
  });

  const refreshUser = async () => {
    try {
      const u = await usersApi.getCurrentUser();
      setUser(u);
      if (u) localStorage.setItem('gg_user', JSON.stringify(u));
      else localStorage.removeItem('gg_user');
    } catch (err) {
      setUser(null);
      localStorage.removeItem('gg_user');
    }
  };

  const login = () => {
    window.location.href = authApi.getOAuthUrl('google');
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      setUser(null);
      localStorage.removeItem('gg_user');
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, refreshUser, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

export default UserContext;
