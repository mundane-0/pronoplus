import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Brain, 
  BookOpen,
  Target,
  Zap,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RotateCw,
  Volume2,
  Settings as SettingsIcon
} from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  liked?: boolean;
}

interface Topic {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const AIAssistant = () => {
  const { theme } = useThemeStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Bonjour ! Je suis votre assistant scolaire IA. Je peux vous aider à comprendre vos cours, réviser pour les examens, expliquer des concepts difficiles, ou générer des quiz de révision. Comment puis-je vous aider aujourd\'hui ?',
      role: 'assistant',
      timestamp: new Date(Date.now() - 60000)
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiProvider, setAiProvider] = useState<'ollama' | 'openai' | 'none'>('none');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const topics: Topic[] = [
    { id: 'summarize', title: 'Résumé de cours', description: 'Résumez un cours ou un document', icon: '📝', color: 'bg-blue-500' },
    { id: 'explain', title: 'Explications', description: 'Expliquez un concept difficile', icon: '🧠', color: 'bg-green-500' },
    { id: 'quiz', title: 'Quiz de révision', description: 'Générez un quiz personnalisé', icon: '❓', color: 'bg-amber-500' },
    { id: 'advice', title: 'Conseils d\'étude', description: 'Obtenez des conseils personnalisés', icon: '💡', color: 'bg-purple-500' },
    { id: 'homework', title: 'Aide aux devoirs', description: 'Aidez-moi avec un devoir', icon: '📚', color: 'bg-red-500' },
    { id: 'goals', title: 'Objectifs', description: 'Définir des objectifs d\'apprentissage', icon: '🎯', color: 'bg-pink-500' },
  ];

  const exampleQuestions = [
    "Peux-tu m'expliquer la photosynthèse ?",
    "Résume le chapitre 3 d'histoire sur la Révolution française",
    "Crée un quiz de 5 questions sur les équations du second degré",
    "Donne-moi des conseils pour améliorer ma concentration",
    "Comment calculer l'aire d'un triangle ?"
  ];

  useEffect(() => {
    // Charger les paramètres AI
    const loadSettings = async () => {
      try {
        const settings = await window.mainAPI.getSettings();
        setAiProvider(settings.aiProvider);
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres AI:', error);
      }
    };
    
    loadSettings();
  }, []);

  useEffect(() => {
    // Scroller vers le bas à chaque nouveau message
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Simuler une réponse IA (remplacer par l'appel API réel)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let response = '';
      
      if (selectedTopic === 'summarize') {
        response = "Voici un résumé concis du sujet que vous avez mentionné :\n\n**Concepts clés :**\n1. Première idée principale\n2. Deuxième idée importante\n3. Troisième point essentiel\n\n**Points à retenir :**\n- Point important 1\n- Point important 2\n- Point important 3\n\n**Application pratique :**\nCette connaissance peut être appliquée dans les situations suivantes...";
      } else if (selectedTopic === 'explain') {
        response = "Je vais vous expliquer ce concept étape par étape :\n\n1. **Définition** : D'abord, définissons précisément le terme...\n2. **Contexte** : Ce concept s'inscrit dans le cadre plus large de...\n3. **Exemple concret** : Imaginons que vous avez...\n4. **Application** : Vous pouvez utiliser cette connaissance pour...\n\n**Astuce mnémotechnique :** Pensez à [technique simple pour retenir]";
      } else if (selectedTopic === 'quiz') {
        response = "Voici un quiz de révision personnalisé :\n\n**Question 1 :** Quel est le résultat de 2x + 3 = 11 ?\nA) x = 2\nB) x = 4\nC) x = 8\nD) x = 14\n\n**Question 2 :** Quelle est la formule de l'aire d'un cercle ?\nA) πr²\nB) 2πr\nC) πd\nD) r²\n\n**Question 3 :** Qui a écrit 'Les Misérables' ?\nA) Victor Hugo\nB) Émile Zola\nC) Gustave Flaubert\nD) Albert Camus\n\n**Réponses :** 1B, 2A, 3A";
      } else {
        response = "Je comprends votre question. Voici ce que je peux vous dire :\n\nD'après les informations que vous avez fournies, il semble que vous cherchiez à comprendre comment améliorer votre apprentissage dans ce domaine. Voici quelques suggestions :\n\n1. **Revoir les bases** : Commencez par réviser les concepts fondamentaux\n2. **Pratiquer régulièrement** : La répétition est essentielle\n3. **Poser des questions** : N'hésitez pas à demander des clarifications\n4. **Utiliser différentes ressources** : Livres, vidéos, exercices\n\nSouhaitez-vous que je développe un point spécifique ?";
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setSelectedTopic(null);
    } catch (error) {
      toast.error('Erreur lors de la génération de la réponse');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickTopic = (topicId: string) => {
    setSelectedTopic(topicId);
    const topic = topics.find(t => t.id === topicId);
    if (topic) {
      setInput(`J'aimerais ${topic.description.toLowerCase()}`);
      toast.success(`Mode ${topic.title} activé`);
    }
  };

  const handleLikeMessage = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, liked: !msg.liked } : msg
    ));
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Message copié !');
  };

  const handleSpeakMessage = (content: string) => {
    if ('speechSynthesis' in window) {
      const speech = new SpeechSynthesisUtterance(content);
      speech.lang = 'fr-FR';
      speech.rate = 1.0;
      speech.pitch = 1.0;
      window.speechSynthesis.speak(speech);
    } else {
      toast.error('La synthèse vocale n\'est pas supportée');
    }
  };

  const handleExampleQuestion = (question: string) => {
    setInput(question);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleConfigureAI = () => {
    toast('Configuration IA - Redirection vers les paramètres', {
      icon: '⚙️',
      duration: 3000
    });
    // Dans une vraie implémentation : navigation vers /settings
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bot className="w-6 h-6" />
            Assistant IA
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Votre compagnon d'apprentissage intelligent
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            aiProvider === 'none'
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              : aiProvider === 'ollama'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
          }`}>
            {aiProvider === 'none' ? 'IA désactivée' : aiProvider === 'ollama' ? 'Ollama' : 'OpenAI'}
          </div>
          
          <button
            onClick={handleConfigureAI}
            className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition flex items-center gap-2"
          >
            <SettingsIcon className="w-4 h-4" />
            Configurer
          </button>
        </div>
      </div>

      {aiProvider === 'none' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-8 border border-amber-200 dark:border-amber-800"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <Bot className="w-12 h-12 text-amber-600 dark:text-amber-400" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Assistant IA non configuré
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Pour utiliser l'assistant IA, vous devez configurer un fournisseur d'IA dans les paramètres.
                Vous pouvez choisir entre Ollama (gratuit, local) ou OpenAI API (plus puissant).
              </p>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleConfigureAI}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg transition flex items-center gap-2"
                >
                  <SettingsIcon className="w-4 h-4" />
                  Configurer l'IA
                </button>
                
                <button
                  onClick={() => setAiProvider('ollama')}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition"
                >
                  Utiliser en mode démo
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Thèmes rapides */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Comment puis-je vous aider ?
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => handleQuickTopic(topic.id)}
                  className={`p-4 rounded-lg border ${
                    selectedTopic === topic.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  } transition text-center`}
                >
                  <div className={`w-12 h-12 ${topic.color} rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-3`}>
                    {topic.icon}
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    {topic.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {topic.description}
                  </p>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Exemples de questions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Exemples de questions
            </h3>
            
            <div className="flex flex-wrap gap-3">
              {exampleQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleQuestion(question)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition text-sm"
                >
                  {question}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Chat */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* En-tête du chat */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Assistant IA ProNote+
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Connecté - Prêt à vous aider
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="h-[500px] overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-4 ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-br-none'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {message.role === 'assistant' && (
                            <Bot className="w-4 h-4" />
                          )}
                          <span className="text-xs opacity-80">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                        
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        
                        {/* Actions du message */}
                        {message.role === 'assistant' && (
                          <div className="flex gap-2 mt-3 pt-3 border-t border-white/20">
                            <button
                              onClick={() => handleLikeMessage(message.id)}
                              className={`p-1 rounded ${
                                message.liked
                                  ? 'text-blue-400'
                                  : 'text-white/60 hover:text-white'
                              }`}
                            >
                              <ThumbsUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCopyMessage(message.content)}
                              className="p-1 text-white/60 hover:text-white rounded"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSpeakMessage(message.content)}
                              className="p-1 text-white/60 hover:text-white rounded"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-none p-4">
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4" />
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Posez votre question à l'assistant IA..."
                        rows={2}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                      />
                    </div>
                    
                    <button
                      onClick={handleSendMessage}
                      disabled={isLoading || !input.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <RotateCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  
                  <div className="mt-2 flex justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>Appuyez sur Entrée pour envoyer, Maj+Entrée pour un saut de ligne</span>
                    <span>{input.length}/2000 caractères</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Barre latérale - Fonctionnalités */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Fonctionnalités
                </h3>
                
                <div className="space-y-4">
                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Résumé intelligent
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Résumez vos cours et documents
                        </p>
                      </div>
                    </div>
                    <button className="w-full mt-2 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition">
                      Essayer
                    </button>
                  </div>
                  
                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Quiz personnalisé
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Testez vos connaissances
                        </p>
                      </div>
                    </div>
                    <button className="w-full mt-2 py-2 text-sm bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition">
                      Générer un quiz
                    </button>
                  </div>
                  
                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Planification
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Créez un plan d'étude
                        </p>
                      </div>
                    </div>
                    <button className="w-full mt-2 py-2 text-sm bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded transition">
                      Créer un plan
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-4">
                  Conseils d'utilisation
                </h3>
                
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-white rounded-full mt-1.5"></div>
                    <span>Soyez précis dans vos questions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-white rounded-full mt-1.5"></div>
                    <span>Fournissez le contexte nécessaire</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-white rounded-full mt-1.5"></div>
                    <span>Demandez des explications étape par étape</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-white rounded-full mt-1.5"></div>
                    <span>Utilisez les thèmes prédéfinis pour commencer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-white rounded-full mt-1.5"></div>
                    <span>Évaluez les réponses pour améliorer l'IA</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Statistiques
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Conversations</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">24</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Questions posées</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">156</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Temps économisé</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">18h</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
};

export default AIAssistant;