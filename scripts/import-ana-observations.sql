-- =====================================================================
-- IMPORTACIÓN DE OBSERVACIONES DESDE EXCEL
-- Usuario: anahiecha@gmail.com (Anahí Echazarreta)
-- Archivo: ana observations-795779.xlsx
--
-- Ejecutar este script en Supabase SQL Editor:
-- https://supabase.com/dashboard/project/sjpbxzppwtfvinqnubqh/sql/new
-- =====================================================================

DO $$
DECLARE
  v_user_id uuid;
  v_obs_id  uuid;
  v_taxon_id uuid;
BEGIN
  -- ─── 1. Asegurar usuario en auth.users ─────────────────────────────
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'anahiecha@gmail.com';

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'anahiecha@gmail.com',
      crypt('Temporal123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Anahí Echazarreta","name":"Anahí Echazarreta"}',
      now(),
      now()
    );
  END IF;

  -- ─── 2. Asegurar perfil en public.users ────────────────────────────
  INSERT INTO public.users (
    id,
    username,
    display_name,
    preferred_lang,
    observer_license,
    profile_public,
    gamification_opt_in,
    country_code,
    region_primary,
    joined_at
  ) VALUES (
    v_user_id,
    'anahiecha',
    'Anahí Echazarreta',
    'es',
    'CC BY-NC 4.0',
    true,
    true,
    'AR',
    'Entre Ríos',
    '2015-03-26 12:00:00+00'
  )
  ON CONFLICT (id) DO UPDATE SET
    username     = COALESCE(public.users.username, 'anahiecha'),
    display_name = 'Anahí Echazarreta',
    region_primary = 'Entre Ríos',
    country_code = 'AR';

  -- ─── 3. Insertar taxa (especies de mariposas) ──────────────────────

  IF NOT EXISTS (SELECT 1 FROM public.taxa WHERE scientific_name = 'Marpesia petreus') THEN
    INSERT INTO public.taxa (
      scientific_name,
      canonical_name,
      taxon_rank,
      kingdom,
      phylum,
      class,
      "order",
      family,
      genus,
      specific_epithet,
      common_name_es,
      common_name_en,
      obscure_level
    ) VALUES (
      'Marpesia petreus',
      'Marpesia petreus',
      'species',
      'Animalia',
      'Arthropoda',
      'Insecta',
      'Lepidoptera',
      'Nymphalidae',
      'Marpesia',
      'petreus',
      'Daga Naranja',
      'Ruddy Daggerwing',
      'none'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.taxa WHERE scientific_name = 'Euptoieta hortensia') THEN
    INSERT INTO public.taxa (
      scientific_name,
      canonical_name,
      taxon_rank,
      kingdom,
      phylum,
      class,
      "order",
      family,
      genus,
      specific_epithet,
      common_name_es,
      common_name_en,
      obscure_level
    ) VALUES (
      'Euptoieta hortensia',
      'Euptoieta hortensia',
      'species',
      'Animalia',
      'Arthropoda',
      'Insecta',
      'Lepidoptera',
      'Nymphalidae',
      'Euptoieta',
      'hortensia',
      'Mariposa Hortensia',
      'Mexican Fritillary',
      'none'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.taxa WHERE scientific_name = 'Anartia jatrophae') THEN
    INSERT INTO public.taxa (
      scientific_name,
      canonical_name,
      taxon_rank,
      kingdom,
      phylum,
      class,
      "order",
      family,
      genus,
      specific_epithet,
      common_name_es,
      common_name_en,
      obscure_level
    ) VALUES (
      'Anartia jatrophae',
      'Anartia jatrophae',
      'species',
      'Animalia',
      'Arthropoda',
      'Insecta',
      'Lepidoptera',
      'Nymphalidae',
      'Anartia',
      'jatrophae',
      'Cenicienta',
      'White Peacock',
      'none'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.taxa WHERE scientific_name = 'Diaethria candrena') THEN
    INSERT INTO public.taxa (
      scientific_name,
      canonical_name,
      taxon_rank,
      kingdom,
      phylum,
      class,
      "order",
      family,
      genus,
      specific_epithet,
      common_name_es,
      common_name_en,
      obscure_level
    ) VALUES (
      'Diaethria candrena',
      'Diaethria candrena',
      'species',
      'Animalia',
      'Arthropoda',
      'Insecta',
      'Lepidoptera',
      'Nymphalidae',
      'Diaethria',
      'candrena',
      'Ochenta Chica',
      'Candrena Eighty-Eight',
      'none'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.taxa WHERE scientific_name = 'Eurema albula') THEN
    INSERT INTO public.taxa (
      scientific_name,
      canonical_name,
      taxon_rank,
      kingdom,
      phylum,
      class,
      "order",
      family,
      genus,
      specific_epithet,
      common_name_es,
      common_name_en,
      obscure_level
    ) VALUES (
      'Eurema albula',
      'Eurema albula',
      'species',
      'Animalia',
      'Arthropoda',
      'Insecta',
      'Lepidoptera',
      'Pieridae',
      'Eurema',
      'albula',
      'Blanquita',
      'Ghost Yellow',
      'none'
    );
  END IF;

  -- ─── 4. Insertar observaciones, identificaciones y fotos ───────────

  -- Observación #1: Marpesia petreus
  IF NOT EXISTS (
    SELECT 1 FROM public.media_files mf
    JOIN public.observations o ON o.id = mf.observation_id
    WHERE o.observer_id = v_user_id AND mf.url = 'https://inaturalist-open-data.s3.amazonaws.com/photos/643202109/medium.jpg'
  ) THEN
    v_obs_id := gen_random_uuid();
    SELECT id INTO v_taxon_id FROM public.taxa WHERE scientific_name = 'Marpesia petreus' LIMIT 1;

    INSERT INTO public.observations (
      id,
      observer_id,
      observed_at,
      location,
      location_source,
      state_province,
      locality,
      primary_taxon_id,
      obscure_level,
      license,
      sync_status,
      notes,
      created_at,
      updated_at
    ) VALUES (
      v_obs_id,
      v_user_id,
      '2015-03-26 14:00:00+00'::timestamptz,
      ST_SetSRID(ST_MakePoint(-58.140206682, -32.2319019491), 4326)::geography,
      'gps',
      'Entre Ríos',
      'Colón',
      v_taxon_id,
      'none',
      'CC BY-NC 4.0',
      'synced',
      'Avistamiento en Colón, Entre Ríos, Argentina',
      now(),
      now()
    );

    INSERT INTO public.identifications (
      observation_id,
      taxon_id,
      scientific_name,
      confidence,
      source,
      is_primary,
      is_research_grade,
      validated_by,
      validated_at,
      created_at
    ) VALUES (
      v_obs_id,
      v_taxon_id,
      'Marpesia petreus',
      0.9,
      'human',
      true,
      false,
      NULL,
      NULL,
      '2015-03-26 14:00:00+00'::timestamptz
    );

    INSERT INTO public.media_files (
      observation_id,
      media_type,
      url,
      original_filename,
      is_primary,
      sort_order
    ) VALUES (
      v_obs_id,
      'photo',
      'https://inaturalist-open-data.s3.amazonaws.com/photos/643202109/medium.jpg',
      'marpesia petreus.jpg',
      true,
      0
    );
  END IF;

  -- Observación #2: Euptoieta hortensia
  IF NOT EXISTS (
    SELECT 1 FROM public.media_files mf
    JOIN public.observations o ON o.id = mf.observation_id
    WHERE o.observer_id = v_user_id AND mf.url = 'https://inaturalist-open-data.s3.amazonaws.com/photos/653318520/medium.jpg'
  ) THEN
    v_obs_id := gen_random_uuid();
    SELECT id INTO v_taxon_id FROM public.taxa WHERE scientific_name = 'Euptoieta hortensia' LIMIT 1;

    INSERT INTO public.observations (
      id,
      observer_id,
      observed_at,
      location,
      location_source,
      state_province,
      locality,
      primary_taxon_id,
      obscure_level,
      license,
      sync_status,
      notes,
      created_at,
      updated_at
    ) VALUES (
      v_obs_id,
      v_user_id,
      '2026-05-03 14:00:00+00'::timestamptz,
      ST_SetSRID(ST_MakePoint(-58.1067316979, -32.2645115921), 4326)::geography,
      'gps',
      'Entre Ríos',
      'Colón',
      v_taxon_id,
      'none',
      'CC BY-NC 4.0',
      'synced',
      'Avistamiento en Colón, Entre Ríos, Argentina',
      now(),
      now()
    );

    INSERT INTO public.identifications (
      observation_id,
      taxon_id,
      scientific_name,
      confidence,
      source,
      is_primary,
      is_research_grade,
      validated_by,
      validated_at,
      created_at
    ) VALUES (
      v_obs_id,
      v_taxon_id,
      'Euptoieta hortensia',
      0.9,
      'human',
      true,
      false,
      NULL,
      NULL,
      '2026-05-03 14:00:00+00'::timestamptz
    );

    INSERT INTO public.media_files (
      observation_id,
      media_type,
      url,
      original_filename,
      is_primary,
      sort_order
    ) VALUES (
      v_obs_id,
      'photo',
      'https://inaturalist-open-data.s3.amazonaws.com/photos/653318520/medium.jpg',
      'euptoieta hortensia.jpg',
      true,
      0
    );
  END IF;

  -- Observación #3: Anartia jatrophae
  IF NOT EXISTS (
    SELECT 1 FROM public.media_files mf
    JOIN public.observations o ON o.id = mf.observation_id
    WHERE o.observer_id = v_user_id AND mf.url = 'https://inaturalist-open-data.s3.amazonaws.com/photos/653325507/medium.jpg'
  ) THEN
    v_obs_id := gen_random_uuid();
    SELECT id INTO v_taxon_id FROM public.taxa WHERE scientific_name = 'Anartia jatrophae' LIMIT 1;

    INSERT INTO public.observations (
      id,
      observer_id,
      observed_at,
      location,
      location_source,
      state_province,
      locality,
      primary_taxon_id,
      obscure_level,
      license,
      sync_status,
      notes,
      created_at,
      updated_at
    ) VALUES (
      v_obs_id,
      v_user_id,
      '2026-05-03 14:00:00+00'::timestamptz,
      ST_SetSRID(ST_MakePoint(-58.1073318422, -32.2643996067), 4326)::geography,
      'gps',
      'Entre Ríos',
      'Colón',
      v_taxon_id,
      'none',
      'CC BY-NC 4.0',
      'synced',
      'Avistamiento en Colón, Entre Ríos, Argentina',
      now(),
      now()
    );

    INSERT INTO public.identifications (
      observation_id,
      taxon_id,
      scientific_name,
      confidence,
      source,
      is_primary,
      is_research_grade,
      validated_by,
      validated_at,
      created_at
    ) VALUES (
      v_obs_id,
      v_taxon_id,
      'Anartia jatrophae',
      0.9,
      'human',
      true,
      false,
      NULL,
      NULL,
      '2026-05-03 14:00:00+00'::timestamptz
    );

    INSERT INTO public.media_files (
      observation_id,
      media_type,
      url,
      original_filename,
      is_primary,
      sort_order
    ) VALUES (
      v_obs_id,
      'photo',
      'https://inaturalist-open-data.s3.amazonaws.com/photos/653325507/medium.jpg',
      'anartia jatrophae.jpg',
      true,
      0
    );
  END IF;

  -- Observación #4: Anartia jatrophae
  IF NOT EXISTS (
    SELECT 1 FROM public.media_files mf
    JOIN public.observations o ON o.id = mf.observation_id
    WHERE o.observer_id = v_user_id AND mf.url = 'https://inaturalist-open-data.s3.amazonaws.com/photos/672465071/medium.jpg'
  ) THEN
    v_obs_id := gen_random_uuid();
    SELECT id INTO v_taxon_id FROM public.taxa WHERE scientific_name = 'Anartia jatrophae' LIMIT 1;

    INSERT INTO public.observations (
      id,
      observer_id,
      observed_at,
      location,
      location_source,
      state_province,
      locality,
      primary_taxon_id,
      obscure_level,
      license,
      sync_status,
      notes,
      created_at,
      updated_at
    ) VALUES (
      v_obs_id,
      v_user_id,
      '2026-05-29 14:00:00+00'::timestamptz,
      ST_SetSRID(ST_MakePoint(-58.1418495, -32.2128295833), 4326)::geography,
      'gps',
      'Entre Ríos',
      'Colón',
      v_taxon_id,
      'none',
      'CC BY-NC 4.0',
      'synced',
      'Avistamiento en Colón, Entre Ríos, Argentina',
      now(),
      now()
    );

    INSERT INTO public.identifications (
      observation_id,
      taxon_id,
      scientific_name,
      confidence,
      source,
      is_primary,
      is_research_grade,
      validated_by,
      validated_at,
      created_at
    ) VALUES (
      v_obs_id,
      v_taxon_id,
      'Anartia jatrophae',
      0.9,
      'human',
      true,
      false,
      NULL,
      NULL,
      '2026-05-29 14:00:00+00'::timestamptz
    );

    INSERT INTO public.media_files (
      observation_id,
      media_type,
      url,
      original_filename,
      is_primary,
      sort_order
    ) VALUES (
      v_obs_id,
      'photo',
      'https://inaturalist-open-data.s3.amazonaws.com/photos/672465071/medium.jpg',
      'anartia jatrophae.jpg',
      true,
      0
    );
  END IF;

  -- Observación #5: Diaethria candrena
  IF NOT EXISTS (
    SELECT 1 FROM public.media_files mf
    JOIN public.observations o ON o.id = mf.observation_id
    WHERE o.observer_id = v_user_id AND mf.url = 'https://inaturalist-open-data.s3.amazonaws.com/photos/708685621/medium.jpg'
  ) THEN
    v_obs_id := gen_random_uuid();
    SELECT id INTO v_taxon_id FROM public.taxa WHERE scientific_name = 'Diaethria candrena' LIMIT 1;

    INSERT INTO public.observations (
      id,
      observer_id,
      observed_at,
      location,
      location_source,
      state_province,
      locality,
      primary_taxon_id,
      obscure_level,
      license,
      sync_status,
      notes,
      created_at,
      updated_at
    ) VALUES (
      v_obs_id,
      v_user_id,
      '2026-07-31 14:00:00+00'::timestamptz,
      ST_SetSRID(ST_MakePoint(-58.1866226111, -32.17983625), 4326)::geography,
      'gps',
      'Entre Ríos',
      'Colón',
      v_taxon_id,
      'none',
      'CC BY-NC 4.0',
      'synced',
      'Avistamiento en E3283, Entre Ríos, Argentina',
      now(),
      now()
    );

    INSERT INTO public.identifications (
      observation_id,
      taxon_id,
      scientific_name,
      confidence,
      source,
      is_primary,
      is_research_grade,
      validated_by,
      validated_at,
      created_at
    ) VALUES (
      v_obs_id,
      v_taxon_id,
      'Diaethria candrena',
      0.9,
      'human',
      true,
      false,
      NULL,
      NULL,
      '2026-07-31 14:00:00+00'::timestamptz
    );

    INSERT INTO public.media_files (
      observation_id,
      media_type,
      url,
      original_filename,
      is_primary,
      sort_order
    ) VALUES (
      v_obs_id,
      'photo',
      'https://inaturalist-open-data.s3.amazonaws.com/photos/708685621/medium.jpg',
      'diaethria candrena.jpg',
      true,
      0
    );
  END IF;

  -- Observación #6: Eurema albula
  IF NOT EXISTS (
    SELECT 1 FROM public.media_files mf
    JOIN public.observations o ON o.id = mf.observation_id
    WHERE o.observer_id = v_user_id AND mf.url = 'https://inaturalist-open-data.s3.amazonaws.com/photos/747438037/medium.jpg'
  ) THEN
    v_obs_id := gen_random_uuid();
    SELECT id INTO v_taxon_id FROM public.taxa WHERE scientific_name = 'Eurema albula' LIMIT 1;

    INSERT INTO public.observations (
      id,
      observer_id,
      observed_at,
      location,
      location_source,
      state_province,
      locality,
      primary_taxon_id,
      obscure_level,
      license,
      sync_status,
      notes,
      created_at,
      updated_at
    ) VALUES (
      v_obs_id,
      v_user_id,
      '2026-10-07 14:00:00+00'::timestamptz,
      ST_SetSRID(ST_MakePoint(-58.1478156944, -32.2080917222), 4326)::geography,
      'gps',
      'Entre Ríos',
      'Colón',
      v_taxon_id,
      'none',
      'CC BY-NC 4.0',
      'synced',
      'Avistamiento en Colón, Entre Ríos, Argentina',
      now(),
      now()
    );

    INSERT INTO public.identifications (
      observation_id,
      taxon_id,
      scientific_name,
      confidence,
      source,
      is_primary,
      is_research_grade,
      validated_by,
      validated_at,
      created_at
    ) VALUES (
      v_obs_id,
      v_taxon_id,
      'Eurema albula',
      0.9,
      'human',
      true,
      false,
      NULL,
      NULL,
      '2026-10-07 14:00:00+00'::timestamptz
    );

    INSERT INTO public.media_files (
      observation_id,
      media_type,
      url,
      original_filename,
      is_primary,
      sort_order
    ) VALUES (
      v_obs_id,
      'photo',
      'https://inaturalist-open-data.s3.amazonaws.com/photos/747438037/medium.jpg',
      'eurema albula.jpg',
      true,
      0
    );
  END IF;

  -- ─── 5. Actualizar contadores del usuario ──────────────────────────
  UPDATE public.users
  SET observation_count = (SELECT count(*) FROM public.observations WHERE observer_id = v_user_id AND sync_status = 'synced'),
      species_count     = (SELECT count(DISTINCT primary_taxon_id) FROM public.observations WHERE observer_id = v_user_id AND sync_status = 'synced'),
      last_observation_at = now(),
      updated_at = now()
  WHERE id = v_user_id;

  RAISE NOTICE 'Importación completada con éxito para usuario % (%)', v_user_id, 'anahiecha@gmail.com';
END $$;

-- ─── 6. Refrescar vistas materializadas para que impacte en la UI ────
REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_platform_stats;
REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_taxon_obs_counts;
REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_user_observation_counts;
REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_recent_species;
REFRESH MATERIALIZED VIEW CONCURRENTLY public.karma_leaderboard_30d;
REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_metrics_percentile;
REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_metrics_percentile_state;

-- ─── 7. Comprobación final ───────────────────────────────────────────
SELECT
  u.username,
  u.display_name,
  u.observation_count,
  u.species_count,
  count(o.id) AS observaciones_reales
FROM public.users u
LEFT JOIN public.observations o ON o.observer_id = u.id
WHERE u.username = 'anahiecha'
GROUP BY u.username, u.display_name, u.observation_count, u.species_count;

SELECT * FROM public.mv_platform_stats;
