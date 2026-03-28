import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { login as apiLogin, refreshToken as apiRefreshToken, getCurrentProfile } from '@workspace/api-client-react';
import { setAuthTokenGetter } from '@workspace/api-client-react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  /** Tokens from OAuth redirect (?token=&refresh_token=); not authorization code exchange. */
  loginWithGoogle: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setAuthTokenGetter(() => Cookies.get('accessToken') || null);
  }, []);

  const refreshTokenAndFetchUser = async () => {
    const refreshToken = Cookies.get('refreshToken');
    if (refreshToken) {
      try {
        const { accessToken, refreshToken: newRefreshToken } = await apiRefreshToken({ refreshToken });
        Cookies.set('accessToken', accessToken, { expires: 1 }); // 1 day
        Cookies.set('refreshToken', newRefreshToken, { expires: 7 }); // 7 days
        const profile = await getCurrentProfile();
        const user: User = {
          id: profile.id,
          name: `${profile.firstName} ${profile.lastName}`,
          email: profile.email,
          avatar: profile.avatar || null,
        };
        setUser(user);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
      }
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get('accessToken');
      if (token) {
        try {
          const profile = await getCurrentProfile();
          const user: User = {
            id: profile.id,
            name: `${profile.firstName} ${profile.lastName}`,
            email: profile.email,
            avatar: profile.avatar || null,
          };
          setUser(user);
        } catch (error) {
          console.error('Failed to fetch profile with existing token, attempting refresh:', error);
          await refreshTokenAndFetchUser();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const { accessToken, refreshToken } = await apiLogin({ email, password });
    
    Cookies.set('accessToken', accessToken, { expires: 1 }); // 1 day
    Cookies.set('refreshToken', refreshToken, { expires: 7 }); // 7 days
    
    const profile = await getCurrentProfile();
    const user: User = {
      id: profile.id,
      name: `${profile.firstName} ${profile.lastName}`,
      email: profile.email,
      avatar: profile.avatar || null,
    };
    setUser(user);
  };

  const loginWithGoogle = async (accessToken: string, refreshToken: string) => {
    Cookies.set('accessToken', accessToken, { expires: 1 });
    Cookies.set('refreshToken', refreshToken, { expires: 7 });

    const profile = await getCurrentProfile();
    const user: User = {
      id: profile.id,
      name: `${profile.firstName} ${profile.lastName}`,
      email: profile.email,
      avatar: profile.avatar || null,
    };
    setUser(user);
  };

  const logout = () => {
    setUser(null);
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
  };

  return (
    <AuthContext.Provider value={{user, isLoggedIn: !!user, login, loginWithGoogle, logout, isLoading}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
