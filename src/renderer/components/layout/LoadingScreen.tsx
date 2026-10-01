import React from 'react';
import { BookOpen } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        {/* Logo animé */}
        <div className="relative mb-8">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center animate-pulse">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          
          {/* Cercles animés */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 border-4 border-blue-300/30 rounded-2xl animate-ping"></div>
            <div className="absolute inset-0 border-4 border-blue-400/20 rounded-2xl animate-pulse delay-75"></div>
          </div>
        </div>
        
        {/* Titre */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          ProNote+
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Chargement de votre espace scolaire...
        </p>
        
        {/* Barre de progression */}
        <div className="w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 animate-progress"></div>
        </div>
        
        {/* Message */}
        <div className="mt-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="spinner"></div>
            <span className="text-sm text-blue-600 dark:text-blue-400">
              Connexion à Pronote en cours...
            </span>
          </div>
        </div>
      </div>
      
      {/* Tips aléatoires */}
      <div className="absolute bottom-8 left-0 right-0 px-4">
        <div className="max-w-lg mx-auto p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            💡 <span className="font-medium">Astuce :</span> Utilisez le simulateur de notes pour prédire votre moyenne
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;