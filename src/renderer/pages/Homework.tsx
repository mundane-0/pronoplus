import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  Filter, 
  Plus,
  Download,
  Bell,
  AlertCircle,
  BookOpen,
  Calendar as CalendarIcon,
  ChevronRight
} from 'lucide-react';
import { Calendar as BigCalendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import toast from 'react-hot-toast';

// Configuration du calendrier
const localizer = momentLocalizer(moment);
moment.locale('fr');

const Homework = () => {
  const [homeworks, setHomeworks] = useState([
    { 
      id: 1, 
      subject: 'Maths', 
      title: 'Devoir maison chapitre 3', 
      description: 'Exercices 1 à 10 page 45', 
      dueDate: new Date(2026, 9, 2), 
      done: false, 
      priority: 'high',
      attachments: 2
    },
    { 
      id: 2, 
      subject: 'Français', 
      title: 'Commentaire de texte', 
      description: 'Analyse du poème "Demain, dès l\'aube"', 
      dueDate: new Date(2026, 9, 3), 
      done: false, 
      priority: 'medium',
      attachments: 1
    },
    { 
      id: 3, 
      subject: 'Histoire', 
      title: 'Fiche de révision', 
      description: 'Révolution française - dates clés', 
      dueDate: new Date(2026, 9, 4), 
      done: true, 
      priority: 'low',
      attachments: 0
    },
    { 
      id: 4, 
      subject: 'SVT', 
      title: 'TP à rendre', 
      description: 'Compte-rendu de dissection', 
      dueDate: new Date(2026, 9, 5), 
      done: false, 
      priority: 'high',
      attachments: 3
    },
    { 
      id: 5, 
      subject: 'Anglais', 
      title: 'Préparation oral', 
      description: 'Présentation sur Londres', 
      dueDate: new Date(2026, 9, 6), 
      done: false, 
      priority: 'medium',
      attachments: 0
    },
    { 
      id: 6, 
      subject: 'Physique', 
      title: 'Exercices', 
      description: 'Chapitre 2 - Électricité', 
      dueDate: new Date(2026, 9, 7), 
      done: false, 
      priority: 'low',
      attachments: 0
    },
  ]);

  const [filter, setFilter] = useState('all'); // all, pending, done, high, medium, low
  const [view, setView] = useState('list'); // list, calendar, week, month
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newHomework, setNewHomework] = useState({
    subject: '',
    title: '',
    description: '',
    dueDate: new Date(),
    priority: 'medium'
  });

  // Filtrer les devoirs
  const filteredHomeworks = homeworks.filter(homework => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !homework.done;
    if (filter === 'done') return homework.done;
    if (filter === 'high') return homework.priority === 'high';
    if (filter === 'medium') return homework.priority === 'medium';
    if (filter === 'low') return homework.priority === 'low';
    return true;
  });

  // Compter les statistiques
  const stats = {
    total: homeworks.length,
    pending: homeworks.filter(h => !h.done).length,
    done: homeworks.filter(h => h.done).length,
    overdue: homeworks.filter(h => !h.done && new Date(h.dueDate) < new Date()).length,
    highPriority: homeworks.filter(h => h.priority === 'high' && !h.done).length,
  };

  // Événements pour le calendrier
  const calendarEvents = homeworks.map(homework => ({
    id: homework.id,
    title: `${homework.subject}: ${homework.title}`,
    start: homework.dueDate,
    end: new Date(homework.dueDate.getTime() + 60 * 60 * 1000), // +1 heure
    resource: homework,
    className: `priority-${homework.priority} ${homework.done ? 'done' : ''}`
  }));

  const handleToggleDone = (id: number) => {
    setHomeworks(homeworks.map(homework => 
      homework.id === id ? { ...homework, done: !homework.done } : homework
    ));
    
    const homework = homeworks.find(h => h.id === id);
    if (homework && !homework.done) {
      toast.success('Devoir marqué comme terminé !');
    }
  };

  const handleAddHomework = () => {
    if (!newHomework.subject || !newHomework.title) {
      toast.error('Veuillez remplir au moins la matière et le titre');
      return;
    }

    const newId = Math.max(...homeworks.map(h => h.id)) + 1;
    const homework = {
      id: newId,
      subject: newHomework.subject,
      title: newHomework.title,
      description: newHomework.description,
      dueDate: newHomework.dueDate,
      done: false,
      priority: newHomework.priority,
      attachments: 0
    };

    setHomeworks([...homeworks, homework]);
    setNewHomework({
      subject: '',
      title: '',
      description: '',
      dueDate: new Date(),
      priority: 'medium'
    });

    toast.success('Devoir ajouté avec succès !');
  };

  const handleDeleteHomework = (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce devoir ?')) {
      setHomeworks(homeworks.filter(h => h.id !== id));
      toast.success('Devoir supprimé');
    }
  };

  const handleScheduleReminder = (homework: any) => {
    const dueDate = new Date(homework.dueDate);
    const reminderDate = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000); // 24h avant
    
    toast.success(`Rappel programmé pour le ${reminderDate.toLocaleDateString('fr-FR')}`);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      case 'medium': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400';
      case 'low': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Basse';
      default: return 'Non définie';
    }
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `En retard de ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''}`;
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Demain';
    return `Dans ${diffDays} jours`;
  };

  const eventStyleGetter = (event: any) => {
    const homework = event.resource;
    let backgroundColor = '#3b82f6'; // Bleu par défaut
    
    if (homework.priority === 'high') backgroundColor = '#ef4444';
    else if (homework.priority === 'medium') backgroundColor = '#f59e0b';
    else if (homework.priority === 'low') backgroundColor = '#10b981';
    
    if (homework.done) backgroundColor = '#6b7280'; // Gris pour terminé
    
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: homework.done ? 0.7 : 1,
        color: 'white',
        border: 'none',
        padding: '2px 8px'
      }
    };
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            Mes Devoirs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestion et suivi de vos travaux à rendre
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView(view === 'list' ? 'calendar' : 'list')}
            className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition flex items-center gap-2"
          >
            {view === 'list' ? (
              <>
                <Calendar className="w-4 h-4" />
                Vue calendrier
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4" />
                Vue liste
              </>
            )}
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">En attente</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">Terminés</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.done}</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">En retard</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdue}</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">Haute priorité</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.highPriority}</p>
        </motion.div>
      </div>

      {/* Filtres */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtres
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'Tous', count: stats.total },
                { id: 'pending', label: 'En attente', count: stats.pending },
                { id: 'done', label: 'Terminés', count: stats.done },
                { id: 'high', label: 'Haute priorité', count: stats.highPriority },
                { id: 'medium', label: 'Moyenne priorité', count: homeworks.filter(h => h.priority === 'medium' && !h.done).length },
                { id: 'low', label: 'Basse priorité', count: homeworks.filter(h => h.priority === 'low' && !h.done).length }
              ].map(filterOption => (
                <button
                  key={filterOption.id}
                  onClick={() => setFilter(filterOption.id)}
                  className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                    filter === filterOption.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <span>{filterOption.label}</span>
                  <span className={`text-sm px-1.5 py-0.5 rounded-full ${
                    filter === filterOption.id
                      ? 'bg-blue-500/20 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                  }`}>
                    {filterOption.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                // Exporter les devoirs
                toast.success('Export en cours de développement');
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exporter
            </button>
          </div>
        </div>
      </motion.div>

      {/* Vue principale */}
      {view === 'list' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          {filteredHomeworks.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
              <BookOpen className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Aucun devoir trouvé avec les filtres actuels
              </p>
            </div>
          ) : (
            filteredHomeworks.map((homework) => (
              <div
                key={homework.id}
                className={`bg-white dark:bg-gray-800 rounded-xl p-6 border ${
                  homework.done
                    ? 'border-green-200 dark:border-green-800'
                    : new Date(homework.dueDate) < new Date()
                    ? 'border-red-200 dark:border-red-800'
                    : 'border-gray-200 dark:border-gray-700'
                } hover:shadow-sm transition`}
              >
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Checkbox et priorité */}
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => handleToggleDone(homework.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                        homework.done
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
                      }`}
                    >
                      {homework.done && <CheckCircle className="w-4 h-4 text-white" />}
                    </button>
                    
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(homework.priority)}`}>
                      {getPriorityText(homework.priority)}
                    </div>
                  </div>
                  
                  {/* Contenu */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {homework.subject}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                          <h3 className={`text-lg font-semibold ${
                            homework.done
                              ? 'text-gray-500 dark:text-gray-400 line-through'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {homework.title}
                          </h3>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {homework.description}
                        </p>
                      </div>
                      
                      {homework.attachments > 0 && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {homework.attachments} pièce{homework.attachments > 1 ? 's' : ''} jointe{homework.attachments > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                    
                    {/* Métadonnées */}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        <span className={`${
                          new Date(homework.dueDate) < new Date()
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {homework.dueDate.toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className={`${
                          new Date(homework.dueDate) < new Date()
                            ? 'text-red-600 dark:text-red-400 font-medium'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {getDaysUntilDue(homework.dueDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleScheduleReminder(homework)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      title="Programmer un rappel"
                    >
                      <Bell className="w-4 h-4" />
                    </button>
                    
                    {new Date(homework.dueDate) < new Date() && !homework.done && (
                      <div className="p-2 text-red-600 dark:text-red-400" title="En retard">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleDeleteHomework(homework.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      title="Supprimer"
                    >
                      <Plus className="w-4 h-4 rotate-45" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="h-[600px]">
            <BigCalendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              eventPropGetter={eventStyleGetter}
              views={[Views.MONTH, Views.WEEK, Views.DAY]}
              defaultView={Views.MONTH}
              messages={{
                next: 'Suivant',
                previous: 'Précédent',
                today: 'Aujourd\'hui',
                month: 'Mois',
                week: 'Semaine',
                day: 'Jour',
                agenda: 'Agenda',
                date: 'Date',
                time: 'Heure',
                event: 'Événement',
                noEventsInRange: 'Aucun devoir dans cette période'
              }}
              onSelectEvent={(event) => {
                const homework = event.resource;
                toast(`Devoir: ${homework.subject} - ${homework.title}`);
              }}
            />
          </div>
        </motion.div>
      )}

      {/* Ajouter un nouveau devoir */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Ajouter un nouveau devoir
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Matière
            </label>
            <input
              type="text"
              value={newHomework.subject}
              onChange={(e) => setNewHomework({ ...newHomework, subject: e.target.value })}
              placeholder="Maths, Français..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Titre
            </label>
            <input
              type="text"
              value={newHomework.title}
              onChange={(e) => setNewHomework({ ...newHomework, title: e.target.value })}
              placeholder="Devoir maison, TP..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date de rendu
            </label>
            <input
              type="date"
              value={newHomework.dueDate.toISOString().split('T')[0]}
              onChange={(e) => setNewHomework({ ...newHomework, dueDate: new Date(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priorité
            </label>
            <select
              value={newHomework.priority}
              onChange={(e) => setNewHomework({ ...newHomework, priority: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="low">Basse</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
            </select>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description (optionnel)
          </label>
          <textarea
            value={newHomework.description}
            onChange={(e) => setNewHomework({ ...newHomework, description: e.target.value })}
            placeholder="Détails du devoir..."
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          />
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={handleAddHomework}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajouter le devoir
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Homework;