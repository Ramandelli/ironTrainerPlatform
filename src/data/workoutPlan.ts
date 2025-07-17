import { WorkoutDay } from '../types/workout';

export const WORKOUT_PLAN: WorkoutDay[] = [
  {
    id: 'monday',
    name: 'PEITO + ABDÔMEN + ESTEIRA',
    day: 'Segunda',
    aerobic: {
      type: 'esteira',
      duration: 10,
      intensity: 'leve',
      timing: 'antes',
      completed: false
    },
    exercises: [
      {
        id: 'supino-reto',
        name: 'Supino reto (barra ou halteres)',
        sets: 4,
        targetReps: '8-10',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'supino-declinado',
        name: 'Supino declinado (barra ou halteres)',
        sets: 4,
        targetReps: '10',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'voador-peitoral',
        name: 'Voador peitoral (dropset na última série)',
        sets: 3,
        targetReps: '12',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'supino-maquina',
        name: 'Supino máquina (horizontal)',
        sets: 3,
        targetReps: '10',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'cross-over',
        name: 'Cross Over (polia alta)',
        sets: 3,
        targetReps: '12',
        completed: false,
        currentSet: 0,
        setData: []
      }
    ],
    abdominal: [
      {
        id: 'elevacao-pernas',
        name: 'Elevação de pernas na paralela',
        sets: 3,
        targetReps: '12',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'prancha-frontal',
        name: 'Prancha frontal',
        sets: 3,
        targetReps: '40s',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'abdominal-solo',
        name: 'Abdominal solo com pés elevados',
        sets: 3,
        targetReps: '15',
        completed: false,
        currentSet: 0,
        setData: []
      }
    ]
  },
  {
    id: 'tuesday',
    name: 'COSTAS + BICICLETA',
    day: 'Terça',
    aerobic: {
      type: 'bicicleta',
      duration: 18,
      intensity: 'moderada',
      timing: 'depois',
      completed: false
    },
    exercises: [
      {
        id: 'puxada-alta-reta',
        name: 'Puxada alta (barra reta)',
        sets: 4,
        targetReps: '10',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'puxada-triangulo',
        name: 'Puxada alta triângulo (pegada neutra)',
        sets: 3,
        targetReps: '10',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'remada-baixa',
        name: 'Remada baixa triângulo (dropset na última)',
        sets: 4,
        targetReps: '10',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'remada-curvada',
        name: 'Remada curvada (máquina ou barra)',
        sets: 3,
        targetReps: '10',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'pulldown',
        name: 'Pulldown (cabo ou halter)',
        sets: 3,
        targetReps: '12',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'voador-dorsal',
        name: 'Voador dorsal (máquina ou crucifixo inverso)',
        sets: 3,
        targetReps: '12',
        completed: false,
        currentSet: 0,
        setData: []
      }
    ]
  },
  {
    id: 'wednesday',
    name: 'BÍCEPS + TRÍCEPS + ABDÔMEN + ESTEIRA',
    day: 'Quarta',
    aerobic: {
      type: 'esteira',
      duration: 10,
      intensity: 'leve',
      timing: 'antes',
      completed: false
    },
    exercises: [
      {
        id: 'rosca-alternada',
        name: 'Rosca alternada (halter)',
        sets: 4,
        targetReps: '10',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'rosca-martelo',
        name: 'Rosca martelo',
        sets: 3,
        targetReps: '10',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'rosca-direta',
        name: 'Rosca direta (dropset na última série)',
        sets: 3,
        targetReps: '10',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'rosca-antebraco',
        name: 'Rosca de antebraço (polia ou barra)',
        sets: 3,
        targetReps: '15',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'triceps-pulley',
        name: 'Tríceps pulley (barra reta ou V)',
        sets: 4,
        targetReps: '10',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'triceps-corda',
        name: 'Tríceps corda (dropset na última série)',
        sets: 3,
        targetReps: '12',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'triceps-frances',
        name: 'Tríceps francês unilateral',
        sets: 3,
        targetReps: '10',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'triceps-testa',
        name: 'Tríceps testa (polia ou barra)',
        sets: 3,
        targetReps: '10',
        completed: false,
        currentSet: 0,
        setData: []
      }
    ],
    abdominal: [
      {
        id: 'prancha-lateral',
        name: 'Prancha lateral',
        sets: 2,
        targetReps: '30s cada lado',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'abdominal-obliquo',
        name: 'Abdominal oblíquo com halter',
        sets: 3,
        targetReps: '15 por lado',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'elevacao-pernas-caneleira',
        name: 'Elevação de pernas com caneleira',
        sets: 3,
        targetReps: '12',
        completed: false,
        currentSet: 0,
        setData: []
      }
    ]
  },
  {
    id: 'thursday',
    name: 'OMBRO + BICICLETA',
    day: 'Quinta',
    aerobic: {
      type: 'bicicleta',
      duration: 15,
      intensity: 'moderada',
      timing: 'depois',
      completed: false
    },
    exercises: [
      {
        id: 'desenvolvimento-barra',
        name: 'Desenvolvimento com barra (ou halteres)',
        sets: 4,
        targetReps: '8-10',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'elevacao-frontal',
        name: 'Elevação frontal com halter (palma para cima)',
        sets: 3,
        targetReps: '12',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'elevacao-lateral',
        name: 'Elevação lateral com halter (dropset na última)',
        sets: 3,
        targetReps: '12',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'elevacao-lateral-polia',
        name: 'Elevação lateral na polia com triângulo',
        sets: 3,
        targetReps: '12',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'posterior-cross',
        name: 'Posterior no cross (cruzado)',
        sets: 3,
        targetReps: '12',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'voador-invertido',
        name: 'Voador invertido (ou com halter)',
        sets: 3,
        targetReps: '12',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'encolhimento-ombro',
        name: 'Encolhimento de ombro (halteres ou barra)',
        sets: 3,
        targetReps: '15',
        completed: false,
        currentSet: 0,
        setData: []
      }
    ]
  },
  {
    id: 'friday',
    name: 'PERNAS + ABDÔMEN + ESTEIRA',
    day: 'Sexta',
    aerobic: {
      type: 'esteira',
      duration: 12,
      intensity: 'leve',
      timing: 'depois',
      completed: false
    },
    exercises: [
      {
        id: 'cadeira-extensora',
        name: 'Cadeira extensora (dropset na última série)',
        sets: 4,
        targetReps: '12',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'leg-press',
        name: 'Leg press 45° (dropset na última série)',
        sets: 4,
        targetReps: '10',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'cadeira-flexora',
        name: 'Cadeira flexora',
        sets: 4,
        targetReps: '10',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'panturrilha-maquina',
        name: 'Panturrilha na máquina',
        sets: 4,
        targetReps: '20',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'desenvolvimento-pelvico',
        name: 'Desenvolvimento pélvico',
        sets: 3,
        targetReps: '12',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'agachamento-afundo',
        name: 'Agachamento afundo (com halter ou barra)',
        sets: 3,
        targetReps: '10 por perna',
        completed: false,
        currentSet: 0,
        setData: []
      }
    ],
    abdominal: [
      {
        id: 'abdominal-maquina',
        name: 'Abdominal na máquina (ou com peso)',
        sets: 3,
        targetReps: '12',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'crunch-invertido',
        name: 'Crunch invertido',
        sets: 3,
        targetReps: '15',
        completed: false,
        currentSet: 0,
        setData: []
      },
      {
        id: 'prancha-braco-estendido',
        name: 'Prancha com braço estendido',
        sets: 3,
        targetReps: '30-40s',
        completed: false,
        currentSet: 0,
        setData: []
      }
    ]
  }
];