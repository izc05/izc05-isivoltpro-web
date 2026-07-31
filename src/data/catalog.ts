export type EcosystemArea = {
  slug: string;
  code: string;
  name: string;
  family: 'Operaciones' | 'Recursos' | 'Ingeniería' | 'Especialidades' | 'Conocimiento';
  short: string;
  description: string;
  status: 'Demo operativa' | 'En desarrollo' | 'Planificado';
  audience: string;
  highlights: string[];
  previewLabel: string;
  previewValue: string;
  previewItems: string[];
};

export const ecosystemAreas: EcosystemArea[] = [
  {
    slug: 'mantenimiento-ot', code: 'OT', name: 'Mantenimiento y OT', family: 'Operaciones',
    short: 'Avisos, órdenes, técnicos, instalaciones, evidencias e informes.',
    description: 'Organiza el ciclo completo del mantenimiento: aviso, prioridad, asignación, intervención, materiales, evidencias, cierre e historial.',
    status: 'Demo operativa', audience: 'Coordinación, responsables de mantenimiento y técnicos de campo',
    highlights: ['Correctivos y preventivos', 'Asignación y seguimiento', 'Fotos, checklist y firmas', 'Informe y auditoría'],
    previewLabel: 'Flujo principal', previewValue: 'OT', previewItems: ['Aviso y prioridad', 'Intervención técnica', 'Cierre documentado']
  },
  {
    slug: 'inventario-almacen', code: 'AL', name: 'Inventario y almacén', family: 'Recursos',
    short: 'Stock, ubicaciones, movimientos, consumos y reposición.',
    description: 'Controla materiales, repuestos y consumibles con movimientos claros, niveles mínimos y seguimiento por ubicación.',
    status: 'En desarrollo', audience: 'Almacenes técnicos, mantenimiento e instalaciones',
    highlights: ['Entradas y salidas', 'Stock por ubicación', 'Alertas de reposición', 'Historial de consumos'],
    previewLabel: 'Referencias', previewValue: '1.248', previewItems: ['Stock bajo: 12', 'Movimientos hoy: 36', 'Almacenes: 4']
  },
  {
    slug: 'herramientas-maletines', code: 'HM', name: 'Herramientas y maletines', family: 'Recursos',
    short: 'Asignación, entrega, devolución y trazabilidad de equipos.',
    description: 'Registra herramientas, maletines, equipos de medida y EPI vinculados a cada técnico mediante QR o NFC.',
    status: 'En desarrollo', audience: 'Talleres, servicios técnicos y responsables de equipos',
    highlights: ['Asignación a técnicos', 'Control de entregas', 'Estado y revisiones', 'Identificación QR/NFC'],
    previewLabel: 'Equipos controlados', previewValue: '386', previewItems: ['Asignados: 291', 'En almacén: 82', 'Revisión pendiente: 13']
  },
  {
    slug: 'activos-qr-nfc', code: 'QR', name: 'Activos QR/NFC', family: 'Operaciones',
    short: 'Identificación instantánea, historial y documentación asociada.',
    description: 'Accede desde el activo a su ficha técnica, ubicación, historial, documentos y operaciones pendientes.',
    status: 'En desarrollo', audience: 'Instalaciones, hospitales, industria y servicios de campo',
    highlights: ['Etiquetas QR y NFC', 'Ficha técnica inmediata', 'Histórico de intervenciones', 'Documentos vinculados'],
    previewLabel: 'Activos identificados', previewValue: '842', previewItems: ['Con NFC: 312', 'Con QR: 530', 'Con aviso abierto: 17']
  },
  {
    slug: 'inspecciones-bt', code: 'BT', name: 'Inspecciones BT', family: 'Ingeniería',
    short: 'Datos, bloques, checklist, mediciones, defectos e informe.',
    description: 'Digitaliza inspecciones de baja tensión con datos de instalación, bloques de revisión, mediciones, defectos, fotografías y resultado final.',
    status: 'En desarrollo', audience: 'Inspectores, instaladores y responsables eléctricos',
    highlights: ['REBT y criterios técnicos', 'Mediciones y defectos', 'Evidencias fotográficas', 'Informe profesional'],
    previewLabel: 'Inspecciones', previewValue: '58', previewItems: ['Favorables: 41', 'Condicionadas: 14', 'Negativas: 3']
  },
  {
    slug: 'calculos-electricos', code: 'kW', name: 'Cálculos eléctricos', family: 'Ingeniería',
    short: 'Secciones, caída de tensión, potencia, protecciones y dimensionado.',
    description: 'Reúne calculadoras eléctricas rápidas y verificables para el trabajo diario en oficina y campo.',
    status: 'Planificado', audience: 'Electricistas, ingenierías, mantenimiento e instaladores',
    highlights: ['Sección de conductores', 'Caída de tensión', 'Protecciones', 'Potencia y consumo'],
    previewLabel: 'Herramientas previstas', previewValue: '12', previewItems: ['Caída de tensión', 'Sección de cable', 'Potencia trifásica']
  },
  {
    slug: 'refrigeracion', code: 'RF', name: 'Refrigeración', family: 'Ingeniería',
    short: 'Presiones, temperaturas, refrigerantes y diagnóstico frigorífico.',
    description: 'Herramientas para registrar datos, interpretar el circuito frigorífico y documentar actuaciones.',
    status: 'Planificado', audience: 'Frigoristas, mantenedores y técnicos de climatización',
    highlights: ['Presión y temperatura', 'Sobrecalentamiento', 'Subenfriamiento', 'Carga y refrigerantes'],
    previewLabel: 'Cálculos técnicos', previewValue: '8', previewItems: ['Sobrecalentamiento', 'Subenfriamiento', 'Conversión presión-temperatura']
  },
  {
    slug: 'climatizacion-rite', code: 'RT', name: 'Climatización y RITE', family: 'Especialidades',
    short: 'Equipos HVAC, ventilación, mantenimiento y cumplimiento RITE.',
    description: 'Gestiona instalaciones térmicas, planes de mantenimiento, verificaciones y cálculos de climatización.',
    status: 'Planificado', audience: 'Mantenedores RITE, instaladores y responsables de edificios',
    highlights: ['Equipos HVAC y UTA', 'Planes RITE', 'Caudales y ventilación', 'Eficiencia energética'],
    previewLabel: 'Equipos térmicos', previewValue: '126', previewItems: ['UTA: 18', 'Climatizadoras: 42', 'Otros equipos: 66']
  },
  {
    slug: 'pci', code: 'PCI', name: 'Protección contra incendios', family: 'Especialidades',
    short: 'Inventario, mantenimiento, revisiones y registros PCI.',
    description: 'Centraliza equipos, periodicidades, revisiones, incidencias y evidencias de protección contra incendios.',
    status: 'Planificado', audience: 'Mantenedores PCI, industria, edificios y hospitales',
    highlights: ['Extintores y BIE', 'Detección y alarma', 'Periodicidades', 'Informes y certificados'],
    previewLabel: 'Equipos PCI', previewValue: '694', previewItems: ['Extintores: 428', 'BIE: 96', 'Detección: 170']
  },
  {
    slug: 'legionella-agua', code: 'H₂O', name: 'Legionella y agua', family: 'Especialidades',
    short: 'Purgas, temperaturas, cloro, muestras y trazabilidad.',
    description: 'Facilita la planificación, ejecución y trazabilidad de controles de agua y prevención de Legionella.',
    status: 'Planificado', audience: 'Mantenimiento, sanidad ambiental y responsables de instalaciones',
    highlights: ['Puntos de control', 'Temperaturas y cloro', 'Purgas y muestras', 'Registros e incidencias'],
    previewLabel: 'Puntos de control', previewValue: '214', previewItems: ['Revisados hoy: 38', 'Fuera de rango: 2', 'Muestras pendientes: 6']
  },
  {
    slug: 'documentacion-tecnica', code: 'DOC', name: 'Documentación técnica', family: 'Conocimiento',
    short: 'Manuales, planos, certificados, procedimientos e informes.',
    description: 'Un espacio común para encontrar documentación fiable vinculada a instalaciones, activos y actuaciones.',
    status: 'Planificado', audience: 'Equipos técnicos, coordinadores y empresas mantenedoras',
    highlights: ['Manuales y planos', 'Certificados', 'Procedimientos', 'Control de versiones'],
    previewLabel: 'Documentos', previewValue: '2.340', previewItems: ['Planos: 328', 'Manuales: 714', 'Informes: 1.298']
  },
  {
    slug: 'utilidades-asistentes', code: 'AI', name: 'Utilidades y asistentes', family: 'Conocimiento',
    short: 'Calculadoras, conversores, plantillas y asistentes técnicos.',
    description: 'Pequeñas herramientas especializadas para resolver consultas y tareas frecuentes con rapidez.',
    status: 'Planificado', audience: 'Profesionales técnicos de múltiples especialidades',
    highlights: ['Conversores', 'Plantillas', 'Generadores de informes', 'Asistentes especializados'],
    previewLabel: 'Utilidades previstas', previewValue: '20+', previewItems: ['Calculadoras', 'Generadores', 'Asistentes guiados']
  }
];

export const featuredArea = ecosystemAreas[0];