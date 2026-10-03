/**
 * Chat header badge reflects Gemini Flash.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const chatViewSource = readFileSync(
  resolve(here, '../../src/components/ChatView.astro'),
  'utf8',
);

describe('chat badge', () => {
  it('displays Gemini Flash in the badge', () => {
    expect(chatViewSource).toMatch(/Gemini Flash/);
  });
});
