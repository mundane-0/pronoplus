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
  loginDemo: (credentials: LoginCredentials) => Promise<void>;
  loginEnt: (credentials: LoginCredentials) => Promise<void>;
  loginWithQr: (payload: { pinCode: string; jeton: string; login: string; url: string }) => Promise<void>;
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

      loginDemo: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true, error: null });

          const result = await (window as any).mainAPI.loginDemo(credentials);

          if (!result.success) {
            throw new Error(result.error || 'Erreur du mode démonstration');
          }

          const user: User = {
            id: result.user?.id || 'demo-user',
            name: result.user?.name || credentials.username || 'Élève',
            class: result.user?.class?.name || 'Classe inconnue',
            establishment: result.user?.establishment?.name || 'Établissement inconnu',
            avatar: result.user?.avatar
          };

          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
          console.error('Erreur lors de la connexion (démo):', error);
          set({ error: error.message || 'Erreur du mode démonstration', isLoading: false });
          throw error;
        }
      },

      loginEnt: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true, error: null });

          const api: any = (window as any).mainAPI;
          const result = await api.loginEnt(credentials);

          if (!result.success) {
            throw new Error(result.error || "Erreur de connexion via l'ENT");
          }

          set({
            user: {
              id: result.user?.id ?? '',
              name: result.user?.name || credentials.username || 'Élève',
              class: { name: result.user?.class?.name ?? 'Classe inconnue' },
              establishment: { name: result.user?.establishment?.name ?? 'Établissement inconnu' }
            },
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      loginWithQr: async (payload: { pinCode: string; jeton: string; login: string; url: string }) => {
        try {
          set({ isLoading: true, error: null });

          const api: any = (window as any).mainAPI;
          const result = await api.loginQrCode(payload);

          if (!result.success) {
            throw new Error(result.error || 'Erreur de connexion par QR code');
          }

          set({
            user: {
              id: result.user?.id ?? '',
              name: result.user?.name ?? payload.login ?? 'Élève',
              class: { name: result.user?.class?.name ?? 'Classe inconnue' },
              establishment: { name: result.user?.establishment?.name ?? 'Établissement inconnu' }
            },
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        // La session locale est toujours effacée, même si l'IPC échoue,
        // pour ne pas rester connecté silencieusement.
        try {
          set({ isLoading: true });
          await window.mainAPI.logout();
        } catch (error) {
          console.error('Erreur lors de la déconnexion (IPC):', error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
          try {
            localStorage.removeItem('auth-storage');
          } catch {}
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
          
          // Aucun identifiant valide : on repart de l'écran de connexion
          set({ user: null, isAuthenticated: false, isLoading: false });
        } catch (error) {
          console.error('Erreur lors de la vérification de l\'authentification:', error);
          set({ user: null, isAuthenticated: false, isLoading: false });
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