import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, School, Lock, User, Globe, Save } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

const ENT_OPTIONS = [
  { value: 'ile-de-france', label: 'Île-de-France (Monlycée.net)' },
  { value: 'occitanie', label: 'Occitanie (ENT Occitanie)' },
  { value: 'nouvelle-aquitaine', label: 'Nouvelle-Aquitaine (ENT Néo)' },
  { value: 'auvergne-rhone-alpes', label: 'Auvergne-Rhône-Alpes (ENT AuRA)' },
  { value: 'grand-est', label: 'Grand Est (ENT Éclat-BFC)' },
  { value: 'normandie', label: 'Normandie (ENT L\'Éduc de Normandie)' },
  { value: 'bretagne', label: 'Bretagne (ENT Toutatice)' },
  { value: 'pays-de-la-loire', label: 'Pays de la Loire (ENT e-lyco)' },
  { value: 'hauts-de-france', label: 'Hauts-de-France (ENT HDF)' },
  { value: 'provence-alpes-cote-dazur', label: 'Provence-Alpes-Côte d\'Azur (ENT Atrium)' },
  { value: 'corsica', label: 'Corse (ENT Corse)' },
];

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [ent, setEnt] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [useENT, setUseENT] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Exemples d'URL Pronote
  const exampleUrls = [
    'https://demo.index-education.net/pronote/',
    'https://monlycee.net/pronote/',
    'https://ENT-mondepartement.fr/pronote/'
  ];

  useEffect(() => {
    clearError();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim() || !username.trim() || !password.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await login({
        url: url.trim(),
        username: username.trim(),
        password: password.trim(),
        ent: useENT ? ent : undefined,
        rememberMe
      });
      
      toast.success('Connexion réussie !');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Erreur de connexion');
    }
  };

  const handleExampleClick = (exampleUrl: string) => {
    setUrl(exampleUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-gray-900"
      >
        {/* Left side - Branding */}
        <div className="md:w-2/5 bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900 p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-white/20 rounded-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">ProNote+</h1>
                <p className="text-blue-100">Votre assistant scolaire intelligent</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <School className="w-5 h-5 text-blue-200 mt-1" />
                <div>
                  <h3 className="font-semibold text-white">Accès Pronote complet</h3>
                  <p className="text-blue-100 text-sm">Connectez-vous à votre compte Pronote existant</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-blue-200 mt-1" />
                <div>
                  <h3 className="font-semibold text-white">Sécurité maximale</h3>
                  <p className="text-blue-100 text-sm">Vos données sont chiffrées localement</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Save className="w-5 h-5 text-blue-200 mt-1" />
                <div>
                  <h3 className="font-semibold text-white">Mode hors ligne</h3>
                  <p className="text-blue-100 text-sm">Accédez à vos données même sans connexion</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <p className="text-blue-100 text-sm">
              ProNote+ est une application open-source qui améliore votre expérience Pronote
            </p>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="md:w-3/5 p-8 md:p-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Connexion à Pronote
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Entrez vos identifiants Pronote pour commencer
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ENT Toggle */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useENT}
                  onChange={(e) => setUseENT(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Se connecter via ENT
                </span>
              </label>
              
              {useENT && (
                <select
                  value={ent}
                  onChange={(e) => setEnt(e.target.value)}
                  className="w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Sélectionnez votre ENT</option>
                  {ENT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  URL Pronote de votre établissement
                </div>
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://votre-etablissement.fr/pronote/"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
              
              <div className="mt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Exemples :</p>
                <div className="flex flex-wrap gap-2">
                  {exampleUrls.map((exampleUrl, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleExampleClick(exampleUrl)}
                      className="text-xs px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
                    >
                      {exampleUrl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Username Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Identifiant
                </div>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Votre identifiant Pronote"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Mot de passe
                </div>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe Pronote"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  {showPassword ? 'Masquer' : 'Afficher'}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Se souvenir de moi
                </span>
              </label>
              
              <button
                type="button"
                onClick={() => {
                  // Remplir avec des données de démonstration
                  setUrl('https://demo.index-education.net/pronote/');
                  setUsername('demonstration');
                  setPassword('pronote');
                  toast.info('Données de démonstration chargées');
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Mode démonstration
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  Connexion en cours...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Se connecter à Pronote
                </>
              )}
            </button>

            {/* Security Notice */}
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Vos identifiants sont chiffrés et stockés localement sur votre ordinateur.
                <br />
                ProNote+ ne transmet jamais vos données à des serveurs tiers.
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;