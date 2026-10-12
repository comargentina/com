-- =====================================================================
-- Chat entity cards with Spanish suggested questions
-- Run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/sjpbxzppwtfvinqnubqh/sql/new
-- =====================================================================

-- 1. Observation card
DROP FUNCTION IF EXISTS public.chat_obs_card(uuid);
CREATE FUNCTION public.chat_obs_card(p_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $$
  WITH o AS (
    SELECT
      o.id, o.observer_id, o.observed_at,
      o.primary_taxon_id, o.obscure_level,
      o.location, o.location_obscured,
      o.state_province, o.notes,
      COALESCE(i.is_research_grade, false) AS is_research_grade,
      t.scientific_name, t.common_name_es, t.common_name_en,
      t.kingdom, t.family
    FROM public.observations o
    LEFT JOIN public.taxa t ON t.id = o.primary_taxon_id
    LEFT JOIN public.identifications i ON i.observation_id = o.id AND i.is_primary = true
    WHERE o.id = p_id
  )
  SELECT CASE WHEN o.id IS NULL THEN NULL ELSE jsonb_build_object(
    'kind',          'observation',
    'id',            o.id::text,
    'label',         coalesce(o.scientific_name, '—')
                     || ' · ' || to_char(o.observed_at, 'Mon DD')
                     || coalesce(' · ' || o.state_province, ''),
    'summary_text',
      'Observation of ' || coalesce(o.scientific_name, 'unknown taxon')
      || coalesce(' (' || o.common_name_en || ')', '')
      || ' on ' || to_char(o.observed_at, 'YYYY-MM-DD')
      || coalesce(' in ' || o.state_province, '')
      || CASE WHEN o.is_research_grade THEN '. Research grade.' ELSE '. Needs review.' END
      || coalesce(' Observer notes: ' || left(o.notes, 240), ''),
    'fields',        jsonb_build_object(
      'scientific_name', o.scientific_name,
      'common_name_en',  o.common_name_en,
      'common_name_es',  o.common_name_es,
      'kingdom',         o.kingdom,
      'family',          o.family,
      'observed_at',     o.observed_at,
      'state_province',  o.state_province,
      'is_research_grade', o.is_research_grade,
      'obscure_level',   o.obscure_level,
      'lat', CASE WHEN auth.uid() = o.observer_id
                  THEN ST_Y(o.location::geometry)
                  ELSE ST_Y(coalesce(o.location_obscured, o.location)::geometry) END,
      'lng', CASE WHEN auth.uid() = o.observer_id
                  THEN ST_X(o.location::geometry)
                  ELSE ST_X(coalesce(o.location_obscured, o.location)::geometry) END,
      'coords_obscured', (auth.uid() IS DISTINCT FROM o.observer_id AND o.location_obscured IS NOT NULL)
    ),
    'suggested_questions', jsonb_build_array(
      '¿Por qué esta observación ' || CASE WHEN o.is_research_grade THEN 'es grado de investigación' ELSE 'necesita revisión' END || '?',
      '¿Qué otras observaciones de esta especie hay cerca?',
      'Contame sobre ' || coalesce(o.scientific_name, 'esta especie') || '.'
    ),
    'related',       jsonb_build_object(
      'primary_taxon_id', o.primary_taxon_id::text,
      'observer_id',      o.observer_id::text
    )
  ) END
  FROM o;
$$;

-- 2. Species card
DROP FUNCTION IF EXISTS public.chat_species_card(text);
CREATE FUNCTION public.chat_species_card(p_query text)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $$
  WITH t AS (
    SELECT id, scientific_name, canonical_name, common_name_es, common_name_en,
           kingdom, family, nom059_status, cites_appendix, iucn_category, is_endemic_mexico,
           description_es, description_en, obscure_level
    FROM public.taxa
    WHERE id::text = p_query
       OR canonical_name ILIKE p_query
       OR scientific_name ILIKE p_query
    ORDER BY canonical_name
    LIMIT 1
  )
  SELECT CASE WHEN t.id IS NULL THEN NULL ELSE jsonb_build_object(
    'kind',          'species',
    'id',            t.id::text,
    'label',         t.scientific_name,
    'summary_text',
      coalesce(t.scientific_name, '')
      || coalesce(' (' || t.common_name_en || ')', '')
      || ' — ' || coalesce(t.kingdom, '?') || ' / ' || coalesce(t.family, '?')
      || coalesce('. NOM-059: ' || t.nom059_status, '')
      || coalesce('. CITES: ' || t.cites_appendix, '')
      || coalesce('. IUCN: ' || t.iucn_category, '')
      || coalesce('. ' || left(t.description_en, 240), ''),
    'fields',        jsonb_build_object(
      'scientific_name',     t.scientific_name,
      'common_name_en',      t.common_name_en,
      'common_name_es',      t.common_name_es,
      'kingdom',             t.kingdom,
      'family',              t.family,
      'nom059_status',       t.nom059_status,
      'cites_appendix',      t.cites_appendix,
      'iucn_category',       t.iucn_category,
      'is_endemic_mexico',   t.is_endemic_mexico,
      'obscure_level',       t.obscure_level
    ),
    'suggested_questions', jsonb_build_array(
      '¿Dónde en Argentina se suele observar ' || t.scientific_name || '?',
      '¿Qué estado de conservación tiene ' || t.scientific_name || '?',
      'Mostrame observaciones recientes de esta especie.'
    ),
    'related',       jsonb_build_object(
      'primary_taxon_id', t.id::text
    )
  ) END
  FROM t;
$$;

-- 3. Project card
DROP FUNCTION IF EXISTS public.chat_project_card(text);
CREATE FUNCTION public.chat_project_card(p_query text)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $$
  WITH p AS (
    SELECT id, slug, name, name_es, description, description_es, visibility,
           ST_Area(boundary::geography) / 1000000.0 AS area_km2
    FROM public.projects
    WHERE id::text = p_query OR slug = p_query
    LIMIT 1
  ),
  c AS (
    SELECT count(*)::bigint AS obs_count
    FROM public.project_observations po
    JOIN p ON p.id = po.project_id
  )
  SELECT CASE WHEN p.id IS NULL THEN NULL ELSE jsonb_build_object(
    'kind',          'project',
    'id',            p.id::text,
    'label',         coalesce(p.name_es, p.name),
    'summary_text',
      'Project "' || coalesce(p.name_es, p.name) || '" (' || p.slug || ')'
      || coalesce('. ' || left(coalesce(p.description_es, p.description), 200), '')
      || '. ' || c.obs_count || ' observations, area: '
      || round(coalesce(p.area_km2, 0)::numeric, 1) || ' km².',
    'fields',        jsonb_build_object(
      'slug',         p.slug,
      'name',         p.name,
      'name_es',      p.name_es,
      'description',    p.description,
      'description_es', p.description_es,
      'visibility',   p.visibility,
      'area_km2',     p.area_km2,
      'obs_count',    c.obs_count
    ),
    'suggested_questions', jsonb_build_array(
      '¿Qué especies son más comunes en este proyecto?',
      '¿Cuántas observaciones se sumaron en los últimos 30 días?',
      'Listá las estaciones de cámaras de este proyecto.'
    ),
    'related',       jsonb_build_object(
      'project_id', p.id::text
    )
  ) END
  FROM p, c;
$$;

-- 4. Camera station card
DROP FUNCTION IF EXISTS public.chat_camera_station_card(uuid);
CREATE FUNCTION public.chat_camera_station_card(p_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $$
  WITH s AS (
    SELECT cs.id, cs.project_id, cs.station_key, cs.name, cs.habitat,
           cs.camera_model, cs.notes, cs.coords,
           p.name AS project_name, p.slug AS project_slug
    FROM public.camera_stations cs
    LEFT JOIN public.projects p ON p.id = cs.project_id
    WHERE cs.id = p_id
  ),
  pn AS (
    SELECT coalesce(public.station_trap_nights(s.id), 0) AS trap_nights
    FROM s
  )
  SELECT CASE WHEN s.id IS NULL THEN NULL ELSE jsonb_build_object(
    'kind',          'camera_station',
    'id',            s.id::text,
    'label',         coalesce(s.name, s.station_key),
    'summary_text',
      'Camera station ' || s.station_key
      || coalesce(' (' || s.name || ')', '')
      || coalesce(' in project "' || s.project_name || '"', '')
      || coalesce(', habitat: ' || s.habitat, '')
      || coalesce(', camera: ' || s.camera_model, '')
      || '. Trap-nights to date: ' || pn.trap_nights || '.',
    'fields',        jsonb_build_object(
      'station_key',  s.station_key,
      'name',         s.name,
      'habitat',      s.habitat,
      'camera_model', s.camera_model,
      'project_slug', s.project_slug,
      'trap_nights',  pn.trap_nights,
      'lat',          ST_Y(s.coords::geometry),
      'lng',          ST_X(s.coords::geometry)
    ),
    'suggested_questions', jsonb_build_array(
      '¿Qué especies se detectaron en esta estación?',
      '¿Cuál es la tasa de detección por cada 100 noches-trampa?',
      '¿Cuánto tiempo lleva activa esta estación?'
    ),
    'related',       jsonb_build_object(
      'project_id', s.project_id::text
    )
  ) END
  FROM s, pn;
$$;

-- 5. Observer card
DROP FUNCTION IF EXISTS public.chat_observer_card(uuid);
CREATE FUNCTION public.chat_observer_card(p_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $$
  WITH u AS (
    SELECT id, username, display_name, avatar_url, country_code,
           is_expert, expert_taxa,
           observation_count, species_count, obs_count_30d,
           last_observation_at, joined_at, karma_total
    FROM public.community_observers
    WHERE id = p_id
  )
  SELECT CASE WHEN u.id IS NULL THEN NULL ELSE jsonb_build_object(
    'kind',          'observer',
    'id',            u.id::text,
    'label',         coalesce(u.display_name, u.username),
    'thumbnail',     u.avatar_url,
    'summary_text',
      coalesce(u.display_name, u.username)
      || coalesce(' (@' || u.username || ')', '')
      || coalesce(' from ' || u.country_code, '')
      || '. ' || u.observation_count || ' observations, '
      || u.species_count || ' species, '
      || u.karma_total || ' karma.'
      || CASE WHEN u.is_expert THEN ' Expert.' ELSE '' END,
    'fields',        jsonb_build_object(
      'username',          u.username,
      'display_name',      u.display_name,
      'country_code',      u.country_code,
      'is_expert',         u.is_expert,
      'observation_count', u.observation_count,
      'species_count',     u.species_count,
      'obs_count_30d',     u.obs_count_30d,
      'karma_total',       u.karma_total
    ),
    'suggested_questions', jsonb_build_array(
      '¿Qué especies observa más ' || coalesce(u.display_name, u.username) || '?',
      '¿Cuándo estuvo más activo?',
      '¿En qué región suele observar?'
    ),
    'related',       jsonb_build_object(
      'observer_id', u.id::text
    )
  ) END
  FROM u;
$$;

-- 6. Self profile card
DROP FUNCTION IF EXISTS public.chat_self_profile_card(uuid);
CREATE FUNCTION public.chat_self_profile_card(p_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public, extensions, pg_temp
AS $$
  WITH u AS (
    SELECT id, username, display_name, bio, avatar_url, preferred_lang,
           is_expert, expert_taxa, observer_license,
           observation_count, country_code, region_primary,
           karma_total, joined_at, last_observation_at
    FROM public.users
    WHERE id = p_id
      AND id = auth.uid()
  )
  SELECT CASE WHEN u.id IS NULL THEN NULL ELSE jsonb_build_object(
    'kind',          'self_profile',
    'id',            u.id::text,
    'label',         coalesce(u.display_name, u.username, 'You'),
    'thumbnail',     u.avatar_url,
    'summary_text',
      'Your profile: ' || coalesce(u.display_name, u.username)
      || coalesce(', based in ' || u.country_code, '')
      || '. ' || u.observation_count || ' observations, '
      || u.karma_total || ' karma.'
      || coalesce(' Bio: ' || left(u.bio, 200), '')
      || ' Preferred language: ' || coalesce(u.preferred_lang, 'en') || '.',
    'fields',        jsonb_build_object(
      'username',           u.username,
      'display_name',       u.display_name,
      'preferred_lang',     u.preferred_lang,
      'country_code',       u.country_code,
      'region_primary',     u.region_primary,
      'is_expert',          u.is_expert,
      'expert_taxa',        u.expert_taxa,
      'observer_license',   u.observer_license,
      'observation_count',  u.observation_count,
      'karma_total',        u.karma_total
    ),
    'suggested_questions', jsonb_build_array(
      '¿Cuándo una observación es primaria?',
      '¿Qué insignias me faltan por ganar?',
      'Mostrame mis últimas 10 observaciones.'
    ),
    'related',       jsonb_build_object(
      'observer_id', u.id::text
    )
  ) END
  FROM u;
$$;

GRANT EXECUTE ON FUNCTION public.chat_obs_card(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.chat_species_card(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.chat_project_card(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.chat_camera_station_card(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.chat_observer_card(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.chat_self_profile_card(uuid) TO authenticated;
