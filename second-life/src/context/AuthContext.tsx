import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('second_life_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const mockUser = {
      id: "u123",
      name: email.split('@')[0],
      email: email,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"
    };
    setUser(mockUser);
    localStorage.setItem('second_life_user', JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('second_life_user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout, isLoading }}>
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
