import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  BarChart3, 
  Calculator, 
  Calendar, 
  BookOpen, 
  MessageSquare,
  Target,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  Moon,
  Sun
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import toast from 'react-hot-toast';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const navigationItems = [
    { path: '/', icon: Home, label: 'Tableau de bord' },
    { path: '/grades', icon: BarChart3, label: 'Mes Notes' },
    { path: '/grades/simulator', icon: Calculator, label: 'Simulateur' },
    { path: '/homework', icon: BookOpen, label: 'Devoirs' },
    { path: '/timetable', icon: Calendar, label: 'Emploi du temps' },
    { path: '/school-life', icon: MessageSquare, label: 'Vie scolaire' },
    { path: '/ai-assistant', icon: MessageSquare, label: 'Assistant IA' },
    { path: '/goals', icon: Target, label: 'Objectifs' },
    { path: '/settings', icon: Settings, label: 'Paramètres' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Déconnexion réussie');
      navigate('/login');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const getCurrentPageTitle = () => {
    const currentItem = navigationItems.find(item => item.path === location.pathname);
    return currentItem?.label || 'Tableau de bord';
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed md:relative z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">ProNote+</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Scolarité intelligente</p>
            </div>
          </div>
        </div>

        {/* User profile */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {user?.name || 'Élève'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {user?.class || 'Classe'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <button
                    onClick={() => {
                      navigate(item.path);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-5 h-5" />
                <span>Mode clair</span>
              </>
            ) : (
              <>
                <Moon className="w-5 h-5" />
                <span>Mode sombre</span>
              </>
            )}
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg md:hidden"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {getCurrentPageTitle()}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.establishment || 'Établissement'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme toggle for desktop */}
            <button
              onClick={toggleTheme}
              className="hidden md:flex p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {notificationsOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setNotificationsOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        Aucune notification pour le moment
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User menu */}
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.name || 'Élève'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Connecté
                </p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                {user?.name?.charAt(0) || 'E'}
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </main>

        {/* Status bar */}
        <footer className="h-8 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">Connecté à Pronote</span>
            </div>
            <span className="text-gray-500 dark:text-gray-500">•</span>
            <span className="text-gray-600 dark:text-gray-400">
              Données synchronisées il y a 5 min
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            ProNote+ v1.0.0
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;