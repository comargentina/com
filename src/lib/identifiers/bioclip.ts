/**
 * BioCLIP 2 plugin (via Hugging Face Spaces Gradio API — imageomics/bioclip-2-demo).
 *
 * Specialised tree-of-life foundation model covering 200M+ biological records,
 * with strong precision for Lepidoptera (butterflies and moths) and broad taxonomy.
 */
import type { Identifier, IDResult, IdentifyInput } from './types';

const PLUGIN_ID = 'bioclip';

export function parseBioClipLabel(fullLabel: string): {
  kingdom: IDResult['kingdom'];
  family: string | null;
  scientificName: string;
  commonName: string | null;
} {
  let commonName: string | null = null;
  let text = fullLabel.trim();
  const matchParen = text.match(/\(([^)]+)\)$/);
  if (matchParen) {
    commonName = matchParen[1].trim();
    text = text.replace(/\([^)]+\)$/, '').trim();
  }

  const tokens = text.split(/\s+/).filter(Boolean);
  const rawKingdom = tokens[0] || 'Animalia';
  let kingdom: IDResult['kingdom'] = 'Unknown';
  if (['Plantae', 'Animalia', 'Fungi', 'Chromista', 'Bacteria'].includes(rawKingdom)) {
    kingdom = rawKingdom as IDResult['kingdom'];
  } else {
    kingdom = 'Animalia';
  }

  let scientificName = '';
  let family: string | null = null;
  if (tokens.length >= 2) {
    scientificName = tokens.slice(-2).join(' ');
  } else {
    scientificName = tokens[0] || 'Unknown';
  }

  for (const tok of tokens) {
    if (tok.endsWith('idae') || tok.endsWith('aceae') || tok.endsWith('eae')) {
      family = tok;
      break;
    }
  }

  return { kingdom, family, scientificName, commonName };
}

export const bioClipIdentifier: Identifier = {
  id: PLUGIN_ID,
  name: 'BioCLIP 2',
  brand: '🦋',
  description: 'Tree of life AI by Imageomics Institute (Ohio State University) — specialized in butterflies, insects, and global biodiversity.',
  capabilities: {
    media: ['photo'],
    taxa: ['Animalia', 'Plantae', 'Fungi', '*'],
    runtime: 'client',
    license: 'free',
    cost_per_id_usd: 0,
    confidence_ceiling: 0.99,
  },
  async isAvailable() {
    return { ready: true };
  },
  async testConnection() {
    try {
      const res = await fetch('https://imageomics-bioclip-2-demo.hf.space/config', { method: 'GET' });
      if (res.ok) return { ok: true, message: 'BioCLIP 2 is online on Hugging Face.' };
      return { ok: false, message: `HTTP ${res.status}` };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : 'Network error' };
    }
  },
  async identify(input: IdentifyInput): Promise<IDResult> {
    let blob: Blob;

    if (input.media.kind === 'blob') {
      blob = input.media.blob;
    } else if (input.media.kind === 'url') {
      const res = await fetch(input.media.url);
      if (!res.ok) throw new Error('Failed to fetch image URL for BioCLIP 2');
      blob = await res.blob();
    } else {
      throw new Error('Unsupported media format for BioCLIP 2');
    }

    const form = new FormData();
    form.append('files', blob, 'photo.jpg');

    const uploadRes = await fetch('https://imageomics-bioclip-2-demo.hf.space/gradio_api/upload', {
      method: 'POST',
      body: form,
    });
    if (!uploadRes.ok) throw new Error(`BioCLIP 2 upload failed with HTTP ${uploadRes.status}`);
    const uploaded = await uploadRes.json();
    if (!uploaded || !uploaded[0]) throw new Error('BioCLIP 2 did not return uploaded file path');

    const fileData = { path: uploaded[0], orig_name: 'photo.jpg', mime_type: 'image/jpeg' };

    const callRes = await fetch('https://imageomics-bioclip-2-demo.hf.space/gradio_api/call/lambda', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [fileData, 'Species'],
      }),
    });
    if (!callRes.ok) throw new Error(`BioCLIP 2 prediction request failed with HTTP ${callRes.status}`);
    const callJson = await callRes.json();
    if (!callJson.event_id) throw new Error('BioCLIP 2 did not return prediction event');

    const sseRes = await fetch(`https://imageomics-bioclip-2-demo.hf.space/gradio_api/call/lambda/${callJson.event_id}`);
    if (!sseRes.ok) throw new Error(`BioCLIP 2 SSE request failed with HTTP ${sseRes.status}`);

    const sseText = await sseRes.text();
    let resultData: Array<{ label?: string; confidences?: Array<{ label: string; confidence: number }> }> | null = null;
    for (const line of sseText.split('\n')) {
      if (line.startsWith('data:')) {
        const jsonStr = line.slice(5).trim();
        if (jsonStr && jsonStr !== 'null') {
          try {
            resultData = JSON.parse(jsonStr);
          } catch { /* ignore */ }
        }
      }
    }

    if (!resultData || !resultData[0] || !resultData[0].confidences || resultData[0].confidences.length === 0) {
      throw new Error('BioCLIP 2 could not classify the image');
    }

    const topMatch = resultData[0].confidences[0];
    const topParsed = parseBioClipLabel(topMatch.label);

    return {
      scientific_name: topParsed.scientificName,
      common_name_en: topParsed.commonName,
      common_name_es: topParsed.commonName,
      family: topParsed.family,
      kingdom: topParsed.kingdom,
      confidence: Math.round(topMatch.confidence * 100) / 100,
      source: 'bioclip_2',
      raw: resultData,
    };
  },
};
