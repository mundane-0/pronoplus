import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Filter, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Search,
  Calendar,
  BookOpen,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Area, AreaChart
} from 'recharts';
import toast from 'react-hot-toast';

// Données d'exemple
const sampleGrades = [
  { id: 1, subject: 'Maths', title: 'Devoir maison chapitre 3', grade: 16, scale: 20, coefficient: 2, classAverage: 12.5, min: 8, max: 19, date: '2026-09-25', period: 'T1', teacher: 'M. Dupont' },
  { id: 2, subject: 'Français', title: 'Commentaire de texte', grade: 14, scale: 20, coefficient: 2, classAverage: 13.2, min: 10, max: 18, date: '2026-09-28', period: 'T1', teacher: 'Mme. Martin' },
  { id: 3, subject: 'Histoire', title: 'Dissertation', grade: 18, scale: 20, coefficient: 1.5, classAverage: 14.5, min: 9, max: 20, date: '2026-09-30', period: 'T1', teacher: 'M. Leroy' },
  { id: 4, subject: 'SVT', title: 'Contrôle chapitre 2', grade: 12, scale: 20, coefficient: 1.5, classAverage: 11.8, min: 7, max: 17, date: '2026-10-01', period: 'T1', teacher: 'Mme. Bernard' },
  { id: 5, subject: 'Anglais', title: 'Oral', grade: 15, scale: 20, coefficient: 1, classAverage: 14.2, min: 10, max: 19, date: '2026-09-27', period: 'T1', teacher: 'M. Wilson' },
  { id: 6, subject: 'Physique', title: 'TP', grade: 13, scale: 20, coefficient: 1.5, classAverage: 11.5, min: 6, max: 16, date: '2026-09-29', period: 'T1', teacher: 'M. Garcia' },
];

const subjectOptions = ['Toutes', 'Maths', 'Français', 'Histoire', 'SVT', 'Anglais', 'Physique'];
const periodOptions = ['Tous', 'T1', 'T2', 'T3'];

const Grades = () => {
  const [grades, setGrades] = useState(sampleGrades);
  const [filteredGrades, setFilteredGrades] = useState(sampleGrades);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Toutes');
  const [selectedPeriod, setSelectedPeriod] = useState('Tous');
  const [stats, setStats] = useState({
    average: 0,
    median: 0,
    stdDev: 0,
    bestSubject: '',
    worstSubject: '',
    totalCoefficient: 0
  });
  const [viewMode, setViewMode] = useState('table'); // 'table', 'charts', 'stats'

  // Données pour les graphiques
  const gradeEvolutionData = [
    { week: 'Sem 1', maths: 14.5, français: 13.8, histoire: 15.2, moyenne: 14.5 },
    { week: 'Sem 2', maths: 15.0, français: 14.2, histoire: 16.0, moyenne: 15.1 },
    { week: 'Sem 3', maths: 16.0, français: 14.0, histoire: 18.0, moyenne: 16.0 },
    { week: 'Sem 4', maths: 15.5, français: 14.5, histoire: 17.5, moyenne: 15.8 },
    { week: 'Sem 5', maths: 16.5, français: 15.0, histoire: 18.0, moyenne: 16.5 },
  ];

  const subjectComparisonData = [
    { subject: 'Maths', votreMoyenne: 15.5, moyenneClasse: 12.8 },
    { subject: 'Français', votreMoyenne: 14.2, moyenneClasse: 13.5 },
    { subject: 'Histoire', votreMoyenne: 16.0, moyenneClasse: 14.2 },
    { subject: 'SVT', votreMoyenne: 13.8, moyenneClasse: 12.0 },
    { subject: 'Anglais', votreMoyenne: 15.0, moyenneClasse: 14.5 },
    { subject: 'Physique', votreMoyenne: 12.5, moyenneClasse: 11.8 },
  ];

  const radarData = [
    { subject: 'Maths', value: 15.5, fullMark: 20 },
    { subject: 'Français', value: 14.2, fullMark: 20 },
    { subject: 'Histoire', value: 16.0, fullMark: 20 },
    { subject: 'SVT', value: 13.8, fullMark: 20 },
    { subject: 'Anglais', value: 15.0, fullMark: 20 },
    { subject: 'Physique', value: 12.5, fullMark: 20 },
  ];

  const coefficientData = [
    { name: 'Maths', value: 6, color: '#3b82f6' },
    { name: 'Français', value: 5, color: '#10b981' },
    { name: 'Histoire', value: 4, color: '#f59e0b' },
    { name: 'SVT', value: 3, color: '#ef4444' },
    { name: 'Anglais', value: 3, color: '#8b5cf6' },
    { name: 'Physique', value: 3, color: '#ec4899' },
  ];

  useEffect(() => {
    // Calculer les statistiques
    const gradesArray = filteredGrades.map(g => g.grade);
    const coefficients = filteredGrades.map(g => g.coefficient);
    
    if (gradesArray.length > 0) {
      // Moyenne pondérée
      const weightedSum = filteredGrades.reduce((sum, grade) => sum + (grade.grade * grade.coefficient), 0);
      const totalCoefficient = coefficients.reduce((sum, coeff) => sum + coeff, 0);
      const average = weightedSum / totalCoefficient;
      
      // Médiane
      const sortedGrades = [...gradesArray].sort((a, b) => a - b);
      const median = sortedGrades.length % 2 === 0
        ? (sortedGrades[sortedGrades.length/2 - 1] + sortedGrades[sortedGrades.length/2]) / 2
        : sortedGrades[Math.floor(sortedGrades.length/2)];
      
      // Écart-type
      const variance = gradesArray.reduce((sum, grade) => sum + Math.pow(grade - average, 2), 0) / gradesArray.length;
      const stdDev = Math.sqrt(variance);
      
      // Meilleure et pire matière (par moyenne)
      const subjects = [...new Set(filteredGrades.map(g => g.subject))];
      const subjectAverages = subjects.map(subject => {
        const subjectGrades = filteredGrades.filter(g => g.subject === subject);
        const subjectAverage = subjectGrades.reduce((sum, g) => sum + g.grade, 0) / subjectGrades.length;
        return { subject, average: subjectAverage };
      });
      
      subjectAverages.sort((a, b) => b.average - a.average);
      const bestSubject = subjectAverages[0]?.subject || '';
      const worstSubject = subjectAverages[subjectAverages.length - 1]?.subject || '';
      
      setStats({
        average,
        median,
        stdDev,
        bestSubject,
        worstSubject,
        totalCoefficient
      });
    }
  }, [filteredGrades]);

  useEffect(() => {
    // Appliquer les filtres
    let result = [...grades];
    
    if (searchTerm) {
      result = result.filter(grade =>
        grade.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grade.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grade.teacher.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedSubject !== 'Toutes') {
      result = result.filter(grade => grade.subject === selectedSubject);
    }
    
    if (selectedPeriod !== 'Tous') {
      result = result.filter(grade => grade.period === selectedPeriod);
    }
    
    setFilteredGrades(result);
  }, [searchTerm, selectedSubject, selectedPeriod, grades]);

  const getGradeColor = (grade: number, classAverage: number) => {
    const ratio = grade / classAverage;
    if (ratio > 1.2) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
    if (ratio > 1.0) return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300';
    if (ratio >= 0.8) return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300';
    return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300';
  };

  const handleExportCSV = async () => {
    try {
      const csv = await window.mainAPI.exportGradesCSV();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notes-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      toast.success('Notes exportées en CSV');
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChartIcon className="w-6 h-6" />
            Mes Notes
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Analyse détaillée et visualisation de vos notes
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Filtres */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher une note, matière ou professeur..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              {subjectOptions.map(subject => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
            
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              {periodOptions.map(period => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Statistiques rapides */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Moyenne générale</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.average.toFixed(2)}/20
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Médiane</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.median.toFixed(2)}/20
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Écart-type</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.stdDev.toFixed(2)}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Meilleure matière</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white truncate">
              {stats.bestSubject}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Onglets de vue */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setViewMode('table')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            viewMode === 'table'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Tableau
        </button>
        <button
          onClick={() => setViewMode('charts')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            viewMode === 'charts'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Graphiques
        </button>
        <button
          onClick={() => setViewMode('stats')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            viewMode === 'stats'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Statistiques
        </button>
      </div>

      {/* Contenu selon le mode */}
      {viewMode === 'table' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Matière
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Intitulé
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Note
                  </th>
                  <th className="px6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Coeff.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Moy. classe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Professeur
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredGrades.map((grade) => (
                  <tr key={grade.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {grade.subject}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 dark:text-white">{grade.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-sm font-medium ${getGradeColor(grade.grade, grade.classAverage)}`}>
                          {grade.grade}/{grade.scale}
                        </span>
                        <div className={`w-4 h-4 ${grade.grade > grade.classAverage ? 'text-green-500' : grade.grade < grade.classAverage ? 'text-red-500' : 'text-yellow-500'}`}>
                          {grade.grade > grade.classAverage ? (
                            <TrendingUp className="w-full h-full" />
                          ) : grade.grade < grade.classAverage ? (
                            <TrendingDown className="w-full h-full" />
                          ) : (
                            <Minus className="w-full h-full" />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-900 dark:text-white">{grade.coefficient}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-600 dark:text-gray-400">
                        {grade.classAverage.toFixed(1)} ({grade.min}-{grade.max})
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {new Date(grade.date).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                      {grade.teacher}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredGrades.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Aucune note trouvée avec les filtres actuels
              </p>
            </div>
          )}
        </motion.div>
      )}

      {viewMode === 'charts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <LineChartIcon className="w-5 h-5" />
                Évolution des notes
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={gradeEvolutionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="week" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        color: 'hsl(var(--foreground))'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="maths" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="français" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="histoire" stroke="#f59e0b" strokeWidth={2} />
                    <Line type="monotone" dataKey="moyenne" stroke="#8b5cf6" strokeWidth={3} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChartIcon className="w-5 h-5" />
                Comparaison par matière
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectComparisonData}>
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
                    <Bar dataKey="votreMoyenne" fill="#3b82f6" name="Votre moyenne" />
                    <Bar dataKey="moyenneClasse" fill="#10b981" name="Moyenne classe" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5" />
                Profil radar
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis />
                    <Radar name="Notes" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Répartition des coefficients
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={coefficientData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {coefficientData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        color: 'hsl(var(--foreground))'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {viewMode === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white"
            >
              <h3 className="text-lg font-semibold mb-4">Tendance générale</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Progression cette semaine</span>
                  <span className="font-bold text-green-300">+0.8 points</span>
                </div>
                <div className="flex justify-between">
                  <span>Tendance</span>
                  <span className="font-bold">En hausse 📈</span>
                </div>
                <div className="flex justify-between">
                  <span>Rang dans la classe</span>
                  <span className="font-bold">5/30</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white"
            >
              <h3 className="text-lg font-semibold mb-4">Points forts</h3>
              <div className="space-y-2">
                {['Histoire (16.0)', 'Maths (15.5)', 'Anglais (15.0)'].map((strength, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                    <span>{strength}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-green-400/30">
                <p className="text-sm opacity-90">
                  Votre plus grande force : Analyse historique
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 text-white"
            >
              <h3 className="text-lg font-semibold mb-4">Points à améliorer</h3>
              <div className="space-y-2">
                {['Physique (12.5)', 'SVT (13.8)', 'Français (14.2)'].map((weakness, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-300 rounded-full"></div>
                    <span>{weakness}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-amber-400/30">
                <p className="text-sm opacity-90">
                  Conseil : Travaillez les TP de physique
                </p>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Projections
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Moyenne actuelle</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.average.toFixed(2)}/20
                </p>
              </div>
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Projection fin T1</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {(stats.average * 1.05).toFixed(2)}/20
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  +5% possible
                </p>
              </div>
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Objectif réalisable</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  15.0/20
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  D'ici fin d'année
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Bouton simulateur */}
      <div className="flex justify-center">
        <button
          onClick={() => window.location.hash = '/grades/simulator'}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition flex items-center gap-2"
        >
          <Calculator className="w-4 h-4" />
          Ouvrir le simulateur de notes
        </button>
      </div>
    </div>
  );
};

export default Grades;