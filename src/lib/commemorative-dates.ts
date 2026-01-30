// Commemorative dates (non-blocking, informational only)
// Uses Lucide React icons only

export const COMMEMORATIVE_DATES = [
    // Health Professionals
    { date: '01-18', name: 'Dia do Médico', icon: 'Stethoscope', category: 'health' },
    { date: '10-13', name: 'Dia do Fisioterapeuta', icon: 'Activity', category: 'health' },
    { date: '10-25', name: 'Dia do Dentista', icon: 'Smile', category: 'health' },
    { date: '01-20', name: 'Dia do Farmacêutico', icon: 'Pill', category: 'health' },
    { date: '05-12', name: 'Dia do Enfermeiro', icon: 'Heart', category: 'health' },
    { date: '09-13', name: 'Dia do Psicólogo', icon: 'Brain', category: 'health' },
    { date: '08-31', name: 'Dia do Nutricionista', icon: 'Apple', category: 'health' },
    { date: '09-27', name: 'Dia do Técnico em Enfermagem', icon: 'Clipboard', category: 'health' },

    // Other Professions
    { date: '10-15', name: 'Dia do Professor', icon: 'GraduationCap', category: 'profession' },
    { date: '12-11', name: 'Dia do Engenheiro', icon: 'HardHat', category: 'profession' },
    { date: '08-11', name: 'Dia do Advogado', icon: 'Scale', category: 'profession' },
    { date: '04-25', name: 'Dia do Contabilista', icon: 'Calculator', category: 'profession' },
    { date: '05-01', name: 'Dia do Trabalhador', icon: 'Briefcase', category: 'profession' },
    { date: '03-08', name: 'Dia do Arquiteto', icon: 'Ruler', category: 'profession' },
    { date: '10-19', name: 'Dia do Profissional de TI', icon: 'Monitor', category: 'profession' },
    { date: '07-25', name: 'Dia do Motorista', icon: 'Car', category: 'profession' },

    // Health Awareness
    { date: '03-08', name: 'Dia da Mulher', icon: 'Users', category: 'awareness' },
    { date: '04-02', name: 'Dia do Autismo', icon: 'Heart', category: 'awareness' },
    { date: '09-29', name: 'Dia Mundial do Coração', icon: 'HeartPulse', category: 'awareness' },
    { date: '10-01', name: 'Dia do Idoso', icon: 'User', category: 'awareness' },
    { date: '10-12', name: 'Dia das Crianças', icon: 'Baby', category: 'awareness' },

    // Month-long campaigns (will show on first day of month)
    { date: '10-01', name: 'Outubro Rosa - Câncer de Mama', icon: 'Ribbon', category: 'campaign' },
    { date: '11-01', name: 'Novembro Azul - Câncer de Próstata', icon: 'Ribbon', category: 'campaign' },
]

export function getCommemorationForDate(date: Date): typeof COMMEMORATIVE_DATES[0] | null {
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateKey = `${month}-${day}`

    return COMMEMORATIVE_DATES.find(d => d.date === dateKey) || null
}
