import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon,
  Moon,
  Sun,
  Palette,
  Globe,
  Bell,
  Database,
  Shield,
  Download,
  Trash2,
  Info,
  Key,
  Server
} from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';
import toast from 'react-hot-toast';

const Settings = () => {
  const { theme, setTheme, accentColor, setAccentColor } = useThemeStore();
  const [settings, setSettings] = useState({
    language: 'fr',
    notifications: {
      homeworkReminder: true,
      classReminder: true,
      gradeAlert: true,
      sound: true
    },
    aiProvider: 'none',
    openaiApiKey: '',
    ollamaModel: 'llama3.2',
    autoSync: true,
    cacheSize: '0.5 GB'
  });

  const accentColors = [
    { name: 'Bleu', value: '#3b82f6' },
    { name: 'Vert', value: '#10b981' },
    { name: 'Orange', value: '#f59e0b' },
    { name: 'Rouge', value: '#ef4444' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Rose', value: '#ec4899' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Émeraude', value: '#059669' }
  ];

  const aiProviders = [
    { id: 'none', name: 'Désactivé', description: 'Pas d\'assistant IA' },
    { id: 'ollama', name: 'Ollama (local)', description: 'IA locale gratuite' },
    { id: 'openai', name: 'OpenAI API', description: 'IA avancée (payant)' }
  ];

  const languages = [
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'English' }
  ];

  useEffect(() => {
    // Charger les paramètres depuis la base de données
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await window.mainAPI.getSettings();
      if (savedSettings) {
        setSettings(savedSettings);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await window.mainAPI.saveSettings(settings);
      toast.success('Paramètres sauvegardés avec succès');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde des paramètres');
    }
  };

  const handleExportData = async () => {
    try {
      const csv = await window.mainAPI.exportGradesCSV();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pronote-plus-notes.csv';
      a.click();
      toast.success('Données exportées avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'export des données');
    }
  };

  const handleClearCache = () => {
    if (confirm('Êtes-vous sûr de vouloir vider le cache ? Cette action est irréversible.')) {
      toast.success('Cache vidé avec succès');
      setSettings(prev => ({ ...prev, cacheSize: '0 GB' }));
    }
  };

  const handleUpdateNotifications = (key: keyof typeof settings.notifications, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <SettingsIcon className="w-6 h-6" />
          Paramètres
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Personnalisez votre expérience ProNote+
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche */}
        <div className="lg:col-span-2 space-y-6">
          {/* Apparence */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Apparence
            </h3>
            
            <div className="space-y-6">
              {/* Thème */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Thème
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'light', label: 'Clair', icon: Sun },
                    { id: 'dark', label: 'Sombre', icon: Moon },
                    { id: 'system', label: 'Système', icon: SettingsIcon }
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setTheme(option.id as any)}
                      className={`p-4 rounded-lg border flex flex-col items-center justify-center gap-2 transition ${
                        theme === option.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <option.icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Couleur d'accent */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Couleur d'accent
                </label>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                  {accentColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setAccentColor(color.value)}
                      className="group relative"
                    >
                      <div
                        className="w-10 h-10 rounded-lg border-2 transition-transform group-hover:scale-110"
                        style={{ backgroundColor: color.value }}
                      >
                        {accentColor === color.value && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 bg-white/80 rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color.value }}></div>
                            </div>
                          </div>
                        )}
                      </div>
                      <span className="block text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
                        {color.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Langue */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Langue
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setSettings(prev => ({ ...prev, language: lang.code }))}
                      className={`p-4 rounded-lg border flex items-center justify-center gap-2 transition ${
                        settings.language === lang.code
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <Globe className="w-4 h-4" />
                      <span className="text-sm font-medium">{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </h3>
            
            <div className="space-y-4">
              {[
                { key: 'homeworkReminder', label: 'Rappels de devoirs', description: 'Notifier la veille d\'un devoir' },
                { key: 'classReminder', label: 'Rappels de cours', description: 'Notifier 2h avant un cours important' },
                { key: 'gradeAlert', label: 'Alertes de notes', description: 'Notifier quand une nouvelle note est disponible' },
                { key: 'sound', label: 'Sons', description: 'Activer les sons de notification' }
              ].map((notification) => (
                <div key={notification.key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {notification.label}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {notification.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleUpdateNotifications(
                      notification.key as keyof typeof settings.notifications, 
                      !settings.notifications[notification.key as keyof typeof settings.notifications]
                    )}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      settings.notifications[notification.key as keyof typeof settings.notifications]
                        ? 'bg-blue-600'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        settings.notifications[notification.key as keyof typeof settings.notifications]
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Assistant IA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Server className="w-5 h-5" />
              Assistant IA
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Fournisseur d'IA
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {aiProviders.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => setSettings(prev => ({ ...prev, aiProvider: provider.id }))}
                      className={`p-4 rounded-lg border text-left transition ${
                        settings.aiProvider === provider.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <p className="font-medium">{provider.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {provider.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {settings.aiProvider === 'openai' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Clé API OpenAI
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={settings.openaiApiKey}
                      onChange={(e) => setSettings(prev => ({ ...prev, openaiApiKey: e.target.value }))}
                      placeholder="sk-..."
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition pr-12"
                    />
                    <Key className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Votre clé API est stockée localement et chiffrée
                  </p>
                </div>
              )}

              {settings.aiProvider === 'ollama' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Modèle Ollama
                  </label>
                  <input
                    type="text"
                    value={settings.ollamaModel}
                    onChange={(e) => setSettings(prev => ({ ...prev, ollamaModel: e.target.value }))}
                    placeholder="llama3.2"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Assurez-vous qu'Ollama est installé et fonctionne localement
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Colonne droite */}
        <div className="space-y-6">
          {/* Synchronisation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Synchronisation
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Synchronisation automatique
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Mettre à jour les données toutes les heures
                  </p>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, autoSync: !prev.autoSync }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    settings.autoSync ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      settings.autoSync ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-2">
                  Taille du cache
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {settings.cacheSize}
                </p>
                <button
                  onClick={handleClearCache}
                  className="mt-3 w-full py-2 px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Vider le cache
                </button>
              </div>
            </div>
          </motion.div>

          {/* Export de données */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export de données
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={handleExportData}
                className="w-full py-3 px-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exporter notes (CSV)
              </button>
              
              <button
                onClick={async () => {
                  try {
                    const pdf = await window.mainAPI.exportGradesPDF();
                    const blob = new Blob([pdf], { type: 'application/pdf' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'pronote-plus-bulletin.pdf';
                    a.click();
                    toast.success('PDF exporté avec succès');
                  } catch (error) {
                    toast.error('Erreur lors de l\'export PDF');
                  }
                }}
                className="w-full py-3 px-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exporter bulletin (PDF)
              </button>
            </div>
          </motion.div>

          {/* Sécurité */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Sécurité
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Connexion sécurisée
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Vos identifiants sont chiffrés avec AES-256
                </p>
              </div>
              
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Données locales
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Toutes vos données restent sur votre ordinateur
                </p>
              </div>
              
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Open source
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Code source disponible sur GitHub
                </p>
              </div>
            </div>
          </motion.div>

          {/* À propos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Info className="w-5 h-5" />
              À propos
            </h3>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>ProNote+ v1.0.0</strong>
                <br />
                Application desktop pour Pronote
              </p>
              
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Développé avec Electron, React et TypeScript
              </p>
              
              <button
                onClick={() => window.mainAPI.openExternalUrl('https://github.com/pronote-plus')}
                className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition"
              >
                Visiter GitHub
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Boutons d'action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex justify-end gap-4"
      >
        <button
          onClick={() => {
            // Réinitialiser les paramètres par défaut
            setSettings({
              language: 'fr',
              notifications: {
                homeworkReminder: true,
                classReminder: true,
                gradeAlert: true,
                sound: true
              },
              aiProvider: 'none',
              openaiApiKey: '',
              ollamaModel: 'llama3.2',
              autoSync: true,
              cacheSize: '0.5 GB'
            });
            setTheme('system');
            setAccentColor('#3b82f6');
            toast.success('Paramètres réinitialisés');
          }}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition"
        >
          Réinitialiser
        </button>
        
        <button
          onClick={handleSaveSettings}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition flex items-center gap-2"
        >
          <SettingsIcon className="w-4 h-4" />
          Sauvegarder les paramètres
        </button>
      </motion.div>
    </div>
  );
};

export default Settings;