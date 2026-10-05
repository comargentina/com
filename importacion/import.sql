
DO $$
DECLARE
  v_user_id uuid;
  v_obs_id uuid;
BEGIN
  -- Look up the user
  SELECT id INTO v_user_id FROM public.users WHERE username = 'libre_choique_889';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario libre_choique_889 no encontrado.';
  END IF;


  -- Observation 1
  INSERT INTO public.observations (
    observer_id,
    location,
    observed_at,
    evidence_type,
    sync_status,
    app_version
  ) VALUES (
    v_user_id,
    'SRID=4326;POINT(-58.140206682 -32.2319019491)',
    '2015-03-26T12:00:00Z',
    'direct_sighting',
    'synced',
    'import_script'
  ) RETURNING id INTO v_obs_id;

  INSERT INTO public.media_files (
    observation_id,
    url,
    media_type,
    is_primary
  ) VALUES (
    v_obs_id,
    'https://inaturalist-open-data.s3.amazonaws.com/photos/643202109/medium.jpg',
    'photo',
    true
  );

  INSERT INTO public.identifications (
    observation_id,
    scientific_name,
    source,
    confidence
  ) VALUES (
    v_obs_id,
    'Marpesia petreus',
    'human',
    1.0
  );

  -- Observation 2
  INSERT INTO public.observations (
    observer_id,
    location,
    observed_at,
    evidence_type,
    sync_status,
    app_version
  ) VALUES (
    v_user_id,
    'SRID=4326;POINT(-58.1067316979 -32.2645115921)',
    '2026-05-03T12:00:00Z',
    'direct_sighting',
    'synced',
    'import_script'
  ) RETURNING id INTO v_obs_id;

  INSERT INTO public.media_files (
    observation_id,
    url,
    media_type,
    is_primary
  ) VALUES (
    v_obs_id,
    'https://inaturalist-open-data.s3.amazonaws.com/photos/653318520/medium.jpg',
    'photo',
    true
  );

  INSERT INTO public.identifications (
    observation_id,
    scientific_name,
    source,
    confidence
  ) VALUES (
    v_obs_id,
    'Euptoieta hortensia',
    'human',
    1.0
  );

  -- Observation 3
  INSERT INTO public.observations (
    observer_id,
    location,
    observed_at,
    evidence_type,
    sync_status,
    app_version
  ) VALUES (
    v_user_id,
    'SRID=4326;POINT(-58.1073318422 -32.2643996067)',
    '2026-05-03T12:00:00Z',
    'direct_sighting',
    'synced',
    'import_script'
  ) RETURNING id INTO v_obs_id;

  INSERT INTO public.media_files (
    observation_id,
    url,
    media_type,
    is_primary
  ) VALUES (
    v_obs_id,
    'https://inaturalist-open-data.s3.amazonaws.com/photos/653325507/medium.jpg',
    'photo',
    true
  );

  INSERT INTO public.identifications (
    observation_id,
    scientific_name,
    source,
    confidence
  ) VALUES (
    v_obs_id,
    'Anartia jatrophae',
    'human',
    1.0
  );

  -- Observation 4
  INSERT INTO public.observations (
    observer_id,
    location,
    observed_at,
    evidence_type,
    sync_status,
    app_version
  ) VALUES (
    v_user_id,
    'SRID=4326;POINT(-58.1418495 -32.2128295833)',
    '2026-05-29T12:00:00Z',
    'direct_sighting',
    'synced',
    'import_script'
  ) RETURNING id INTO v_obs_id;

  INSERT INTO public.media_files (
    observation_id,
    url,
    media_type,
    is_primary
  ) VALUES (
    v_obs_id,
    'https://inaturalist-open-data.s3.amazonaws.com/photos/672465071/medium.jpg',
    'photo',
    true
  );

  INSERT INTO public.identifications (
    observation_id,
    scientific_name,
    source,
    confidence
  ) VALUES (
    v_obs_id,
    'Anartia jatrophae',
    'human',
    1.0
  );

  -- Observation 5
  INSERT INTO public.observations (
    observer_id,
    location,
    observed_at,
    evidence_type,
    sync_status,
    app_version
  ) VALUES (
    v_user_id,
    'SRID=4326;POINT(-58.1866226111 -32.17983625)',
    '2026-07-31T12:00:00Z',
    'direct_sighting',
    'synced',
    'import_script'
  ) RETURNING id INTO v_obs_id;

  INSERT INTO public.media_files (
    observation_id,
    url,
    media_type,
    is_primary
  ) VALUES (
    v_obs_id,
    'https://inaturalist-open-data.s3.amazonaws.com/photos/708685621/medium.jpg',
    'photo',
    true
  );

  INSERT INTO public.identifications (
    observation_id,
    scientific_name,
    source,
    confidence
  ) VALUES (
    v_obs_id,
    'Diaethria candrena',
    'human',
    1.0
  );

END $$;
