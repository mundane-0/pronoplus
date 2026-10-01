import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
  setAccentColor: (color: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      accentColor: '#3b82f6',

      setTheme: (theme) => {
        set({ theme });
        applyThemeToDOM(theme);
      },

      toggleTheme: () => {
        const currentTheme = get().theme;
        let newTheme: 'light' | 'dark' | 'system';
        
        if (currentTheme === 'system') {
          newTheme = 'dark';
        } else if (currentTheme === 'dark') {
          newTheme = 'light';
        } else {
          newTheme = 'system';
        }
        
        set({ theme: newTheme });
        applyThemeToDOM(newTheme);
      },

      setAccentColor: (color) => {
        set({ accentColor: color });
        applyAccentColorToDOM(color);
      }
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            applyThemeToDOM(state.theme);
            applyAccentColorToDOM(state.accentColor);
          }
        };
      }
    }
  )
);

function applyThemeToDOM(theme: 'light' | 'dark' | 'system') {
  const root = document.documentElement;
  
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  } else if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

function applyAccentColorToDOM(color: string) {
  const root = document.documentElement;
  
  // Convertir hex en HSL pour les variables CSS
  const hexToHsl = (hex: string) => {
    let r = 0, g = 0, b = 0;
    
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex[1] + hex[2], 16);
      g = parseInt(hex[3] + hex[4], 16);
      b = parseInt(hex[5] + hex[6], 16);
    }
    
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      
      h /= 6;
    }
    
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  };
  
  const [h, s, l] = hexToHsl(color);
  
  // Mettre à jour les variables CSS
  root.style.setProperty('--primary', `${h} ${s}% ${l}%`);
  root.style.setProperty('--ring', `${h} ${s}% ${l}%`);
}

// Initialiser le thème au chargement
if (typeof window !== 'undefined') {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  
  // Écouter les changements de thème système
  prefersDark.addEventListener('change', (e) => {
    const theme = useThemeStore.getState().theme;
    if (theme === 'system') {
      applyThemeToDOM('system');
    }
  });
}