export type ResourceArticle = {
  slug: string;
  category: string;
  title: string;
  summary: string;
  intro: string;
  readTime: string;
  updated: string;
  sections: { title: string; body: string }[];
  relatedArea: string;
};

export const resourceArticles: ResourceArticle[] = [
  {
    slug: 'plan-mantenimiento-preventivo',
    category: 'Mantenimiento',
    title: 'Cómo diseñar un plan de mantenimiento preventivo útil',
    summary: 'Una estructura práctica para ordenar activos, periodicidades, responsables y evidencias sin complicar el trabajo diario.',
    intro: 'Un plan preventivo debe ayudar a decidir qué hacer, cuándo hacerlo y cómo demostrar que se ha realizado. Si solo reproduce formularios extensos, termina convirtiéndose en una carga.',
    readTime: '8 min', updated: '30 julio 2026', relatedArea: 'mantenimiento-ot',
    sections: [
      { title: 'Empieza por la criticidad', body: 'Clasifica instalaciones y equipos según su impacto en la seguridad, la continuidad del servicio, el coste y el cumplimiento normativo. La frecuencia debe responder al riesgo real.' },
      { title: 'Define una tarea comprobable', body: 'Cada operación debe indicar el punto que se revisa, el criterio esperado, la evidencia necesaria y la acción que debe seguirse cuando el resultado no es correcto.' },
      { title: 'Mide lo que ayuda a decidir', body: 'Cumplimiento, retrasos, reincidencias, tiempos y defectos repetidos son más útiles que acumular indicadores sin una decisión asociada.' }
    ]
  },
  {
    slug: 'inspecciones-bt-evidencias',
    category: 'Electricidad',
    title: 'Inspecciones BT: cómo ordenar mediciones, defectos y evidencias',
    summary: 'Una guía de estructura digital para que los datos de campo terminen en un informe claro y trazable.',
    intro: 'La calidad del informe final depende de cómo se captura la información durante la inspección. Bloques, mediciones, defectos y fotografías deben estar relacionados desde el inicio.',
    readTime: '7 min', updated: '30 julio 2026', relatedArea: 'inspecciones-bt',
    sections: [
      { title: 'Organiza por bloques técnicos', body: 'Separa datos generales, documentación, inspección visual, mediciones, defectos y conclusión. Esta estructura facilita la revisión y evita omisiones.' },
      { title: 'Vincula la evidencia al punto', body: 'Las fotografías y observaciones deben quedar asociadas al elemento inspeccionado y no almacenadas como una galería sin contexto.' },
      { title: 'Mantén la trazabilidad', body: 'Registra fecha, técnico, criterio utilizado, modificación y resultado para poder reconstruir cómo se alcanzó la conclusión.' }
    ]
  },
  {
    slug: 'diagnostico-refrigeracion-presion-temperatura',
    category: 'Refrigeración',
    title: 'Diagnóstico frigorífico con presión y temperatura',
    summary: 'Cómo relacionar mediciones para interpretar el circuito sin depender de un único valor aislado.',
    intro: 'La presión por sí sola no explica el estado de una instalación. Debe relacionarse con el refrigerante, la temperatura de saturación, las condiciones ambientales y otros síntomas.',
    readTime: '6 min', updated: '30 julio 2026', relatedArea: 'refrigeracion',
    sections: [
      { title: 'Identifica el refrigerante', body: 'La relación entre presión y temperatura depende del fluido. Antes de interpretar una lectura, confirma el refrigerante y la escala utilizada.' },
      { title: 'Combina varias mediciones', body: 'Presiones, temperaturas de tubería, aire de entrada y salida, intensidad y estado de filtros ofrecen una visión mucho más fiable.' },
      { title: 'Documenta antes de intervenir', body: 'Registrar las condiciones iniciales y finales ayuda a verificar el efecto de la actuación y construir un histórico de diagnóstico.' }
    ]
  },
  {
    slug: 'mantenimiento-uta-calidad-aire',
    category: 'Climatización',
    title: 'Mantenimiento de UTA y calidad del aire',
    summary: 'Puntos de revisión para filtros, baterías, ventiladores, caudales, temperaturas y documentación.',
    intro: 'Una unidad de tratamiento de aire combina componentes mecánicos, eléctricos, térmicos y de control. La revisión debe analizar el conjunto, no únicamente cambiar filtros.',
    readTime: '9 min', updated: '30 julio 2026', relatedArea: 'climatizacion-rite',
    sections: [
      { title: 'Revisa el recorrido del aire', body: 'Comprueba tomas, compuertas, filtros, baterías, ventiladores, conductos y elementos terminales para localizar restricciones o pérdidas.' },
      { title: 'Compara valores', body: 'Temperaturas, humedades, presiones diferenciales, caudales e intensidad deben compararse con consignas, históricos y condiciones de funcionamiento.' },
      { title: 'Registra limpieza y estado', body: 'Las evidencias permiten demostrar el mantenimiento, anticipar deterioros y coordinar actuaciones posteriores.' }
    ]
  },
  {
    slug: 'mantenimiento-pci-documentacion',
    category: 'PCI',
    title: 'Mantenimiento PCI: inventario, revisiones y documentación',
    summary: 'Cómo relacionar equipos, ubicaciones, periodicidades, incidencias y certificados en un mismo flujo.',
    intro: 'La gestión PCI exige conocer qué equipos existen, dónde se encuentran, qué revisión corresponde y qué resultado tuvo cada actuación.',
    readTime: '6 min', updated: '30 julio 2026', relatedArea: 'pci',
    sections: [
      { title: 'Construye un inventario fiable', body: 'Cada equipo debe disponer de identificación, tipo, ubicación, características, estado y documentación relacionada.' },
      { title: 'Programa por periodicidad', body: 'El sistema debe generar las tareas correspondientes y diferenciar revisión, mantenimiento, sustitución e incidencia.' },
      { title: 'Cierra con evidencias', body: 'Resultado, anomalías, fotografías, firma y certificado deben quedar vinculados al equipo y a la intervención.' }
    ]
  },
  {
    slug: 'cuando-crear-aplicacion-mantenimiento',
    category: 'Digitalización',
    title: 'Cuándo una hoja de cálculo necesita convertirse en aplicación',
    summary: 'Señales prácticas para decidir cuándo mantener una tabla y cuándo crear una herramienta especializada.',
    intro: 'Una hoja de cálculo puede resolver muchas necesidades, pero comienza a fallar cuando varias personas trabajan a la vez, se necesitan permisos, trazabilidad o flujos guiados.',
    readTime: '5 min', updated: '30 julio 2026', relatedArea: 'utilidades-asistentes',
    sections: [
      { title: 'Detecta la fricción', body: 'Duplicados, fórmulas rotas, versiones diferentes, búsquedas lentas y registros incompletos indican que el flujo necesita otra estructura.' },
      { title: 'Conserva la simplicidad', body: 'Crear una aplicación no significa añadir complejidad. Debe reducir pasos, validar datos y mostrar a cada usuario solamente lo necesario.' },
      { title: 'Construye por recorridos completos', body: 'Empieza por una tarea real de principio a fin y valida su utilidad antes de incorporar paneles, automatizaciones e integraciones.' }
    ]
  }
];