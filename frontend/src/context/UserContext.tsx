import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { usersApi } from '@/api';
import { auth } from '@/firebase';
import type { User } from '@/interfaces/Player';
import { useQuery } from '@tanstack/react-query';
import { type User as FirebaseUser } from 'firebase/auth';

interface UserContextProps {
  user: User | null;
  isUserLoading: boolean;
  firebaseUser: FirebaseUser | null;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextProps>({
  user: null,
  isUserLoading: false,
  firebaseUser: null,
  logout: async () => { },
});

export const UserContextProvider = ({ children }: { children: ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    const unregisterAuthObserver = auth.onAuthStateChanged((user: FirebaseUser | null) => {
      setFirebaseUser(user);
      setAuthInitialized(true);
    });

    return () => {
      unregisterAuthObserver();
    };
  }, []);

  const {data: user, isFetching} = useQuery<User | null>({
    queryKey: ["user", firebaseUser?.uid],
    queryFn: async () => {
      if (!firebaseUser) return null;
      const token = await firebaseUser.getIdToken();
      const data = await usersApi.getCurrentUser(token);
      return data;
    },
    initialData: null,
  });

  const logout = async () => {
    await auth.signOut();
  };

  const isUserLoading = !authInitialized || (!!firebaseUser && isFetching);

  return (
    <UserContext.Provider value={{ user, isUserLoading, firebaseUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

export default UserContext;
