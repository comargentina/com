const fs = require('fs');
const xlsx = require('xlsx');

const wb = xlsx.readFile('C:/com/importacion/ana observations-795779.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];

function parseCoord(val, prefix) {
  if (typeof val === 'number') {
    let s = String(val);
    if (s.startsWith('-')) {
      s = s.substring(1);
      // If prefix is '32'
      if (s.startsWith(prefix)) {
        return '-' + prefix + '.' + s.substring(prefix.length);
      }
    }
    return String(val);
  }
  return String(val);
}

const observations = [];
for (let r = 2; r <= 7; r++) {
  const getCell = (col) => ws[col + r];
  const dateCell = getCell('A');
  const userLogin = getCell('B')?.v || 'anahiecha@gmail.com';
  const userName = getCell('C')?.v || 'Anahí Echazarreta';
  const license = 'CC BY-NC 4.0';
  const imageUrl = getCell('E')?.v;
  const placeGuess = getCell('G')?.v || 'Colón, Entre Ríos, Argentina';
  const latRaw = getCell('H')?.v;
  const lngRaw = getCell('I')?.v;
  const speciesGuess = getCell('J')?.v;
  const scientificName = getCell('K')?.v;
  const commonName = getCell('L')?.v;

  const lat = parseCoord(latRaw, '32');
  const lng = parseCoord(lngRaw, '58');
  const observedAt = dateCell?.w || '2026-05-01';

  observations.push({
    observedAt,
    userLogin,
    userName,
    license,
    imageUrl,
    placeGuess,
    lat,
    lng,
    speciesGuess,
    scientificName,
    commonName,
  });
}

console.log('Parsed', observations.length, 'observations:');
observations.forEach((o, i) => {
  console.log(`${i+1}: ${o.scientificName} (${o.commonName}) - Date: ${o.observedAt} - Lat: ${o.lat}, Lng: ${o.lng}`);
});

// Taxa metadata for these 5 butterflies
const taxaMap = {
  'Marpesia petreus': {
    genus: 'Marpesia',
    epithet: 'petreus',
    family: 'Nymphalidae',
    common_name_es: 'Daga Naranja',
    common_name_en: 'Ruddy Daggerwing'
  },
  'Euptoieta hortensia': {
    genus: 'Euptoieta',
    epithet: 'hortensia',
    family: 'Nymphalidae',
    common_name_es: 'Mariposa Hortensia',
    common_name_en: 'Mexican Fritillary'
  },
  'Anartia jatrophae': {
    genus: 'Anartia',
    epithet: 'jatrophae',
    family: 'Nymphalidae',
    common_name_es: 'Cenicienta',
    common_name_en: 'White Peacock'
  },
  'Diaethria candrena': {
    genus: 'Diaethria',
    epithet: 'candrena',
    family: 'Nymphalidae',
    common_name_es: 'Ochenta Chica',
    common_name_en: 'Candrena Eighty-Eight'
  },
  'Eurema albula': {
    genus: 'Eurema',
    epithet: 'albula',
    family: 'Pieridae',
    common_name_es: 'Blanquita',
    common_name_en: 'Ghost Yellow'
  }
};

let sql = `-- =====================================================================
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
`;

Object.entries(taxaMap).forEach(([sci, info]) => {
  sql += `
  IF NOT EXISTS (SELECT 1 FROM public.taxa WHERE scientific_name = '${sci}') THEN
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
      '${sci}',
      '${sci}',
      'species',
      'Animalia',
      'Arthropoda',
      'Insecta',
      'Lepidoptera',
      '${info.family}',
      '${info.genus}',
      '${info.epithet}',
      '${info.common_name_es}',
      '${info.common_name_en}',
      'none'
    );
  END IF;
`;
});

sql += `
  -- ─── 4. Insertar observaciones, identificaciones y fotos ───────────
`;

observations.forEach((o, idx) => {
  sql += `
  -- Observación #${idx + 1}: ${o.scientificName}
  IF NOT EXISTS (
    SELECT 1 FROM public.media_files mf
    JOIN public.observations o ON o.id = mf.observation_id
    WHERE o.observer_id = v_user_id AND mf.url = '${o.imageUrl}'
  ) THEN
    v_obs_id := gen_random_uuid();
    SELECT id INTO v_taxon_id FROM public.taxa WHERE scientific_name = '${o.scientificName}' LIMIT 1;

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
      '${o.observedAt} 14:00:00+00'::timestamptz,
      ST_SetSRID(ST_MakePoint(${o.lng}, ${o.lat}), 4326)::geography,
      'gps',
      'Entre Ríos',
      'Colón',
      v_taxon_id,
      'none',
      'CC BY-NC 4.0',
      'synced',
      'Avistamiento en ${o.placeGuess}',
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
      '${o.scientificName}',
      0.9,
      'human',
      true,
      false,
      NULL,
      NULL,
      '${o.observedAt} 14:00:00+00'::timestamptz
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
      '${o.imageUrl}',
      '${o.scientificName.toLowerCase().replace(/\\s+/g, '_')}.jpg',
      true,
      0
    );
  END IF;
`;
});

sql += `
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
`;

fs.writeFileSync('C:/com/scripts/import-ana-observations.sql', sql, 'utf8');
console.log('Successfully written C:/com/scripts/import-ana-observations.sql');
