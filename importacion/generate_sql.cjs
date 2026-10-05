const fs = require('fs');

const csv = fs.readFileSync('C:/com/importacion/obs.csv', 'utf8');
const lines = csv.trim().split('\n');
const headers = lines[0].split(',');

// We need the user ID for @libre_choique_889. 
// We will use a DO block in SQL to lookup the user ID.

let sql = `
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

`;

function parseCoord(str) {
  // str looks like "-322,319,019,491" or "-581,067,316,979"
  // Remove quotes and commas
  const clean = str.replace(/"/g, '').replace(/,/g, '');
  // It's always negative for Argentina (S, W).
  // E.g. -322319019491 -> -32.2319019491
  // We know latitude is ~ -32, longitude is ~ -58.
  // So we insert the decimal point after the first 3 characters (e.g. "-32")
  return clean.slice(0, 3) + '.' + clean.slice(3);
}

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;
  
  // Parse CSV line properly (handling quotes)
  const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
  let matches = [];
  let match;
  while ((match = regex.exec(line)) !== null) {
      matches.push(match[1]);
  }
  // Let's just split by basic logic for this specific file, or use the values directly:
  const cols = [];
  let inQuote = false;
  let current = '';
  for(let char of line) {
      if(char === '"') {
          inQuote = !inQuote;
      } else if(char === ',' && !inQuote) {
          cols.push(current);
          current = '';
      } else {
          current += char;
      }
  }
  cols.push(current);

  const observed_on = cols[0];
  const image_url = cols[4];
  const lat_raw = cols[7];
  const lng_raw = cols[8];
  const scientific_name = cols[10];
  const common_name = cols[11];
  
  const lat = parseCoord(lat_raw);
  const lng = parseCoord(lng_raw);
  
  // Create observation
  sql += `
  -- Observation ${i}
  INSERT INTO public.observations (
    observer_id,
    location,
    observed_at,
    evidence_type,
    sync_status,
    app_version
  ) VALUES (
    v_user_id,
    'SRID=4326;POINT(${lng} ${lat})',
    '${observed_on}T12:00:00Z',
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
    '${image_url}',
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
    '${scientific_name.replace(/'/g, "''")}',
    'human',
    1.0
  );
`;
}

sql += `
END $$;
`;

fs.writeFileSync('C:/com/importacion/import.sql', sql);
console.log('Generated import.sql successfully!');
