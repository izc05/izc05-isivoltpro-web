-- Un único origen web permite compartir la sesión de Supabase de forma segura
-- sin exponer tokens de actualización entre subdominios.

update public.platform_applications
set launch_url = case code
  when 'ot' then 'https://app.isivoltpro.com/ot/'
  when 'preinspecciones_bt' then 'https://app.isivoltpro.com/preinspecciones/'
  when 'herramientas_qr' then 'https://app.isivoltpro.com/herramientas/'
  else launch_url
end,
updated_at = now()
where code in ('ot', 'preinspecciones_bt', 'herramientas_qr');

comment on column public.platform_applications.launch_url is
  'Ruta privada bajo app.isivoltpro.com. Los subdominios históricos pueden permanecer como alias que redirigen al módulo correspondiente.';
