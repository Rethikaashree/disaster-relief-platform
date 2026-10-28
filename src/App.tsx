import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DisasterProvider } from './context/DisasterContext';

import { RoleSwitcherBar } from './components/ui/RoleSwitcherBar';
import { Navbar } from './components/ui/Navbar';
import { LandingPage } from './components/landing/LandingPage';
import { DisasterGisMap } from './components/map/DisasterGisMap';
import { AuthModal } from './components/auth/AuthModal';
import { BeneficiaryRegistrationWizard } from './components/registration/BeneficiaryRegistrationWizard';
import { AiChatbotModal } from './components/ai/AiChatbotModal';
import { EmergencySosWidget } from './components/emergency/EmergencySosWidget';

import { SuperAdminDashboard } from './components/dashboards/SuperAdminDashboard';
import { OfficerDashboard } from './components/dashboards/OfficerDashboard';
import { NgoDashboard } from './components/dashboards/NgoDashboard';
import { VolunteerDashboard } from './components/dashboards/VolunteerDashboard';
import { BeneficiaryDashboard } from './components/dashboards/BeneficiaryDashboard';

const MainAppContent: React.FC = () => {
  const { currentRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard' | 'gis_map'>('home');

  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isSosOpen, setIsSosOpen] = useState(false);

  const renderDashboardByRole = () => {
    switch (currentRole) {
      case 'super_admin':
        return <SuperAdminDashboard />;
      case 'officer':
        return <OfficerDashboard />;
      case 'ngo':
        return <NgoDashboard />;
      case 'volunteer':
        return <VolunteerDashboard />;
      case 'beneficiary':
        return <BeneficiaryDashboard />;
      default:
        return <SuperAdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      
      {/* Global Live Testing Role Switcher */}
      <RoleSwitcherBar />

      {/* Main Navbar */}
      <Navbar
        onOpenSos={() => setIsSosOpen(true)}
        onOpenChatbot={() => setIsChatbotOpen(true)}
        onOpenRegistration={() => setIsRegistrationOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Body Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'home' && (
          <LandingPage
            onOpenRegistration={() => setIsRegistrationOpen(true)}
            onNavigateToMap={() => setActiveTab('gis_map')}
            onNavigateToDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'dashboard' && renderDashboardByRole()}

        {activeTab === 'gis_map' && <DisasterGisMap />}
      </main>

      {/* Global Modals */}
      <AuthModal />

      {isRegistrationOpen && (
        <BeneficiaryRegistrationWizard onClose={() => setIsRegistrationOpen(false)} />
      )}

      {isChatbotOpen && (
        <AiChatbotModal
          onClose={() => setIsChatbotOpen(false)}
          onOpenRegistration={() => {
            setIsChatbotOpen(false);
            setIsRegistrationOpen(true);
          }}
        />
      )}

      {isSosOpen && (
        <EmergencySosWidget onClose={() => setIsSosOpen(false)} />
      )}

    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <DisasterProvider>
            <MainAppContent />
          </DisasterProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
