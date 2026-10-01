import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Calendar, Clock, Download, Printer } from 'lucide-react';

const Timetable: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Emploi du temps</h1>
        <p className="text-muted-foreground">
          Consultez votre emploi du temps, exportez-le et suivez les modifications.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Emploi du temps de la semaine</CardTitle>
                <CardDescription>Semaine du 30 septembre au 4 octobre</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Vue semaine
                </Button>
                <Button variant="outline" size="sm">
                  <Clock className="h-4 w-4 mr-2" />
                  Vue jour
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-3 text-left text-sm font-medium">Heure</th>
                    <th className="p-3 text-left text-sm font-medium">Lundi</th>
                    <th className="p-3 text-left text-sm font-medium">Mardi</th>
                    <th className="p-3 text-left text-sm font-medium">Mercredi</th>
                    <th className="p-3 text-left text-sm font-medium">Jeudi</th>
                    <th className="p-3 text-left text-sm font-medium">Vendredi</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { time: '8h00-9h00', mon: 'Maths', tue: 'Physique', wed: 'Sport', thu: 'Français', fri: 'Histoire' },
                    { time: '9h00-10h00', mon: 'Physique', tue: 'Anglais', wed: 'Maths', thu: 'SVT', fri: 'Maths' },
                    { time: '10h15-11h15', mon: 'Français', tue: 'SVT', wed: 'Espagnol', thu: 'Physique', fri: 'Anglais' },
                    { time: '11h15-12h15', mon: 'Histoire', tue: 'Maths', wed: 'Français', thu: 'Anglais', fri: 'SVT' },
                    { time: '13h30-14h30', mon: 'Anglais', tue: 'Français', wed: '', thu: 'Maths', fri: 'Physique' },
                    { time: '14h30-15h30', mon: 'SVT', tue: 'Espagnol', wed: '', thu: 'Histoire', fri: 'Français' },
                  ].map((row, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                      <td className="p-3 text-sm font-medium">{row.time}</td>
                      <td className="p-3 text-sm">{row.mon}</td>
                      <td className="p-3 text-sm">{row.tue}</td>
                      <td className="p-3 text-sm">{row.wed}</td>
                      <td className="p-3 text-sm">{row.thu}</td>
                      <td className="p-3 text-sm">{row.fri}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>Gérez votre emploi du temps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button className="w-full" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exporter en .ics
              </Button>
              <Button className="w-full" variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-medium mb-2">Légende</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Cours normal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm">Cours modifié</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm">Cours annulé</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-medium mb-2">Statistiques</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Heures de cours cette semaine:</span>
                  <span className="font-medium">25h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Trous dans l'emploi du temps:</span>
                  <span className="font-medium">3h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Prochain cours:</span>
                  <span className="font-medium">Lundi 8h00</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Modifications récentes</CardTitle>
            <CardDescription>Cours modifiés ou annulés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start gap-3">
                  <div className="bg-yellow-100 p-2 rounded">
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Maths modifié</h4>
                    <p className="text-xs text-muted-foreground">
                      Cours de Maths déplacé de jeudi 9h00 à jeudi 10h15
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start gap-3">
                  <div className="bg-red-100 p-2 rounded">
                    <Clock className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Sport annulé</h4>
                    <p className="text-xs text-muted-foreground">
                      Cours de Sport du mercredi annulé
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prochaines vacances</CardTitle>
            <CardDescription>Calendrier scolaire</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div>
                  <h4 className="font-medium text-sm">Vacances de la Toussaint</h4>
                  <p className="text-xs text-muted-foreground">18 octobre - 2 novembre</p>
                </div>
                <div className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  17 jours
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                <div>
                  <h4 className="font-medium text-sm">Vacances de Noël</h4>
                  <p className="text-xs text-muted-foreground">21 décembre - 5 janvier</p>
                </div>
                <div className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                  16 jours
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Timetable;