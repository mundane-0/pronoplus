import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  class: string;
  establishment: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  clearError: () => void;
}

interface LoginCredentials {
  url: string;
  username: string;
  password: string;
  ent?: string;
  rememberMe: boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true, error: null });

          const result = await window.mainAPI.login(credentials);
          
          if (!result.success) {
            throw new Error(result.error || 'Erreur de connexion');
          }

          // Créer l'utilisateur à partir des données Pronote
          const user: User = {
            id: result.user?.id || '',
            name: result.user?.name || 'Élève',
            class: result.user?.class?.name || 'Classe inconnue',
            establishment: result.user?.establishment?.name || 'Établissement inconnu',
            avatar: result.user?.avatar
          };

          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error: any) {
          console.error('Erreur lors de la connexion:', error);
          set({ 
            error: error.message || 'Erreur de connexion', 
            isLoading: false 
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });
          
          await window.mainAPI.logout();
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        } catch (error) {
          console.error('Erreur lors de la déconnexion:', error);
          set({ isLoading: false });
        }
      },

      checkAuthStatus: async () => {
        try {
          set({ isLoading: true });
          
          // Vérifier si des credentials sont sauvegardés
          const savedCredentials = await window.mainAPI.getSavedCredentials();
          
          if (savedCredentials) {
            // Essayer de se reconnecter automatiquement
            const result = await window.mainAPI.login({
              url: savedCredentials.url,
              username: savedCredentials.username,
              password: savedCredentials.password,
              rememberMe: true
            });
            
            if (result.success && result.user) {
              const user: User = {
                id: result.user.id || '',
                name: result.user.name || 'Élève',
                class: result.user.class?.name || 'Classe inconnue',
                establishment: result.user.establishment?.name || 'Établissement inconnu',
                avatar: result.user.avatar
              };

              set({ 
                user, 
                isAuthenticated: true,
                isLoading: false 
              });
              return;
            }
          }
          
          set({ isLoading: false });
        } catch (error) {
          console.error('Erreur lors de la vérification de l\'authentification:', error);
          set({ isLoading: false });
        }
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);