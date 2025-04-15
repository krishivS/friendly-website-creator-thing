
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types/cms';

// Mock user data for demo purposes
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@cms.edu',
    role: 'admin',
    avatar: 'https://ui-avatars.com/api/?name=Admin&background=6d28d9&color=fff',
  },
  {
    id: '2',
    name: 'Teacher User',
    email: 'teacher@cms.edu',
    role: 'teacher',
    avatar: 'https://ui-avatars.com/api/?name=Teacher&background=8b5cf6&color=fff',
  },
  {
    id: '3',
    name: 'Student User',
    email: 'student@cms.edu',
    role: 'student',
    avatar: 'https://ui-avatars.com/api/?name=Student&background=a78bfa&color=fff',
  },
];

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem('cms_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API request delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find user by email (in a real app, this would be an API call)
    const user = mockUsers.find(u => u.email === email);
    
    // Simple mock authentication (in a real app, you would validate password)
    if (user && password === 'password') {
      setCurrentUser(user);
      localStorage.setItem('cms_user', JSON.stringify(user));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('cms_user');
  };

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
