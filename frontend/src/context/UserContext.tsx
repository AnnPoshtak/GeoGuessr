import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { usersApi } from '@/api';
import { auth } from '@/firebase';
import type { User } from '@/interfaces/Player';
import { useQuery } from '@tanstack/react-query';
import { type User as FirebaseUser } from 'firebase/auth';

interface UserContextProps {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  setUser: (u: User | null) => void;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextProps>({
  user: null,
  firebaseUser: null,
  setUser: () => { },
  logout: async () => { },
});

export const UserContextProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(auth.currentUser);

  useEffect(() => {
    const unregisterAuthObserver = auth.onAuthStateChanged((user: FirebaseUser | null) => {
      setFirebaseUser(user);
    });

    return () => {
      unregisterAuthObserver();
    };
  }, []);

  useQuery<User | null>({
    queryKey: ["user", firebaseUser?.uid],
    queryFn: async () => {
      if (!firebaseUser) {
        setUser(null);
        return null;
      };
      const token = await firebaseUser.getIdToken();
      const data = await usersApi.getCurrentUser(token);
      setUser(data);
      return data;
    },
  });

  const logout = async () => {
    await auth.signOut();
  };

  return (
    <UserContext.Provider value={{ user, firebaseUser, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

export default UserContext;
