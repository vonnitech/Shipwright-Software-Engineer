import React, { createContext, useContext, useState, useEffect } from 'react';
import { type User, api } from '~/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  signup: (name: string, email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, we might fetch the current user profile here using the token
    const token = api.getToken();
    if (token) {
      // Mocking user fetch for now since we don't have a /auth/me endpoint in the spec
      // But usually we'd do: api.getMe().then(setUser).finally(() => setIsLoading(false))
      
      // For now, let's just assume if there's a token, we might have user info in localStorage
      const savedUser = localStorage.getItem('user_info');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string) => {
    const res = await api.login(email);
    setUser(res.user);
    localStorage.setItem('user_info', JSON.stringify(res.user));
  };

  const signup = async (name: string, email: string) => {
    const res = await api.signup(name, email);
    setUser(res.user);
    localStorage.setItem('user_info', JSON.stringify(res.user));
  };

  const logout = () => {
    api.logout();
    setUser(null);
    localStorage.removeItem('user_info');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
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
