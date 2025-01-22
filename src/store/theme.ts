import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ThemeState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: (() => {
        const storedTheme = localStorage.getItem('app-theme'); // Check localStorage first
        if (storedTheme) {
          return storedTheme as 'light' | 'dark';
        }

        // If not in localStorage, check browser preference
        const prefersDarkMode =
          window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDarkMode ? 'dark' : 'light'; // Default to browser preference
      })(), // IIFE to determine initial theme

      setTheme: (theme) => {
        set({ theme });
        localStorage.setItem('app-theme', theme); // Persist to localStorage
      },

      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        set({ theme: newTheme });
        localStorage.setItem('app-theme', newTheme); // Persist to localStorage
      },
    }),
    {
      name: 'theme-storage', // name of item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export default useThemeStore;
