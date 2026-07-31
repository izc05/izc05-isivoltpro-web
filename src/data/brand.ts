export const brand = {
  name: 'IsiVoltPro',
  domain: 'www.isivoltpro.com',
  url: 'https://www.isivoltpro.com',
  email: 'isivoltpro@gmail.com',
  location: 'España',
  tagline: 'Ecosistema digital para mantenimiento, instalaciones e inspecciones técnicas.',
  description: 'Aplicaciones, herramientas y conocimiento técnico nacidos del trabajo real de mantenimiento, coordinación, inspección y campo.',
  claim: 'Del activo físico al informe, la información acompaña al trabajo.',
  mission: 'Conectar personas, instalaciones, activos, materiales y evidencias para convertir el trabajo técnico en información útil, trazable y reutilizable.',
  vision: 'Construir un ecosistema modular de herramientas profesionales que ayude a comprender, mantener e inspeccionar instalaciones con más contexto y mejores decisiones.'
} as const;

export const contactMailto = `mailto:${brand.email}?subject=${encodeURIComponent('Consulta desde www.isivoltpro.com')}`;
