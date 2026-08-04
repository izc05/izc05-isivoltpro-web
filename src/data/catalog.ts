export type EcosystemArea = {
  slug: string;
  code: string;
  name: string;
  family: 'Operaciones' | 'Recursos' | 'Ingeniería' | 'Especialidades' | 'Conocimiento';
  short: string;
  description: string;
  status: 'Operativa' | 'Publicada' | 'Próxima publicación' | 'En desarrollo' | 'Planificado';
  audience: string;
  highlights: string[];
  previewLabel: string;
  previewValue: string;
  previewItems: string[];
};

export const ecosystemAreas: EcosystemArea[] = [
  {
    slug: 'herramientas-maletines', code: 'HM', name: 'Herramientas QR y NFC', family: 'Recursos',
    short: 'Herramientas, técnicos, préstamos, devoluciones y trazabilidad.',
    description: 'Gestiona herramientas, maletines, equipos de medida, EPI y otros recursos técnicos con identificación QR/NFC, responsables e historial.',
    status: 'Operativa', audience: 'Almacenes, coordinación, talleres y servicios técnicos',
    highlights: ['Alta y clasificación', 'Préstamos y devoluciones', 'QR/NFC por equipo', 'Revisiones e historial'],
    previewLabel: 'Estado actual', previewValue: 'Operativa', previewItems: ['Publicada en qr.isivoltpro.com', 'Modo local operativo', 'Sincronización cloud en evolución']
  },
  {
    slug: 'mantenimiento-ot', code: 'OT', name: 'IsiVoltPro OT', family: 'Operaciones',
    short: 'Clientes, instalaciones, órdenes, técnicos, estados y auditoría.',
    description: 'Organiza avisos y órdenes de trabajo con clientes, instalaciones, asignación, seguimiento, zona móvil del técnico y auditoría cronológica. El cierre documentado seguirá ampliándose por fases.',
    status: 'Operativa', audience: 'Coordinación, responsables de mantenimiento y técnicos de campo',
    highlights: ['Clientes e instalaciones', 'Asignación y estados operativos', 'Zona móvil del técnico', 'Auditoría cronológica'],
    previewLabel: 'Estado actual', previewValue: 'Operativa', previewItems: ['Panel central de coordinación', 'Zona móvil del técnico', 'Estados y seguimiento']
  },
  {
    slug: 'inventario-almacen', code: 'AL', name: 'Inventario y almacén', family: 'Recursos',
    short: 'Stock, ubicaciones, movimientos, consumos y reposición.',
    description: 'Controla materiales, repuestos y consumibles con movimientos claros, niveles mínimos y seguimiento por ubicación.',
    status: 'En desarrollo', audience: 'Almacenes técnicos, mantenimiento e instalaciones',
    highlights: ['Entradas y salidas', 'Stock por ubicación', 'Alertas de reposición', 'Historial de consumos'],
    previewLabel: 'Núcleo futuro', previewValue: 'Stock', previewItems: ['Ubicaciones', 'Reposición', 'Consumos vinculados']
  },
  {
    slug: 'activos-qr-nfc', code: 'QR', name: 'Activos QR/NFC', family: 'Operaciones',
    short: 'Identificación instantánea, historial y documentación asociada.',
    description: 'Accede desde el activo a su ficha técnica, ubicación, historial, documentos y operaciones pendientes.',
    status: 'En desarrollo', audience: 'Instalaciones, hospitales, industria y servicios de campo',
    highlights: ['Etiquetas QR y NFC', 'Ficha técnica inmediata', 'Histórico de intervenciones', 'Documentos vinculados'],
    previewLabel: 'Identidad digital', previewValue: 'QR/NFC', previewItems: ['Ficha técnica', 'Historial', 'Documentación']
  },
  {
    slug: 'inspecciones-bt', code: 'BT', name: 'Inspecciones BT', family: 'Ingeniería',
    short: 'Datos, bloques, checklist, mediciones, defectos e informe.',
    description: 'Digitaliza inspecciones de baja tensión con datos de instalación, bloques de revisión, mediciones, defectos, fotografías y resultado final.',
    status: 'En desarrollo', audience: 'Inspectores, instaladores y responsables eléctricos',
    highlights: ['REBT y criterios técnicos', 'Mediciones y defectos', 'Evidencias fotográficas', 'Informe profesional'],
    previewLabel: 'Flujo técnico', previewValue: 'BT', previewItems: ['Checklist', 'Mediciones', 'Informe']
  },
  {
    slug: 'calculos-electricos', code: 'kW', name: 'Cálculos eléctricos', family: 'Ingeniería',
    short: 'Secciones, caída de tensión, potencia, protecciones y dimensionado.',
    description: 'Reúne calculadoras eléctricas rápidas y verificables para el trabajo diario en oficina y campo.',
    status: 'Planificado', audience: 'Electricistas, ingenierías, mantenimiento e instaladores',
    highlights: ['Sección de conductores', 'Caída de tensión', 'Protecciones', 'Potencia y consumo'],
    previewLabel: 'Utilidades previstas', previewValue: '12+', previewItems: ['Caída de tensión', 'Sección de cable', 'Potencia trifásica']
  },
  {
    slug: 'refrigeracion', code: 'RF', name: 'Refrigeración', family: 'Ingeniería',
    short: 'Presiones, temperaturas, refrigerantes y diagnóstico frigorífico.',
    description: 'Herramientas para registrar datos, interpretar el circuito frigorífico y documentar actuaciones.',
    status: 'Planificado', audience: 'Frigoristas, mantenedores y técnicos de climatización',
    highlights: ['Presión y temperatura', 'Sobrecalentamiento', 'Subenfriamiento', 'Carga y refrigerantes'],
    previewLabel: 'Cálculos técnicos', previewValue: 'RF', previewItems: ['Sobrecalentamiento', 'Subenfriamiento', 'Presión-temperatura']
  },
  {
    slug: 'climatizacion-rite', code: 'RT', name: 'Climatización y RITE', family: 'Especialidades',
    short: 'Equipos HVAC, ventilación, mantenimiento y cumplimiento RITE.',
    description: 'Gestiona instalaciones térmicas, planes de mantenimiento, verificaciones y cálculos de climatización.',
    status: 'Planificado', audience: 'Mantenedores RITE, instaladores y responsables de edificios',
    highlights: ['Equipos HVAC y UTA', 'Planes RITE', 'Caudales y ventilación', 'Eficiencia energética'],
    previewLabel: 'Especialidad', previewValue: 'RITE', previewItems: ['Equipos', 'Preventivos', 'Verificaciones']
  },
  {
    slug: 'pci', code: 'PCI', name: 'Protección contra incendios', family: 'Especialidades',
    short: 'Inventario, mantenimiento, revisiones y registros PCI.',
    description: 'Centraliza equipos, periodicidades, revisiones, incidencias y evidencias de protección contra incendios.',
    status: 'Planificado', audience: 'Mantenedores PCI, industria, edificios y hospitales',
    highlights: ['Extintores y BIE', 'Detección y alarma', 'Periodicidades', 'Informes y certificados'],
    previewLabel: 'Especialidad', previewValue: 'PCI', previewItems: ['Equipos', 'Periodicidades', 'Certificados']
  },
  {
    slug: 'legionella-agua', code: 'H₂O', name: 'Legionella y agua', family: 'Especialidades',
    short: 'Purgas, temperaturas, cloro, muestras y trazabilidad.',
    description: 'Facilita la planificación, ejecución y trazabilidad de controles de agua y prevención de Legionella.',
    status: 'Planificado', audience: 'Mantenimiento, sanidad ambiental y responsables de instalaciones',
    highlights: ['Puntos de control', 'Temperaturas y cloro', 'Purgas y muestras', 'Registros e incidencias'],
    previewLabel: 'Especialidad', previewValue: 'H₂O', previewItems: ['Puntos', 'Muestras', 'Registros']
  },
  {
    slug: 'documentacion-tecnica', code: 'DOC', name: 'Documentación técnica', family: 'Conocimiento',
    short: 'Manuales, planos, certificados, procedimientos e informes.',
    description: 'Un espacio común para encontrar documentación fiable vinculada a instalaciones, activos y actuaciones.',
    status: 'Planificado', audience: 'Equipos técnicos, coordinadores y empresas mantenedoras',
    highlights: ['Manuales y planos', 'Certificados', 'Procedimientos', 'Control de versiones'],
    previewLabel: 'Conocimiento', previewValue: 'DOC', previewItems: ['Planos', 'Manuales', 'Informes']
  },
  {
    slug: 'utilidades-asistentes', code: 'AI', name: 'Utilidades y asistentes', family: 'Conocimiento',
    short: 'Calculadoras, conversores, plantillas y asistentes técnicos.',
    description: 'Pequeñas herramientas especializadas para resolver consultas y tareas frecuentes con rapidez.',
    status: 'Planificado', audience: 'Profesionales técnicos de múltiples especialidades',
    highlights: ['Conversores', 'Plantillas', 'Generadores de informes', 'Asistentes especializados'],
    previewLabel: 'Conocimiento', previewValue: '20+', previewItems: ['Calculadoras', 'Generadores', 'Asistentes guiados']
  }
];

export const featuredArea = ecosystemAreas[0];
