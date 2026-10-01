import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Calendar, 
  Award, 
  Target,
  BarChart3,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Clock as ClockIcon
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [grades, setGrades] = useState<any[]>([]);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [stats, setStats] = useState({
    overallAverage: 0,
    weeklyTrend: 0,
    assignmentsCount: 0,
    completedAssignments: 0,
    upcomingClasses: 0,
    streak: 0
  });
  const [loading, setLoading] = useState(true);

  // Données d'exemple pour les graphiques
  const gradeEvolutionData = [
    { date: 'Sem 1', moyenne: 12.5 },
    { date: 'Sem 2', moyenne: 13.2 },
    { date: 'Sem 3', moyenne: 14.0 },
    { date: 'Sem 4', moyenne: 13.8 },
    { date: 'Sem 5', moyenne: 14.5 },
    { date: 'Sem 6', moyenne: 15.0 },
  ];

  const subjectComparisonData = [
    { subject: 'Maths', votreMoyenne: 15.5, moyenneClasse: 12.8 },
    { subject: 'Français', votreMoyenne: 14.2, moyenneClasse: 13.5 },
    { subject: 'Histoire', votreMoyenne: 16.0, moyenneClasse: 14.2 },
    { subject: 'SVT', votreMoyenne: 13.8, moyenneClasse: 12.0 },
    { subject: 'Anglais', votreMoyenne: 15.0, moyenneClasse: 14.5 },
    { subject: 'Physique', votreMoyenne: 12.5, moyenneClasse: 11.8 },
  ];

  const coefficientData = [
    { name: 'Maths', value: 6, color: '#3b82f6' },
    { name: 'Français', value: 5, color: '#10b981' },
    { name: 'Histoire', value: 4, color: '#f59e0b' },
    { name: 'SVT', value: 3, color: '#ef4444' },
    { name: 'Anglais', value: 3, color: '#8b5cf6' },
    { name: 'Physique', value: 3, color: '#ec4899' },
  ];

  const upcomingHomeworks = [
    { id: 1, subject: 'Maths', title: 'Devoir maison chapitre 3', dueDate: 'Demain', priority: 'high' },
    { id: 2, subject: 'Français', title: 'Commentaire de texte', dueDate: 'Dans 2 jours', priority: 'medium' },
    { id: 3, subject: 'Histoire', title: 'Fiche de révision', dueDate: 'Dans 3 jours', priority: 'low' },
  ];

  const todaysClasses = [
    { time: '08:00-10:00', subject: 'Maths', teacher: 'M. Dupont', room: 'B201' },
    { time: '10:00-12:00', subject: 'Français', teacher: 'Mme. Martin', room: 'A102' },
    { time: '14:00-16:00', subject: 'SVT', teacher: 'M. Leroy', room: 'Labo 3' },
  ];

  const achievements = [
    { id: 1, title: 'Première note au-dessus de 18', description: 'Félicitations !', icon: Award, color: 'text-yellow-500' },
    { id: 2, title: '3 devoirs rendus à temps', description: 'Continuez comme ça !', icon: CheckCircle, color: 'text-green-500' },
    { id: 3, title: 'Progression en Maths', description: '+2.5 points cette semaine', icon: TrendingUp, color: 'text-blue-500' },
  ];

  useEffect(() => {
    // Simuler le chargement des données
    setTimeout(() => {
      setStats({
        overallAverage: 14.2,
        weeklyTrend: 0.8,
        assignmentsCount: 12,
        completedAssignments: 8,
        upcomingClasses: 6,
        streak: 7
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Bon retour, Élève !
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Voici un résumé de votre scolarité
        </p>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="w-8 h-8" />
            <div className={`flex items-center gap-1 ${stats.weeklyTrend >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {stats.weeklyTrend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="text-sm">{stats.weeklyTrend >= 0 ? '+' : ''}{stats.weeklyTrend.toFixed(1)}</span>
            </div>
          </div>
          <div>
            <p className="text-sm opacity-90">Moyenne générale</p>
            <p className="text-3xl font-bold">{stats.overallAverage.toFixed(1)}/20</p>
            <p className="text-sm opacity-90 mt-2">+0.3 vs semaine dernière</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <BookOpen className="w-8 h-8" />
            <div className="text-sm">
              {stats.completedAssignments}/{stats.assignmentsCount}
            </div>
          </div>
          <div>
            <p className="text-sm opacity-90">Devoirs terminés</p>
            <p className="text-3xl font-bold">{Math.round((stats.completedAssignments / stats.assignmentsCount) * 100)}%</p>
            <p className="text-sm opacity-90 mt-2">Excellent travail !</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <ClockIcon className="w-8 h-8" />
            <div className="text-sm">
              {stats.streak} jours
            </div>
          </div>
          <div>
            <p className="text-sm opacity-90">Streak actuel</p>
            <p className="text-3xl font-bold">{stats.streak} 🔥</p>
            <p className="text-sm opacity-90 mt-2">Record personnel : 14 jours</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <Target className="w-8 h-8" />
            <div className="text-sm">
              {stats.upcomingClasses} cours
            </div>
          </div>
          <div>
            <p className="text-sm opacity-90">Prochain cours</p>
            <p className="text-3xl font-bold">Maths</p>
            <p className="text-sm opacity-90 mt-2">Aujourd'hui à 14:00</p>
          </div>
        </motion.div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Évolution de la moyenne
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gradeEvolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="moyenne" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
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

      {/* Deuxième rangée */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prochains devoirs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Prochains devoirs
          </h3>
          <div className="space-y-4">
            {upcomingHomeworks.map((homework) => (
              <div
                key={homework.id}
                className={`p-4 rounded-lg border ${
                  homework.priority === 'high'
                    ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                    : homework.priority === 'medium'
                    ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'
                    : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {homework.subject}
                  </span>
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    homework.priority === 'high'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      : homework.priority === 'medium'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  }`}>
                    {homework.dueDate}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {homework.title}
                </p>
                <div className="mt-3 flex justify-end">
                  <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                    Marquer comme fait
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Emploi du temps du jour */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Aujourd'hui
          </h3>
          <div className="space-y-3">
            {todaysClasses.map((classItem, index) => (
              <div
                key={index}
                className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {classItem.subject}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {classItem.time}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>{classItem.teacher}</span>
                  <span>Salle {classItem.room}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Prochain cours : Maths à 14:00
            </p>
          </div>
        </motion.div>

        {/* Répartition des coefficients */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Répartition des coefficients
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={coefficientData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
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
          <div className="mt-4 grid grid-cols-2 gap-2">
            {coefficientData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {item.name} (coef. {item.value})
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Vos récents succès
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-4"
            >
              <div className={`p-3 rounded-lg bg-gray-100 dark:bg-gray-700 ${achievement.color}`}>
                <achievement.icon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {achievement.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {achievement.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;