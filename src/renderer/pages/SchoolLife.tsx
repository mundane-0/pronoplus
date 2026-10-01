import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Users, MessageSquare, Bell, FileText, Award, TrendingUp } from 'lucide-react';

const SchoolLife: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Vie scolaire</h1>
        <p className="text-muted-foreground">
          Consultez les actualités, les absences, les sanctions et la vie de l'établissement.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Actualités de l'établissement
              </CardTitle>
              <CardDescription>Dernières annonces et informations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="pb-4 border-b last:border-b-0 last:pb-0">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Bell className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">Journée portes ouvertes</h3>
                        <Badge variant="outline" className="text-xs">
                          15 octobre 2024
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        L'établissement organise une journée portes ouvertes le samedi 15 octobre. Venez découvrir les formations proposées et rencontrer les enseignants.
                      </p>
                      <Button variant="outline" size="sm">
                        <FileText className="h-3 w-3 mr-2" />
                        Voir les détails
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="pb-4 border-b last:border-b-0 last:pb-0">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-100 p-2 rounded-full">
                      <MessageSquare className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">Réunion parents-professeurs</h3>
                        <Badge variant="outline" className="text-xs">
                          22 octobre 2024
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        La réunion parents-professeurs du premier trimestre aura lieu le mardi 22 octobre. Les rendez-vous peuvent être pris via Pronote à partir du 15 octobre.
                      </p>
                      <Button variant="outline" size="sm">
                        <FileText className="h-3 w-3 mr-2" />
                        Prendre rendez-vous
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="pb-4 border-b last:border-b-0 last:pb-0">
                  <div className="flex items-start gap-4">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">Club informatique</h3>
                        <Badge variant="outline" className="text-xs">
                          Tous les jeudis
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Le club informatique reprend ses activités tous les jeudis de 13h à 14h en salle 203. Initiation à la programmation et développement de projets.
                      </p>
                      <Button variant="outline" size="sm">
                        <FileText className="h-3 w-3 mr-2" />
                        S'inscrire
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Absences et retards</CardTitle>
              <CardDescription>Votre suivi de présence</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">2</div>
                    <div className="text-sm text-muted-foreground">Absences justifiées</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">1</div>
                    <div className="text-sm text-muted-foreground">Retards</div>
                  </div>
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground">
                    Votre taux de présence cette année est de <span className="font-medium text-green-600">97.5%</span>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statut scolaire</CardTitle>
              <CardDescription>Votre situation actuelle</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Comportement:</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <Award className="h-3 w-3 mr-1" />
                    Exemplaire
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Participation:</span>
                  <Badge variant="outline">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Moyenne générale:</span>
                  <Badge variant="outline">14.2/20</Badge>
                </div>
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-sm mb-2">Prochaine évaluation</h4>
                  <div className="text-sm text-muted-foreground">
                    Contrôle de Maths le 10 octobre
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Félicitations</CardTitle>
              <CardDescription>Encouragements reçus</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        Excellent travail en Physique
                      </p>
                      <p className="text-xs text-blue-600">
                        Professeur Martin - 25 septembre
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                  <div className="flex items-start gap-2">
                    <Award className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Participation remarquable
                      </p>
                      <p className="text-xs text-green-600">
                        Professeur Dupont - 18 septembre
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Services</CardTitle>
              <CardDescription>Accès rapide</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Certificat de scolarité
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Attestation d'assiduité
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Liste des délégués
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Règlement intérieur
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calendrier des événements</CardTitle>
          <CardDescription>Prochains événements scolaires</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-medium">Date</th>
                  <th className="text-left p-3 text-sm font-medium">Événement</th>
                  <th className="text-left p-3 text-sm font-medium">Lieu</th>
                  <th className="text-left p-3 text-sm font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { date: '10/10/2024', event: 'Contrôle de Maths', lieu: 'Salle 102', statut: 'À venir' },
                  { date: '15/10/2024', event: 'Journée portes ouvertes', lieu: 'Hall principal', statut: 'Confirmé' },
                  { date: '22/10/2024', event: 'Réunion parents-professeurs', lieu: 'Salle polyvalente', statut: 'Confirmé' },
                  { date: '18/11/2024', event: 'Conseil de classe T1', lieu: 'Salle 201', statut: 'Programmé' },
                  { date: '18/12/2024', event: 'Vacances de Noël', lieu: '-', statut: 'Congé' },
                ].map((item, index) => (
                  <tr key={index} className="border-b last:border-b-0 hover:bg-muted/50">
                    <td className="p-3 text-sm">{item.date}</td>
                    <td className="p-3 text-sm">{item.event}</td>
                    <td className="p-3 text-sm">{item.lieu}</td>
                    <td className="p-3 text-sm">
                      <Badge variant={
                        item.statut === 'Confirmé' ? 'default' :
                        item.statut === 'À venir' ? 'outline' :
                        item.statut === 'Programmé' ? 'secondary' :
                        'outline'
                      }>
                        {item.statut}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SchoolLife;