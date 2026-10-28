import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'hi' | 'ta' | 'te' | 'ml' | 'kn';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    appTitle: 'RescuAid AI Disaster Platform',
    heroTagline: 'AI-Powered Beneficiary Verification & Transparent Aid Distribution',
    registerBeneficiary: 'Register Beneficiary',
    verifyIdentity: 'AI Verification',
    aidTracker: 'Track Relief Aid',
    emergencySos: 'Emergency SOS 🚨',
    camps: 'Relief Camps',
    warehouses: 'Warehouses & Stock',
    fraudReports: 'AI Fraud Radar',
    blockchainLedger: 'Blockchain Ledger',
    login: 'Login Portal',
    logout: 'Logout',
    activeDisasters: 'Active Disasters',
    beneficiariesRegistered: 'Registered Victims',
    aidDistributed: 'Relief Kits Delivered',
    verifiedClearance: 'Verified Aadhaar Clean',
  },
  hi: {
    appTitle: 'रेस्क्यूएड एआई आपदा सहायता मंच',
    heroTagline: 'एआई-संचालित लाभार्थी सत्यापन और पारदर्शी सहायता वितरण',
    registerBeneficiary: 'लाभार्थी पंजीकरण',
    verifyIdentity: 'एआई सत्यापन',
    aidTracker: 'सहायता ट्रैक करें',
    emergencySos: 'आपातकालीन एसओएस 🚨',
    camps: 'राहत शिविर',
    warehouses: 'गोदाम और सामग्री',
    fraudReports: 'एआई धोखाधड़ी रडार',
    blockchainLedger: 'ब्लॉकचेन लेजर',
    login: 'लॉगिन पोर्टल',
    logout: 'लॉगआउट',
    activeDisasters: 'सक्रिय आपदाएं',
    beneficiariesRegistered: 'पंजीकृत पीड़ित',
    aidDistributed: 'वितरित राहत किट',
    verifiedClearance: 'सत्यापित आधार स्वच्छ',
  },
  ta: {
    appTitle: 'ரெஸ்கியூஎய்ட் AI பேரிடர் நிவாரண தளம்',
    heroTagline: 'செயற்கை நுண்ணறிவு பயனாளிகள் சரிபார்ப்பு மற்றும் வெளிப்படையான உதவி விநியோகம்',
    registerBeneficiary: 'பயனாளி பதிவு',
    verifyIdentity: 'AI சரிபார்ப்பு',
    aidTracker: 'நிவாரண நிலை அறிதல்',
    emergencySos: 'அவசர SOS 🚨',
    camps: 'நிவாரண முகாம்கள்',
    warehouses: 'கிடங்கு & பொருட்கள்',
    fraudReports: 'AI மோசடி தடுப்பு',
    blockchainLedger: 'பிளாக்செயின் தணிக்கை',
    login: 'உள்நுழைவு',
    logout: 'வெளியேறு',
    activeDisasters: 'செயலில் உள்ள பேரிடர்கள்',
    beneficiariesRegistered: 'பதிவு செய்யப்பட்ட பயனாளிகள்',
    aidDistributed: 'விநியோகிக்கப்பட்ட நிவாரணம்',
    verifiedClearance: 'சரிபார்க்கப்பட்ட ஆധார்',
  },
  te: {
    appTitle: 'రెస్క్యూఎయిడ్ AI విపత్తు సహాయ ప్లాట్‌ఫారమ్',
    heroTagline: 'AI ఆధారిత లబ్ధిదారుల సత్యశోధన మరియు పారదర్శక సహాయ పంపిణీ',
    registerBeneficiary: 'లబ్ధిదారుల నమోదు',
    verifyIdentity: 'AI సత్యశోధన',
    aidTracker: 'సహాయ పురోగతి',
    emergencySos: 'అత్యవసర SOS 🚨',
    camps: 'సహాయ శిబిరాలు',
    warehouses: 'గోదాములు & నిల్వలు',
    fraudReports: 'AI మోసాల రాడార్',
    blockchainLedger: 'బ్లాక్‌చెయిన్ లెడ్జర్',
    login: 'లాగిన్',
    logout: 'లాగౌట్',
    activeDisasters: 'ప్రస్తుత విపత్తులు',
    beneficiariesRegistered: 'నమోదిత బాధితులు',
    aidDistributed: 'పంపిణీ చేసిన కిట్లు',
    verifiedClearance: 'ధృవీకరించబడిన ఆధార్',
  },
  ml: {
    appTitle: 'റെസ്ക്യൂഎയിഡ് AI ദുരന്ത നിവാരണ പ്ലാറ്റ്ഫോം',
    heroTagline: 'AI അടിസ്ഥാനമാക്കിയുള്ള ഗുണഭോക്തൃ പരിശോധനയും സുതാര്യമായ ആശ്വാസ വിതരണവും',
    registerBeneficiary: 'ഗുണഭോക്തൃ രജിസ്ട്രേഷൻ',
    verifyIdentity: 'AI പരിശോധന',
    aidTracker: 'ആശ്വാസ ട്രാക്കർ',
    emergencySos: 'അടിയന്തിര SOS 🚨',
    camps: 'ദുരിതാശ്വാസ ക്യാമ്പുകൾ',
    warehouses: 'ഗോഡൗണുകളും സ്റ്റോക്കും',
    fraudReports: 'AI തട്ടിപ്പ് റഡാർ',
    blockchainLedger: 'ബ്ലോക്ക്ചെയിൻ ലെഡ്ജർ',
    login: 'ലോഗിൻ',
    logout: 'ലോഗ്ഔട്ട്',
    activeDisasters: 'സജീവ ദുരന്തങ്ങൾ',
    beneficiariesRegistered: 'രജിസ്റ്റർ ചെയ്തവർ',
    aidDistributed: 'വിതരണം ചെയ്ത പാക്കറ്റുകൾ',
    verifiedClearance: 'സ്ഥിരീകരിച്ച ആധാർ',
  },
  kn: {
    appTitle: 'ರೆಸ್ಕ್ಯೂಏಡ್ AI ವಿಪತ್ತು ಪರಿಹಾರ ವೇದಿಕೆ',
    heroTagline: 'AI ಆಧಾರಿತ ಫಲಾನುಭವಿ ಪರಿಶೀಲನೆ ಮತ್ತು ಪಾರದರ್ಶಕ ನೆರವು ವಿತರಣೆ',
    registerBeneficiary: 'ಫಲಾನುಭವಿ ನೋಂದಣಿ',
    verifyIdentity: 'AI ಪರಿಶೀಲನೆ',
    aidTracker: 'ನೆರವು ಟ್ರ್ಯಾಕಿಂಗ್',
    emergencySos: 'ತುರ್ತು SOS 🚨',
    camps: 'ಪರಿಹಾರ ಶಿಬಿರಗಳು',
    warehouses: 'ಗೋದಾಮುಗಳು ಮತ್ತು ದಾಸ್ತಾನು',
    fraudReports: 'AI ವಂಚನೆ ತಡೆ',
    blockchainLedger: 'ಬ್ಲಾಕ್‌ಚೈನ್ ಲೆಡ್ಜರ್',
    login: 'ಲಾಗಿನ್',
    logout: 'ಲಾಗ್‌ಔಟ್',
    activeDisasters: 'ಸಕ್ರಿಯ ವಿಪತ್ತುಗಳು',
    beneficiariesRegistered: 'ನೋಂದಾಯಿತ ಬಾಧಿತರು',
    aidDistributed: 'ವಿತರಿಸಲಾದ ಪರಿಹಾರ ಸಾಮಾನ',
    verifiedClearance: 'ಪರಿಶೀಲಿಸಿದ ಆಧಾರ್',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
