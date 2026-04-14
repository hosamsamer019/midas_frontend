"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Try to get user info from localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        } catch (e) {
          // If user data is invalid, ignore
        }
      }
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post('http://localhost:8000/api/auth/token/', {
        username,
        password,
      });
      const { access, user: userData } = response.data;
      
      // Transform user data to match frontend User interface
      const transformedUser = {
        id: userData.user_id,
        username: userData.full_name,
        email: userData.email,
        role: userData.role_name,
      };
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('user', JSON.stringify(transformedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      setUser(transformedUser);
      setIsAuthenticated(true);
    } catch (error) {
      throw new Error('Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;

    const rolePermissions: { [key: string]: string[] } = {
      admin: ['create_user', 'view_all', 'edit_all', 'delete_all'],
      manager: ['view_all', 'edit_samples', 'edit_results', 'generate_reports'],
      doctor: ['view_samples', 'view_results', 'view_reports'],
      lab_technician: ['create_samples', 'edit_own_samples', 'create_results', 'edit_own_results']
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};
