export const brand = {
  name: 'IsiVoltPro',
  domain: 'isivoltpro.com',
  url: 'https://isivoltpro.com',
  email: 'isivoltpro@gmail.com',
  location: 'España',
  tagline: 'Ecosistema digital para mantenimiento, instalaciones e inspecciones técnicas.',
  description: 'Aplicaciones, herramientas y conocimiento técnico nacidos del trabajo real de mantenimiento, coordinación, inspección y campo.'
} as const;

export const contactMailto = `mailto:${brand.email}?subject=${encodeURIComponent('Consulta desde isivoltpro.com')}`;
