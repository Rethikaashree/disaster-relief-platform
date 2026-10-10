import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  highContrast: boolean;
  toggleHighContrast: () => void;
  fontScale: 'normal' | 'large' | 'xlarge';
  setFontScale: (scale: 'normal' | 'large' | 'xlarge') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [fontScale, setFontScale] = useState<'normal' | 'large' | 'xlarge'>('normal');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);
  const toggleHighContrast = () => setHighContrast(prev => !prev);

  return (
    <ThemeContext.Provider 
      value={{ 
        darkMode, 
        toggleDarkMode, 
        highContrast, 
        toggleHighContrast, 
        fontScale, 
        setFontScale 
      }}
    >
      <div className={`${fontScale === 'large' ? 'text-lg' : fontScale === 'xlarge' ? 'text-xl' : 'text-base'} ${highContrast ? 'contrast-125 saturate-150' : ''}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
