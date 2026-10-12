-- =====================================================================
-- RESET COMPLETO DE DATOS — COM Argentina
-- Borrar todos los datos de usuario y observaciones PERO:
--   ✅ Conserva auth.users (el login de comargentina1@gmail.com NO se pierde)
--   ✅ Conserva tablas de configuración (badges, karma_config, iso_countries, etc.)
--   ✅ Conserva taxa (catálogo de especies)
--   ✅ Recrea comargentina1@gmail.com como admin al final
--
-- INSTRUCCIONES:
--   1. Ir a https://supabase.com/dashboard/project/sjpbxzppwtfvinqnubqh/sql/new
--   2. Pegar TODO este script y ejecutar (Run)
--   3. Verificar que el resultado sea "Success"
--   4. Iniciar sesión con comargentina1@gmail.com — el perfil se recrea solo
-- =====================================================================


-- ─── PASO 1: Deshabilitar temporalmente triggers para evitar cascadas ────────
-- (No es necesario con TRUNCATE CASCADE, pero lo dejamos documentado)

-- ─── PASO 2: Borrar datos de usuario y observaciones (CASCADE) ───────────────
-- El orden va desde las tablas "hoja" hacia las tablas "raíz".
-- TRUNCATE ... CASCADE elimina filas en todas las tablas referenciadas.

TRUNCATE TABLE
  -- Registros de actividad y gamificación
  public.activity_events,
  public.karma_events,
  public.user_badges,
  public.user_streaks,
  public.karma_milestones,
  public.weekly_validator_rewards,
  -- Observaciones y sus datos relacionados
  public.identification_reactions,
  public.photo_reactions,
  public.observation_reactions,
  public.observation_comments,
  public.identifications,
  public.media_files,
  public.observations,
  -- Taxonomía de rareza (se recalcula automáticamente)
  public.taxon_rarity,
  public.taxon_usage_history,
  public.probable_taxa_cache,
  -- Interacciones sociales
  public.follows,
  public.blocks,
  public.watchlists,
  public.reports,
  public.notifications,
  public.notifications_sent,
  -- Tokens y acceso
  public.user_api_tokens,
  public.push_subscriptions,
  public.api_usage,
  public.ai_usage,
  public.ai_usage_monthly,
  public.ai_errors_log,
  public.ai_rate_limits,
  public.anon_rate_limit,
  public.rate_limit_buckets,
  -- Aplicaciones y roles
  public.expert_applications,
  public.user_expertise,
  public.user_roles,
  -- Admin y auditoría
  public.admin_audit,
  public.admin_anomalies,
  public.admin_health_digests,
  public.admin_action_proposals,
  public.admin_webhook_deliveries,
  -- Patrocinios
  public.sponsorships,
  public.sponsorship_requests,
  public.sponsor_credentials,
  public.sponsor_pools,
  public.pool_consumption,
  public.pool_usage_daily,
  public.pool_user_usage,
  -- Proyectos y cámaras
  public.project_members,
  public.camera_station_periods,
  public.camera_stations,
  -- Listas de especies
  public.species_list_items,
  public.species_lists,
  -- Bans, appeals
  public.ban_appeals,
  public.user_bans,
  -- Sync
  public.sync_failures,
  public.gc_orphan_media_log,
  public.function_errors,
  -- Suscripciones y eventos sorpresa
  public.kairos_subscriptions,
  public.surprise_events,
  -- Observadores destacados
  public.featured_observers,
  -- Finalmente la tabla de usuarios (esto borra todo lo que referencia a users)
  public.users
RESTART IDENTITY CASCADE;


-- ─── PASO 3: Refrescar vistas materializadas ─────────────────────────────────
REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_platform_stats;
REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_taxon_obs_counts;
REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_user_observation_counts;
REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_recent_species;
REFRESH MATERIALIZED VIEW CONCURRENTLY public.karma_leaderboard_30d;
REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_metrics_percentile;
REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_metrics_percentile_state;
-- Nota: species_taxonomy_counts y license_norm/privacy_norm no dependen de usuarios


-- ─── PASO 4: Obtener el UUID del usuario comargentina1@gmail.com ─────────────
-- Este SELECT te muestra el UUID — copialo para el paso siguiente si hubiera error
SELECT id, email FROM auth.users WHERE email = 'comargentina1@gmail.com';


-- ─── PASO 5: Recrear el perfil de comargentina1@gmail.com como admin ─────────
-- Inserta el perfil en public.users (normalmente lo haría el trigger handle_new_user
-- al primer login, pero lo hacemos aquí de forma explícita para poder asignar admin)

INSERT INTO public.users (
  id,
  username,
  display_name,
  preferred_lang,
  observation_count,
  profile_public,
  gamification_opt_in,
  joined_at
)
SELECT
  au.id,
  'comargentina1',
  'COM Argentina',
  'es',
  0,
  true,
  true,
  now()
FROM auth.users au
WHERE au.email = 'comargentina1@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  username     = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  updated_at   = now();


-- ─── PASO 6: Asignar rol de admin ────────────────────────────────────────────
INSERT INTO public.user_roles (user_id, role, granted_at, notes)
SELECT
  au.id,
  'admin'::public.user_role,
  now(),
  'Bootstrap admin — reset inicial de plataforma'
FROM auth.users au
WHERE au.email = 'comargentina1@gmail.com'
ON CONFLICT (user_id, role) DO UPDATE SET
  revoked_at = NULL,
  notes      = EXCLUDED.notes;


-- ─── PASO 7: Verificación final ──────────────────────────────────────────────
SELECT
  u.id,
  u.username,
  u.display_name,
  u.observation_count,
  array_agg(ur.role) AS roles
FROM public.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id AND ur.revoked_at IS NULL
GROUP BY u.id, u.username, u.display_name, u.observation_count;

-- Resultado esperado: 1 fila → comargentina1 | COM Argentina | 0 | {admin}
