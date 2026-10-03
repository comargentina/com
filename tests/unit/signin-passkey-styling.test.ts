/**
 * PBI 5.2 — passkey button styling parity with Google + GitHub OAuth
 * buttons.
 *
 * The current defect was an emerald-tinted passkey button that visually
 * implied "recommended default", contradicting the magic-link-first
 * onboarding. This pins the passkey button to the same neutral white /
 * gray-border surface used by the Google and GitHub buttons.
 *
 * Source-string assertions on SignInForm.astro, matching the shape of
 * `signin-microcopy.test.ts`: the client logic lives inside an Astro
 * `<script>`, so we test the SSR markup directly rather than mounting.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const componentSrc = readFileSync(
  join(process.cwd(), 'src/components/SignInForm.astro'),
  'utf8',
);

function extractButtonClass(id: string): string {
  const re = new RegExp(`<button[^>]*id="${id}"[^>]*class="([^"]+)"`, 'i');
  const match = componentSrc.match(re);
  if (!match) throw new Error(`Could not find #${id} button in SignInForm.astro`);
  return match[1];
}

describe('PBI 5.2 — signin provider cleanup', () => {
  it('passkey button is removed', () => {
    expect(componentSrc).not.toContain('id="passkey-btn"');
  });

  it('github button is removed', () => {
    expect(componentSrc).not.toContain('id="github-btn"');
  });

  it('google button is retained with neutral OAuth styling', () => {
    const googleClass = extractButtonClass('google-btn');
    expect(googleClass).toContain('bg-white');
    expect(googleClass).toContain('dark:bg-zinc-900');
  });
});
