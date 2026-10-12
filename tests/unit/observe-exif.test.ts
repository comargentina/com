import { describe, it, expect } from 'vitest';
import { buildObservation } from '../../src/lib/observe';

function pickNumber(...candidates: unknown[]): number | null {
  for (const c of candidates) {
    if (typeof c === 'number' && Number.isFinite(c)) return c;
  }
  return null;
}

function parseExifDateToIso(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date) {
    const t = v.getTime();
    return Number.isFinite(t) ? v.toISOString() : null;
  }
  if (typeof v === 'number' && Number.isFinite(v)) {
    return new Date(v).toISOString();
  }
  if (typeof v === 'string' && v.trim().length > 0) {
    const exifLike = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/;
    const m = v.match(exifLike);
    let s = v;
    if (m) s = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`;
    const t = Date.parse(s);
    return Number.isFinite(t) ? new Date(t).toISOString() : null;
  }
  return null;
}

function toDatetimeLocalString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

describe('EXIF Metadata Extraction for Observations', () => {
  it('extracts numeric coordinates from various EXIF formats', () => {
    expect(pickNumber(undefined, null, -32.2319)).toBe(-32.2319);
    expect(pickNumber(-58.1402, null, undefined)).toBe(-58.1402);
    expect(pickNumber(undefined, undefined)).toBeNull();
    expect(pickNumber('not-a-num', null)).toBeNull();
  });

  it('parses EXIF date strings (YYYY:MM:DD HH:MM:SS) into ISO strings', () => {
    const raw = '2026:05:03 14:30:00';
    const iso = parseExifDateToIso(raw);
    expect(iso).toBeTruthy();
    expect(new Date(iso!).getFullYear()).toBe(2026);
    expect(new Date(iso!).getMonth()).toBe(4); // May (0-indexed)
    expect(new Date(iso!).getDate()).toBe(3);
  });

  it('parses Date instances into ISO strings', () => {
    const dateObj = new Date('2026-10-12T15:30:00Z');
    expect(parseExifDateToIso(dateObj)).toBe('2026-10-12T15:30:00.000Z');
  });

  it('formats Date into datetime-local string (YYYY-MM-DDTHH:mm)', () => {
    const d = new Date(2026, 4, 3, 14, 30); // May 3, 2026 14:30 local
    expect(toDatetimeLocalString(d)).toBe('2026-05-03T14:30');
  });

  it('buildObservation respects custom createdAt from photo EXIF', () => {
    const customTime = '2026-05-03T17:30:00.000Z';
    const obs = buildObservation({
      observerRef: { kind: 'user', id: '123e4567-e89b-12d3-a456-426614174000' },
      createdAt: customTime,
      media: [],
      location: { lat: -32.2319, lng: -58.1402, accuracyM: 15, altitudeM: null, capturedFrom: 'exif' },
    });

    expect(obs.createdAt).toBe(customTime);
    expect(obs.location.capturedFrom).toBe('exif');
    expect(obs.location.lat).toBe(-32.2319);
    expect(obs.location.lng).toBe(-58.1402);
  });
});
