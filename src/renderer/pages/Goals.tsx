import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Trophy, Target, Plus, Check, Star, TrendingUp, Calendar } from 'lucide-react';

interface Goal {
  id: string;
  subject: string;
  targetGrade: number;
  currentGrade: number;
  deadline: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

const Goals: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      subject: 'Mathématiques',
      targetGrade: 16,
      currentGrade: 14.2,
      deadline: '2024-12-15',
      progress: 65,
      createdAt: '2024-09-15',
      updatedAt: '2024-09-28'
    },
    {
      id: '2',
      subject: 'Physique-Chimie',
      targetGrade: 15,
      currentGrade: 13.8,
      deadline: '2024-12-10',
      progress: 45,
      createdAt: '2024-09-10',
      updatedAt: '2024-09-25'
    },
    {
      id: '3',
      subject: 'Anglais',
      targetGrade: 18,
      currentGrade: 16.5,
      deadline: '2024-11-30',
      progress: 85,
      createdAt: '2024-08-20',
      updatedAt: '2024-09-29'
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    subject: '',
    targetGrade: 15,
    deadline: ''
  });

  const calculateProgress = (current: number, target: number) => {
    const max = 20;
    const min = 0;
    const normalizedCurrent = ((current - min) / (max - min)) * 100;
    const normalizedTarget = ((target - min) / (max - min)) * 100;
    return Math.min(100, (normalizedCurrent / normalizedTarget) * 100);
  };

  const addGoal = () => {
    if (!newGoal.subject || !newGoal.deadline) return;

    const goal: Goal = {
      id: Date.now().toString(),
      subject: newGoal.subject,
      targetGrade: newGoal.targetGrade,
      currentGrade: 10, // Note de départ
      deadline: newGoal.deadline,
      progress: 25, // Progression initiale
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    setGoals([...goals, goal]);
    setNewGoal({ subject: '', targetGrade: 15, deadline: '' });
    setShowForm(false);
  };

  const deleteGoal = (id: string) => {
    setGoals(goals.filter(goal => goal.id !== id));
  };

  const daysUntilDeadline = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const subjects = [
    'Mathématiques', 'Physique-Chimie', 'SVT', 'Français', 'Histoire-Géographie',
    'Anglais', 'Espagnol', 'Philosophie', 'EPS', 'Spécialité NSI'
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Objectifs & Gamification</h1>
        <p className="text-muted-foreground">
          Fixez des objectifs, suivez votre progression et gagnez des badges.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Mes objectifs</CardTitle>
                <CardDescription>Suivez votre progression vers vos objectifs</CardDescription>
              </div>
              <Button onClick={() => setShowForm(!showForm)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvel objectif
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showForm && (
              <div className="mb-6 p-4 border rounded-lg bg-muted/30">
                <h3 className="font-medium mb-4">Nouvel objectif</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="subject">Matière</Label>
                    <Select value={newGoal.subject} onValueChange={(value) => setNewGoal({...newGoal, subject: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une matière" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="targetGrade">Objectif de note (/20)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        id="targetGrade"
                        min="0"
                        max="20"
                        step="0.5"
                        value={newGoal.targetGrade}
                        onChange={(e) => setNewGoal({...newGoal, targetGrade: parseFloat(e.target.value)})}
                      />
                      <span className="text-sm text-muted-foreground">/20</span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="deadline">Date limite</Label>
                    <Input
                      type="date"
                      id="deadline"
                      value={newGoal.deadline}
                      onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={addGoal} className="flex-1">Ajouter</Button>
                    <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {goals.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">Aucun objectif défini</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Créez votre premier objectif pour commencer à suivre votre progression.
                  </p>
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un objectif
                  </Button>
                </div>
              ) : (
                goals.map((goal) => {
                  const daysLeft = daysUntilDeadline(goal.deadline);
                  const progressColor = goal.progress >= 80 ? 'bg-green-600' : 
                                      goal.progress >= 50 ? 'bg-blue-600' : 
                                      'bg-yellow-600';
                  
                  return (
                    <Card key={goal.id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium">{goal.subject}</h3>
                              <Badge variant="outline">
                                {daysLeft} jour{daysLeft > 1 ? 's' : ''}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Objectif: {goal.targetGrade}/20 • Actuel: {goal.currentGrade}/20
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteGoal(goal.id)}
                          >
                            Supprimer
                          </Button>
                        </div>
                        
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progression</span>
                            <span className="font-medium">{Math.round(goal.progress)}%</span>
                          </div>
                          <Progress value={goal.progress} className={`h-2 ${progressColor}`} />
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Target className="h-3 w-3 text-muted-foreground" />
                              <span>{goal.targetGrade}/20</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-muted-foreground" />
                              <span>{goal.currentGrade}/20</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span>J-{daysLeft}</span>
                            </div>
                          </div>
                          {goal.progress >= 100 && (
                            <Badge className="bg-green-100 text-green-800">
                              <Check className="h-3 w-3 mr-1" />
                              Atteint
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Badges obtenus
              </CardTitle>
              <CardDescription>Vos accomplissements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="bg-yellow-100 p-2 rounded-full">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Objectif dépassé</h4>
                    <p className="text-xs text-muted-foreground">Atteint 3 objectifs avant la date limite</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Star className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Consistance parfaite</h4>
                    <p className="text-xs text-muted-foreground">7 jours consécutifs de progression</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="bg-green-100 p-2 rounded-full">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Amélioration continue</h4>
                    <p className="text-xs text-muted-foreground">+2 points en moyenne générale</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
              <CardDescription>Votre performance globale</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="text-2xl font-bold">{goals.length}</div>
                    <div className="text-sm text-muted-foreground">Objectifs actifs</div>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(goals.reduce((acc, goal) => acc + goal.progress, 0) / goals.length || 0)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Progression moyenne</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Objectifs atteints:</span>
                    <span className="font-medium">
                      {goals.filter(g => g.progress >= 100).length}/{goals.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Streak actuel:</span>
                    <span className="font-medium">7 jours</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Meilleure matière:</span>
                    <span className="font-medium">Anglais (85%)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prochains badges</CardTitle>
              <CardDescription>Continuez pour les débloquer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg opacity-50">
                  <div className="bg-gray-100 p-2 rounded-full">
                    <Trophy className="h-4 w-4 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Maître des objectifs</h4>
                    <p className="text-xs text-muted-foreground">Atteindre 10 objectifs</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={30} className="h-1 flex-1" />
                      <span className="text-xs">3/10</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg opacity-50">
                  <div className="bg-gray-100 p-2 rounded-full">
                    <Star className="h-4 w-4 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">30 jours de suite</h4>
                    <p className="text-xs text-muted-foreground">Streak de 30 jours</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={23} className="h-1 flex-1" />
                      <span className="text-xs">7/30</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conseils pour atteindre vos objectifs</CardTitle>
          <CardDescription>Stratégies recommandées</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Planification</h4>
              <p className="text-sm text-muted-foreground">
                Divisez vos grands objectifs en petites tâches quotidiennes mesurables.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Suivi régulier</h4>
              <p className="text-sm text-muted-foreground">
                Revoyez votre progression chaque semaine et ajustez vos stratégies.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Récompenses</h4>
              <p className="text-sm text-muted-foreground">
                Célébrez chaque petit succès pour rester motivé sur le long terme.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Goals;