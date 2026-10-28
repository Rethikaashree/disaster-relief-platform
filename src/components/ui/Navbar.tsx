import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, Language } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  ShieldCheck, 
  Globe, 
  Moon, 
  Sun, 
  Bot, 
  AlertTriangle, 
  User as UserIcon, 
  LogOut, 
  Sliders, 
  Eye, 
  Menu, 
  X,
  Lock,
  Activity
} from 'lucide-react';

interface NavbarProps {
  onOpenSos: () => void;
  onOpenChatbot: () => void;
  onOpenRegistration: () => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSos,
  onOpenChatbot,
  onOpenRegistration,
  activeTab,
  setActiveTab
}) => {
  const { currentUser, currentRole, setAuthModalOpen, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { darkMode, toggleDarkMode, highContrast, toggleHighContrast, fontScale, setFontScale } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accessibilityMenuOpen, setAccessibilityMenuOpen] = useState(false);

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'ta', label: 'தமிழ்' },
    { code: 'te', label: 'తెలుగు' },
    { code: 'ml', label: 'മലയാളം' },
    { code: 'kn', label: 'ಕನ್ನಡ' }
  ];

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-lg sticky top-[37px] z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Live Emergency Badge */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-cyan-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                  RescuAid AI
                </span>
                <span className="bg-blue-900/60 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-500/30">
                  GOVT ENTERPRISE v2.6
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Disaster Verification & Transparent Aid Distribution
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'home' 
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'dashboard' 
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Dashboard ({currentRole.replace('_', ' ')})</span>
            </button>
            <button
              onClick={() => setActiveTab('gis_map')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'gis_map' 
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Live GIS Radar Map
            </button>
            <button
              onClick={onOpenRegistration}
              className="px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:brightness-110 transition-all"
            >
              + Register Victim
            </button>
          </nav>

          {/* Quick Action Tools: SOS, AI Chatbot, Language, Theme, Profile */}
          <div className="flex items-center gap-2">
            
            {/* SOS Emergency Button */}
            <button
              onClick={onOpenSos}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 text-white font-bold text-xs shadow-lg shadow-red-600/30 animate-pulse hover:scale-105 transition-transform"
            >
              <AlertTriangle className="w-4 h-4 text-yellow-300 fill-yellow-300" />
              <span>SOS Emergency</span>
            </button>

            {/* AI Assistant Button */}
            <button
              onClick={onOpenChatbot}
              className="p-2 rounded-xl bg-slate-800 text-cyan-400 hover:bg-slate-700 border border-cyan-500/20 relative group"
              title="Open Multilingual AI Chatbot"
            >
              <Bot className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative hidden md:block">
              <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl px-2 py-1">
                <Globe className="w-4 h-4 text-cyan-400 mr-1.5" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
                >
                  {languages.map(l => (
                    <option key={l.code} value={l.code} className="bg-slate-900 text-slate-200">
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Accessibility & Theme Drawer Toggle */}
            <div className="relative">
              <button
                onClick={() => setAccessibilityMenuOpen(!accessibilityMenuOpen)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                title="Accessibility & Contrast Controls"
              >
                <Sliders className="w-4 h-4" />
              </button>

              {accessibilityMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 z-50 text-xs">
                  <h4 className="font-bold text-cyan-400 border-b border-slate-800 pb-2 mb-3 flex items-center justify-between">
                    <span>Accessibility & Visuals</span>
                    <Sliders className="w-3.5 h-3.5" />
                  </h4>
                  
                  {/* Theme mode */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-300">Dark / Light Theme</span>
                    <button
                      onClick={toggleDarkMode}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400"
                    >
                      {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* High Contrast */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-300">High Contrast Mode</span>
                    <button
                      onClick={toggleHighContrast}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                        highContrast ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {highContrast ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {/* Font Scaling */}
                  <div>
                    <span className="text-slate-300 block mb-1.5">Font Size Scale</span>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => setFontScale('normal')}
                        className={`py-1 rounded text-center ${
                          fontScale === 'normal' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        100%
                      </button>
                      <button
                        onClick={() => setFontScale('large')}
                        className={`py-1 rounded text-center ${
                          fontScale === 'large' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        125%
                      </button>
                      <button
                        onClick={() => setFontScale('xlarge')}
                        className={`py-1 rounded text-center ${
                          fontScale === 'xlarge' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        150%
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile / Auth Button */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                >
                  <img
                    src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                    alt={currentUser.name}
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-cyan-400"
                  />
                  <div className="text-left hidden sm:block">
                    <div className="font-semibold leading-none">{currentUser.name}</div>
                    <div className="text-[10px] text-cyan-400 capitalize">{currentRole.replace('_', ' ')}</div>
                  </div>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          <button
            onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800"
          >
            Home
          </button>
          <button
            onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800"
          >
            Dashboard ({currentRole.replace('_', ' ')})
          </button>
          <button
            onClick={() => { setActiveTab('gis_map'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800"
          >
            Live GIS Radar Map
          </button>
          <button
            onClick={() => { onOpenRegistration(); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white"
          >
            + Register Victim
          </button>
        </div>
      )}
    </header>
  );
};
