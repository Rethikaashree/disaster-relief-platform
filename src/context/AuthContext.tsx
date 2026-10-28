import React, { createContext, useContext, useState } from 'react';
import { User, UserRole } from '../types';
import { mockUsers } from '../data/mockData';

interface AuthContextType {
  currentUser: User | null;
  currentRole: UserRole;
  switchRole: (role: UserRole) => void;
  login: (email: string, role: UserRole) => void;
  logout: () => void;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(mockUsers[0]); // default Super Admin
  const [currentRole, setCurrentRole] = useState<UserRole>('super_admin');
  const [isAuthModalOpen, setAuthModalOpen] = useState<boolean>(false);

  const switchRole = (role: UserRole) => {
    const targetUser = mockUsers.find(u => u.role === role) || {
      id: `usr_${role}`,
      name: `${role.toUpperCase().replace('_', ' ')} Profile`,
      email: `${role}@rescuaid.gov.in`,
      role,
      phone: '+91 90000 00000',
      district: 'Cuddalore District'
    };
    setCurrentUser(targetUser);
    setCurrentRole(role);
  };

  const login = (email: string, role: UserRole) => {
    const user = mockUsers.find(u => u.email === email) || {
      id: `usr_${Date.now()}`,
      name: email.split('@')[0].toUpperCase(),
      email,
      role,
      phone: '+91 98765 43210',
      district: 'Cuddalore District'
    };
    setCurrentUser(user);
    setCurrentRole(role);
    setAuthModalOpen(false);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        switchRole,
        login,
        logout,
        isAuthModalOpen,
        setAuthModalOpen
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
