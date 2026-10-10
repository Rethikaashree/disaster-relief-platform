import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { 
  X, 
  Lock, 
  Mail, 
  Phone, 
  Scan, 
  ShieldCheck, 
  UserCheck, 
  HeartHandshake, 
  QrCode, 
  User, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';
import { simulateFaceMatch } from '../../utils/aiSimulation';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setAuthModalOpen, login } = useAuth();
  const [activeTab, setActiveTab] = useState<'email' | 'phone' | 'google' | 'face'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('super_admin');
  const [otpSent, setOtpSent] = useState(false);
  const [isFaceScanning, setIsFaceScanning] = useState(false);
  const [faceScanSuccess, setFaceScanSuccess] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email || `${selectedRole}@rescuaid.gov.in`, selectedRole);
  };

  const handleSendOtp = () => {
    if (!phone) return;
    setOtpSent(true);
  };

  const handleVerifyOtp = () => {
    login(`user.${phone}@rescuaid.gov.in`, selectedRole);
  };

  const handleFaceScan = async () => {
    setIsFaceScanning(true);
    await simulateFaceMatch();
    setIsFaceScanning(false);
    setFaceScanSuccess(true);
    setTimeout(() => {
      login(`face.verified.${selectedRole}@rescuaid.gov.in`, selectedRole);
    }, 1000);
  };

  const roles: { role: UserRole; label: string; icon: React.ReactNode }[] = [
    { role: 'super_admin', label: 'Super Admin', icon: <ShieldCheck className="w-4 h-4" /> },
    { role: 'officer', label: 'Govt Officer', icon: <UserCheck className="w-4 h-4" /> },
    { role: 'ngo', label: 'NGO Partner', icon: <HeartHandshake className="w-4 h-4" /> },
    { role: 'volunteer', label: 'Volunteer', icon: <QrCode className="w-4 h-4" /> },
    { role: 'beneficiary', label: 'Beneficiary', icon: <User className="w-4 h-4" /> }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Secure Portal Login</h3>
              <p className="text-xs text-slate-400">Select role & authentication method</p>
            </div>
          </div>
          <button
            onClick={() => setAuthModalOpen(false)}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Role selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Select User Role
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {roles.map(r => (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => setSelectedRole(r.role)}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-semibold border transition-all ${
                    selectedRole === r.role
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/60 shadow-lg'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {r.icon}
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Auth Method Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('email')}
              className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1 transition-all ${
                activeTab === 'email' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </button>
            <button
              onClick={() => setActiveTab('phone')}
              className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1 transition-all ${
                activeTab === 'phone' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Phone OTP</span>
            </button>
            <button
              onClick={() => setActiveTab('face')}
              className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1 transition-all ${
                activeTab === 'face' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Scan className="w-3.5 h-3.5" />
              <span>Face ID</span>
            </button>
          </div>

          {/* Tab 1: Email Form */}
          {activeTab === 'email' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Official Email Address</label>
                <input
                  type="email"
                  placeholder={`${selectedRole}@rescuaid.gov.in`}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Password</label>
                <input
                  type="password"
                  defaultValue="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-extrabold text-sm shadow-lg hover:brightness-110 transition-all"
              >
                Sign In as {selectedRole.replace('_', ' ').toUpperCase()}
              </button>
            </form>
          )}

          {/* Tab 2: Phone OTP */}
          {activeTab === 'phone' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Mobile Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {!otpSent ? (
                <button
                  onClick={handleSendOtp}
                  className="w-full py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold text-sm"
                >
                  Send OTP Code
                </button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Enter 6-Digit OTP</label>
                    <input
                      type="text"
                      placeholder="882190"
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono tracking-widest text-center focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleVerifyOtp}
                    className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-sm"
                  >
                    Verify & Access Dashboard
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: AI Face ID */}
          {activeTab === 'face' && (
            <div className="text-center space-y-4 py-4">
              <div className="relative w-32 h-32 mx-auto rounded-full bg-slate-950 border-2 border-cyan-500 flex items-center justify-center overflow-hidden">
                {isFaceScanning ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-cyan-500/10">
                    <div className="w-24 h-24 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></div>
                  </div>
                ) : faceScanSuccess ? (
                  <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce" />
                ) : (
                  <Scan className="w-16 h-16 text-cyan-400" />
                )}
              </div>

              <div>
                <h4 className="font-bold text-white text-sm">AI Biometric Face Verification</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Position face in front of device camera for instant verification
                </p>
              </div>

              <button
                onClick={handleFaceScan}
                disabled={isFaceScanning}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isFaceScanning ? 'Scanning Biometrics...' : 'Start AI Face Match'}</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
