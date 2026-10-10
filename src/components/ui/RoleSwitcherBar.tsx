import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { ShieldAlert, UserCheck, HeartHandshake, QrCode, User } from 'lucide-react';

export const RoleSwitcherBar: React.FC = () => {
  const { currentRole, switchRole } = useAuth();

  const roles: { role: UserRole; label: string; icon: React.ReactNode; color: string }[] = [
    { 
      role: 'super_admin', 
      label: 'Super Admin', 
      icon: <ShieldAlert className="w-4 h-4" />, 
      color: 'from-blue-600 to-indigo-700 text-white' 
    },
    { 
      role: 'officer', 
      label: 'Govt Officer', 
      icon: <UserCheck className="w-4 h-4" />, 
      color: 'from-cyan-500 to-blue-600 text-white' 
    },
    { 
      role: 'ngo', 
      label: 'NGO Partner', 
      icon: <HeartHandshake className="w-4 h-4" />, 
      color: 'from-emerald-500 to-teal-600 text-white' 
    },
    { 
      role: 'volunteer', 
      label: 'Field Volunteer', 
      icon: <QrCode className="w-4 h-4" />, 
      color: 'from-amber-500 to-orange-600 text-white' 
    },
    { 
      role: 'beneficiary', 
      label: 'Beneficiary', 
      icon: <User className="w-4 h-4" />, 
      color: 'from-purple-500 to-pink-600 text-white' 
    }
  ];

  return (
    <div className="bg-slate-950/90 border-b border-cyan-500/20 py-2 px-4 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold uppercase tracking-wider">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          Enterprise Role Switcher (Live Testing Mode):
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {roles.map(r => {
            const isActive = currentRole === r.role;
            return (
              <button
                key={r.role}
                onClick={() => switchRole(r.role)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-all ${
                  isActive 
                    ? `bg-gradient-to-r ${r.color} shadow-lg scale-105 ring-2 ring-white/30` 
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/80 border border-slate-700/50'
                }`}
              >
                {r.icon}
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
