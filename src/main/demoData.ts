/**
 * Données factices utilisées par le mode démonstration.
 * Elles permettent de tester l'application sans connexion réelle à Pronote.
 */

export function buildDemoGrades() {
  const subjects = ['Mathématiques', 'Physique-Chimie', 'Histoire-Géographie', 'Anglais', 'SVT', 'SES'];
  const teachers = ['M. Bernard', 'Mme Durand', 'M. Petit', 'Mme Leroy', 'M. Moreau', 'Mme Simon'];
  const titles = ['Contrôle continu', 'Devoir maison', 'Évaluation', 'Interrogation écrite', 'Exercice'];

  return Array.from({ length: 18 }).map((_, i) => {
    const grade = [8, 12.5, 14, 15.5, 9.5, 11, 16, 13, 10, 17, 12, 7.5][i % 12];
    const date = new Date();
    date.setDate(date.getDate() - i * 3);

    return {
      id: `demo-grade-${i}`,
      subject: subjects[i % subjects.length],
      title: titles[i % titles.length],
      grade,
      scale: 20,
      coefficient: [1, 2, 3, 4][i % 4],
      classAverage: Math.round((8 + Math.random() * 6) * 10) / 10,
      min: Math.round((4 + Math.random() * 3) * 10) / 10,
      max: Math.round((17 + Math.random() * 3) * 10) / 10,
      date: date.toISOString(),
      period: 1,
      teacher: teachers[i % teachers.length],
      comment: i % 3 === 0 ? 'Bon travail, continuez ainsi.' : undefined,
      evaluation: { label: '', type: 'devoir' },
      isBonus: false,
      isOptional: false,
      isExempted: false,
      module: { label: '' },
      subjectId: `demo-subject-${i % subjects.length}`
    };
  });
}

export function buildDemoHomeworks() {
  const subjects = ['Mathématiques', 'Physique-Chimie', 'Histoire-Géographie', 'Anglais', 'SVT', 'SES'];
  return Array.from({ length: 10 }).map((_, i) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + i);
    const date = new Date();
    date.setDate(date.getDate() - i * 2);

    return {
      id: `demo-hw-${i}`,
      subject: subjects[i % subjects.length],
      description: `Exercice ${i + 1} - chapitre ${i + 2}`,
      content: `<p>Travail à faire pour le chapitre ${i + 2}.</p>`,
      additionalContent: '',
      attachments: [],
      dueDate: dueDate.toISOString(),
      date: date.toISOString(),
      period: 1,
      done: i % 3 === 0,
      teacher: 'M. Bernard',
      subjectId: `demo-subject-${i % subjects.length}`
    };
  });
}

export function buildDemoTimetable() {
  const subjects = ['Mathématiques', 'Physique-Chimie', 'Histoire-Géographie', 'Anglais', 'SVT', 'EPS'];
  const rooms = ['A101', 'B203', 'C305', 'LANG2', 'Sciences', 'Gymnase'];
  const start = new Date();
  start.setHours(8, 0, 0, 0);

  const events: any[] = [];
  let cursor = 0;
  for (let day = 0; day < 7; day++) {
    for (let slot = 0; slot < 6; slot++) {
      const from = new Date(start);
      from.setDate(from.getDate() + day);
      from.setHours(8 + slot * 2);
      const to = new Date(from);
      to.setHours(from.getHours() + 1);

      events.push({
        id: `demo-event-${day}-${slot}`,
        subject: subjects[(day + slot) % subjects.length],
        teacher: 'M. Bernard',
        room: rooms[(day + slot) % rooms.length],
        startDate: from.toISOString(),
        endDate: to.toISOString(),
        start: from.toISOString(),
        end: to.toISOString(),
        isCancelled: false,
        className: '2nde A',
        subjectId: `demo-subject-${(day + slot) % subjects.length}`,
        description: '',
        type: 'lesson'
      });
      cursor++;
    }
  }
  return events;
}

export function buildDemoAbsences() {
  return Array.from({ length: 4 }).map((_, i) => {
    const start = new Date();
    start.setDate(start.getDate() - i * 7);
    const end = new Date(start);
    end.setHours(start.getHours() + 2);

    return {
      id: `demo-absence-${i}`,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      subject: ['Mathématiques', 'Histoire-Géographie', 'Anglais', 'EPS'][i % 4],
      reason: i === 0 ? 'Maladie' : undefined,
      justified: i % 2 === 0,
      period: 1,
      subjectId: `demo-subject-${i}`,
      comment: ''
    };
  });
}

export function buildDemoMessages() {
  return Array.from({ length: 6 }).map((_, i) => ({
    id: `demo-msg-${i}`,
    from: ['Mme Leroy', 'M. Moreau', 'Vie scolaire', 'M. Bernard'][i % 4],
    subject: ['Réunion parents-professeurs', 'Absence signalée', 'Sortie scolaire', 'Devoir à rendre'][i % 4],
    content: `<p>Message de démonstration numéro ${i + 1}.</p>`,
    date: new Date(Date.now() - i * 3600 * 1000).toISOString(),
    read: i > 2,
    hasAttachment: false,
    regID: `demo-reg-${i}`,
    sentBy: 'Demo',
    type: 'message'
  }));
}

export function buildDemoInfos() {
  return {
    name: 'ARSENE',
    class: { name: '2nde A', id: 'demo-class' },
    establishment: { name: 'Lycée Démo', id: 'demo-school' },
    profile: { photo: undefined },
    periods: [{ name: 'Trimestre 1', id: 'demo-p1' }]
  };
}