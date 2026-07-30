export type EcosystemArea = {
  slug: string;
  code: string;
  name: string;
  short: string;
  description: string;
  status: 'Disponible' | 'En desarrollo' | 'Planificado';
  audience: string;
  highlights: string[];
};

export const ecosystemAreas: EcosystemArea[] = [
  {
    slug: 'mantenimiento-ot', code: 'OT', name: 'Mantenimiento y OT',
    short: 'Órdenes, preventivos, incidencias, técnicos e instalaciones.',
    description: 'Organiza el ciclo completo del mantenimiento desde la solicitud inicial hasta el cierre, el informe y la auditoría.',
    status: 'Disponible', audience: 'Coordinadores, responsables de mantenimiento y técnicos de campo',
    highlights: ['Órdenes preventivas y correctivas', 'Planificación y asignación', 'Checklists, fotos y firmas', 'Histórico y trazabilidad']
  },
  {
    slug: 'inventario-almacen', code: 'AL', name: 'Inventario y almacén',
    short: 'Stock, ubicaciones, movimientos, consumos y reposición.',
    description: 'Controla materiales, repuestos y consumibles con movimientos claros, niveles mínimos y seguimiento por ubicación.',
    status: 'En desarrollo', audience: 'Almacenes técnicos, mantenimiento e instalaciones',
    highlights: ['Entradas y salidas', 'Stock por ubicación', 'Alertas de reposición', 'Historial de consumos']
  },
  {
    slug: 'herramientas-maletines', code: 'HM', name: 'Herramientas y maletines',
    short: 'Asignación, entrega, devolución y trazabilidad de equipos.',
    description: 'Registra herramientas, maletines, equipos de medida y EPI vinculados a cada técnico mediante QR o NFC.',
    status: 'En desarrollo', audience: 'Talleres, servicios técnicos y responsables de equipos',
    highlights: ['Asignación a técnicos', 'Control de entregas', 'Estado y revisiones', 'Identificación QR/NFC']
  },
  {
    slug: 'activos-qr-nfc', code: 'QR', name: 'Activos QR/NFC',
    short: 'Identificación instantánea, historial y documentación asociada.',
    description: 'Accede desde el activo a su ficha técnica, ubicación, historial, documentos y operaciones pendientes.',
    status: 'En desarrollo', audience: 'Instalaciones, hospitales, industria y servicios de campo',
    highlights: ['Etiquetas QR y NFC', 'Ficha técnica inmediata', 'Histórico de intervenciones', 'Documentos vinculados']
  },
  {
    slug: 'inspecciones-bt', code: 'BT', name: 'Inspecciones BT',
    short: 'Revisiones, mediciones, defectos, fotografías e informes.',
    description: 'Digitaliza inspecciones de baja tensión con bloques, mediciones, clasificación de defectos e informe final.',
    status: 'En desarrollo', audience: 'Inspectores, instaladores y responsables eléctricos',
    highlights: ['REBT y criterios técnicos', 'Mediciones y defectos', 'Evidencias fotográficas', 'Informe profesional']
  },
  {
    slug: 'calculos-electricos', code: 'kW', name: 'Cálculos eléctricos',
    short: 'Secciones, caída de tensión, protecciones y dimensionado.',
    description: 'Reúne calculadoras eléctricas rápidas y verificables para el trabajo diario en oficina y campo.',
    status: 'Planificado', audience: 'Electricistas, ingenierías, mantenimiento e instaladores',
    highlights: ['Sección de conductores', 'Caída de tensión', 'Protecciones', 'Potencia y consumo']
  },
  {
    slug: 'refrigeracion', code: 'RF', name: 'Refrigeración',
    short: 'Presiones, temperaturas, refrigerantes y diagnóstico frigorífico.',
    description: 'Herramientas para registrar datos, interpretar el circuito frigorífico y documentar actuaciones.',
    status: 'Planificado', audience: 'Frigoristas, mantenedores y técnicos de climatización',
    highlights: ['Presión y temperatura', 'Sobrecalentamiento', 'Subenfriamiento', 'Carga y refrigerantes']
  },
  {
    slug: 'climatizacion-rite', code: 'RT', name: 'Climatización y RITE',
    short: 'Equipos HVAC, ventilación, eficiencia y cumplimiento RITE.',
    description: 'Gestiona instalaciones térmicas, planes de mantenimiento, verificaciones y cálculos de climatización.',
    status: 'Planificado', audience: 'Mantenedores RITE, instaladores y responsables de edificios',
    highlights: ['Equipos HVAC', 'Planes RITE', 'Caudales y ventilación', 'Eficiencia energética']
  },
  {
    slug: 'pci', code: 'PCI', name: 'Protección contra incendios',
    short: 'Inventario, mantenimiento, revisiones y registros PCI.',
    description: 'Centraliza equipos, periodicidades, revisiones, incidencias y evidencias de protección contra incendios.',
    status: 'Planificado', audience: 'Mantenedores PCI, industria, edificios y hospitales',
    highlights: ['Extintores y BIE', 'Detección y alarma', 'Periodicidades', 'Informes y certificados']
  },
  {
    slug: 'legionella-agua', code: 'H₂O', name: 'Legionella y agua',
    short: 'Purgas, temperaturas, cloro, muestras y registros.',
    description: 'Facilita la planificación, ejecución y trazabilidad de controles de agua y prevención de Legionella.',
    status: 'Planificado', audience: 'Mantenimiento, sanidad ambiental y responsables de instalaciones',
    highlights: ['Puntos de control', 'Temperaturas y cloro', 'Purgas y muestras', 'Registros e incidencias']
  },
  {
    slug: 'documentacion-tecnica', code: 'DOC', name: 'Documentación técnica',
    short: 'Manuales, planos, certificados, procedimientos e informes.',
    description: 'Un espacio común para encontrar documentación fiable vinculada a instalaciones, activos y actuaciones.',
    status: 'Planificado', audience: 'Equipos técnicos, coordinadores y empresas mantenedoras',
    highlights: ['Manuales y planos', 'Certificados', 'Procedimientos', 'Control de versiones']
  },
  {
    slug: 'utilidades-asistentes', code: 'AI', name: 'Utilidades y asistentes',
    short: 'Calculadoras, conversores, plantillas y asistentes técnicos.',
    description: 'Pequeñas herramientas especializadas para resolver consultas y tareas frecuentes con rapidez.',
    status: 'Planificado', audience: 'Profesionales técnicos de múltiples especialidades',
    highlights: ['Conversores', 'Plantillas', 'Generadores de informes', 'Asistentes especializados']
  }
];

export const featuredArea = ecosystemAreas[0];
