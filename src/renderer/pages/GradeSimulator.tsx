import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  BarChart3,
  Eye
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

interface SimulatedGrade {
  id: number;
  subject: string;
  grade: number;
  scale: number;
  coefficient: number;
}

const GradeSimulator = () => {
  const [currentGrades, setCurrentGrades] = useState([
    { id: 1, subject: 'Maths', grade: 16, scale: 20, coefficient: 2 },
    { id: 2, subject: 'Français', grade: 14, scale: 20, coefficient: 2 },
    { id: 3, subject: 'Histoire', grade: 18, scale: 20, coefficient: 1.5 },
    { id: 4, subject: 'SVT', grade: 12, scale: 20, coefficient: 1.5 },
    { id: 5, subject: 'Anglais', grade: 15, scale: 20, coefficient: 1 },
    { id: 6, subject: 'Physique', grade: 13, scale: 20, coefficient: 1.5 },
  ]);

  const [simulatedGrades, setSimulatedGrades] = useState<SimulatedGrade[]>([]);
  const [newGrade, setNewGrade] = useState({
    subject: 'Maths',
    grade: 15,
    scale: 20,
    coefficient: 2
  });
  const [targetAverage, setTargetAverage] = useState(15);
  const [scenarios, setScenarios] = useState<any[]>([]);

  const subjects = ['Maths', 'Français', 'Histoire', 'SVT', 'Anglais', 'Physique'];

  // Calculer la moyenne actuelle
  const calculateAverage = (grades: any[]) => {
    if (grades.length === 0) return 0;
    const weightedSum = grades.reduce((sum, grade) => sum + (grade.grade * grade.coefficient), 0);
    const totalCoefficient = grades.reduce((sum, grade) => sum + grade.coefficient, 0);
    return weightedSum / totalCoefficient;
  };

  const currentAverage = calculateAverage(currentGrades);
  const simulatedAverage = calculateAverage([...currentGrades, ...simulatedGrades]);

  // Calculer la note nécessaire pour atteindre la moyenne cible
  const calculateRequiredGrade = () => {
    const currentWeightedSum = currentGrades.reduce((sum, grade) => sum + (grade.grade * grade.coefficient), 0);
    const currentTotalCoefficient = currentGrades.reduce((sum, grade) => sum + grade.coefficient, 0);
    
    const targetWeightedSum = targetAverage * (currentTotalCoefficient + 1); // +1 pour le coefficient de la nouvelle note
    const requiredGrade = (targetWeightedSum - currentWeightedSum) / 1; // Coefficient de la nouvelle note = 1
    
    return Math.max(0, Math.min(20, requiredGrade));
  };

  const requiredGrade = calculateRequiredGrade();

  const handleAddSimulatedGrade = () => {
    const newId = simulatedGrades.length > 0 
      ? Math.max(...simulatedGrades.map(g => g.id)) + 1 
      : currentGrades.length + 1;
    
    setSimulatedGrades([
      ...simulatedGrades,
      { ...newGrade, id: newId }
    ]);
    
    toast.success('Note simulée ajoutée');
  };

  const handleRemoveSimulatedGrade = (id: number) => {
    setSimulatedGrades(simulatedGrades.filter(grade => grade.id !== id));
  };

  const handleSaveScenario = () => {
    const scenario = {
      id: scenarios.length + 1,
      name: `Scénario ${scenarios.length + 1}`,
      simulatedGrades: [...simulatedGrades],
      average: simulatedAverage,
      date: new Date().toISOString()
    };
    
    setScenarios([...scenarios, scenario]);
    toast.success('Scénario sauvegardé');
  };

  const handleResetSimulations = () => {
    setSimulatedGrades([]);
    toast.info('Simulations réinitialisées');
  };

  const handleApplyToTarget = () => {
    setNewGrade({
      ...newGrade,
      grade: requiredGrade
    });
    toast.info(`Note cible appliquée: ${requiredGrade.toFixed(2)}/20`);
  };

  // Données pour le graphique d'évolution
  const evolutionData = [
    { scenario: 'Actuel', moyenne: currentAverage },
    { scenario: 'Simulé', moyenne: simulatedAverage },
    { scenario: 'Cible', moyenne: targetAverage },
  ];

  // Données pour le graphique par matière
  const subjectData = subjects.map(subject => {
    const current = currentGrades.find(g => g.subject === subject);
    const simulated = simulatedGrades.find(g => g.subject === subject);
    
    return {
      subject,
      actuelle: current ? current.grade : 0,
      simulée: simulated ? simulated.grade : 0,
      cible: targetAverage
    };
  });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Calculator className="w-6 h-6" />
          Simulateur de Notes
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Simulez l'impact de nouvelles notes sur votre moyenne
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche - Statistiques */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Moyennes
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Moyenne actuelle</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {currentAverage.toFixed(2)}/20
                </p>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Moyenne simulée</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {simulatedAverage.toFixed(2)}/20
                </p>
                <div className="mt-2 flex items-center gap-1">
                  {simulatedAverage > currentAverage ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm text-green-600 dark:text-green-400">
                        +{(simulatedAverage - currentAverage).toFixed(2)} points
                      </span>
                    </>
                  ) : simulatedAverage < currentAverage ? (
                    <>
                      <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span className="text-sm text-red-600 dark:text-red-400">
                        -{(currentAverage - simulatedAverage).toFixed(2)} points
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-600 dark:text-gray-400">Pas de changement</span>
                  )}
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Moyenne cible</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.1"
                    value={targetAverage}
                    onChange={(e) => setTargetAverage(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <span className="text-gray-900 dark:text-white">/20</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Calculateur cible
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Note nécessaire</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {requiredGrade.toFixed(2)}/20
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Pour atteindre {targetAverage}/20
                </p>
              </div>
              
              <button
                onClick={handleApplyToTarget}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition flex items-center justify-center gap-2"
              >
                <Target className="w-4 h-4" />
                Appliquer cette note cible
              </button>
            </div>
          </motion.div>
        </div>

        {/* Colonne centrale - Ajout de notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Ajouter une note simulée
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Matière
                </label>
                <select
                  value={newGrade.subject}
                  onChange={(e) => setNewGrade({ ...newGrade, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Note
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max={newGrade.scale}
                    step="0.1"
                    value={newGrade.grade}
                    onChange={(e) => setNewGrade({ ...newGrade, grade: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <span className="text-gray-900 dark:text-white">/{newGrade.scale}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Barème
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newGrade.scale}
                  onChange={(e) => setNewGrade({ ...newGrade, scale: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Coefficient
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={newGrade.coefficient}
                  onChange={(e) => setNewGrade({ ...newGrade, coefficient: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleAddSimulatedGrade}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter la note simulée
              </button>
              
              <button
                onClick={handleResetSimulations}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Réinitialiser
              </button>
            </div>
          </div>

          {/* Notes simulées */}
          {simulatedGrades.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notes simulées ({simulatedGrades.length})
                </h3>
                <button
                  onClick={handleSaveScenario}
                  className="px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Sauvegarder le scénario
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Matière
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Note
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Coefficient
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Impact
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {simulatedGrades.map((grade) => (
                      <tr key={grade.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {grade.subject}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-900 dark:text-white">
                            {grade.grade.toFixed(1)}/{grade.scale}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-900 dark:text-white">
                            {grade.coefficient}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {grade.grade > 10 ? (
                              <>
                                <TrendingUp className="w-4 h-4 text-green-500" />
                                <span className="text-green-600 dark:text-green-400">
                                  Positif
                                </span>
                              </>
                            ) : (
                              <>
                                <TrendingDown className="w-4 h-4 text-red-500" />
                                <span className="text-red-600 dark:text-red-400">
                                  Négatif
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleRemoveSimulatedGrade(grade.id)}
                            className="p-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Évolution de la moyenne
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="scenario" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))'
                  }}
                  formatter={(value) => [`${value}/20`, 'Moyenne']}
                />
                <Bar 
                  dataKey="moyenne" 
                  fill="#3b82f6" 
                  name="Moyenne"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Comparaison par matière
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={subjectData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="subject" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="actuelle" stroke="#3b82f6" strokeWidth={2} name="Actuelle" />
                <Line type="monotone" dataKey="simulée" stroke="#10b981" strokeWidth={2} name="Simulée" />
                <Line type="monotone" dataKey="cible" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name="Cible" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Scénarios sauvegardés */}
      {scenarios.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Scénarios sauvegardés
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {scenario.name}
                  </h4>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    scenario.average >= currentAverage
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                  }`}>
                    {scenario.average.toFixed(2)}/20
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Notes simulées</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {scenario.simulatedGrades.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Impact</span>
                    <span className={`font-medium ${
                      scenario.average >= currentAverage
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {scenario.average >= currentAverage ? '+' : ''}
                      {(scenario.average - currentAverage).toFixed(2)} points
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSimulatedGrades(scenario.simulatedGrades);
                      toast.success('Scénario chargé');
                    }}
                    className="flex-1 py-2 px-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition flex items-center justify-center gap-1 text-sm"
                  >
                    <Eye className="w-3 h-3" />
                    Charger
                  </button>
                  <button
                    onClick={() => {
                      setScenarios(scenarios.filter(s => s.id !== scenario.id));
                      toast.success('Scénario supprimé');
                    }}
                    className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default GradeSimulator;