/**
 * /api/proxy-image — server-side image proxy for the AI identification flow.
 *
 * External images (e.g. iNaturalist S3) can't be fetched client-side due to
 * CORS. This endpoint proxies them server-to-server so the browser can obtain
 * a blob without CORS errors.
 *
 * Only allow-listed hostnames are proxied to prevent open-proxy abuse.
 */

const ALLOWED_HOSTNAMES = new Set([
  'inaturalist-open-data.s3.amazonaws.com',
  'static.inaturalist.org',
  'inaturalist.org',
  'www.inaturalist.org',
  'media.rastrum.org',
  'reppvlqejgoqvitturxp.supabase.co',
]);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const rawUrl = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
  if (!rawUrl) {
    res.status(400).json({ error: 'Missing url param' });
    return;
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    res.status(400).json({ error: 'Invalid URL' });
    return;
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    res.status(400).json({ error: 'Only http/https URLs allowed' });
    return;
  }

  if (!ALLOWED_HOSTNAMES.has(parsed.hostname)) {
    res.status(403).json({ error: `Origin not allowed: ${parsed.hostname}` });
    return;
  }

  let upstream;
  try {
    upstream = await fetch(rawUrl, {
      headers: { 'User-Agent': 'rastrum-img-proxy/1.0' },
    });
  } catch (e) {
    res.status(502).json({ error: 'Failed to reach upstream' });
    return;
  }

  if (!upstream.ok) {
    res.status(502).json({ error: `Upstream ${upstream.status}` });
    return;
  }

  const contentType = upstream.headers.get('content-type') || 'image/jpeg';
  const buffer = Buffer.from(await upstream.arrayBuffer());

  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).send(buffer);
}
