/**
 * explore-map-filters.spec.ts
 *
 * Battery of tests for the filter bar in /es/explorar/mapa/ and /en/explore/map/.
 * Tests run against the local dev server (localhost:4321) via PLAYWRIGHT_BASE_URL.
 *
 * Coverage:
 *   1. Filter bar renders with all 4 inputs + Apply + Clear buttons
 *   2. Filter bar starts open (details[open])
 *   3. Closing / re-opening the filter accordion works
 *   4. Badge hidden when no filters active
 *   5. Badge shows count when filters applied via URL param
 *   6. Taxon filter input accepts text, Apply updates URL param
 *   7. Date-from filter updates URL param
 *   8. Date-to filter updates URL param
 *   9. Observer filter updates URL param
 *  10. Multiple filters combined update URL correctly
 *  11. Clear button resets all fields and removes URL params
 *  12. Shared URL with ?taxon= hydrates the input on load
 *  13. Shared URL with ?dateFrom=&dateTo= hydrates both inputs
 *  14. Shared URL with ?observer= hydrates the observer input
 *  15. All 4 URL params combined hydrate all inputs
 *  16. EN page renders with English labels
 *  17. ES page renders with Spanish labels
 *  18. Filter form is accessible (labels linked to inputs)
 *  19. Date ordering — dateTo before dateFrom is allowed (no constraint in UI)
 *  20. Observer with leading @ is accepted
 */

import { test, expect } from '@playwright/test';

const MAP_ES = '/es/explorar/mapa/';
const MAP_EN = '/en/explore/map/';

// ── helpers ─────────────────────────────────────────────────────────────────



// ── tests ────────────────────────────────────────────────────────────────────

test.describe('Explore Map — filter bar structure', () => {
  test('1. All inputs and buttons render (ES)', async ({ page }) => {
    await page.goto(MAP_ES);
    await page.waitForSelector('#explore-filter-form', { timeout: 8_000 });

    await expect(page.locator('#ef-taxon')).toBeVisible();
    await expect(page.locator('#ef-date-from')).toBeVisible();
    await expect(page.locator('#ef-date-to')).toBeVisible();
    await expect(page.locator('#ef-observer')).toBeVisible();
    await expect(page.locator('#explore-filter-apply')).toBeVisible();
    await expect(page.locator('#explore-filter-clear')).toBeVisible();
  });

  test('2. Filter accordion starts open', async ({ page }) => {
    await page.goto(MAP_ES);
    await page.waitForSelector('#explore-filter-details', { timeout: 8_000 });
    const details = page.locator('#explore-filter-details');
    await expect(details).toHaveAttribute('open', '');
  });

  test('3. Accordion toggles closed and reopens', async ({ page }) => {
    await page.goto(MAP_ES);
    await page.waitForSelector('#explore-filter-details', { timeout: 8_000 });
    const summary = page.locator('#explore-filter-details > summary');
    // close
    await summary.click();
    await expect(page.locator('#explore-filter-form')).toBeHidden();
    // reopen
    await summary.click();
    await expect(page.locator('#explore-filter-form')).toBeVisible();
  });

  test('4. Badge hidden when no filters', async ({ page }) => {
    await page.goto(MAP_ES);
    await page.waitForSelector('#explore-filter-badge', { state: 'attached', timeout: 8_000 });
    const badge = page.locator('#explore-filter-badge');
    await expect(badge).toHaveClass(/hidden/);
  });
});

test.describe('Explore Map — applying filters via form', () => {
  test('5. Taxon filter → URL param + badge count = 1', async ({ page }) => {
    await page.goto(MAP_ES);
    await page.waitForSelector('#ef-taxon', { timeout: 8_000 });

    await page.fill('#ef-taxon', 'Quercus');
    await page.click('#explore-filter-apply');

    const url = new URL(page.url());
    expect(url.searchParams.get('taxon')).toBe('Quercus');

    const badge = page.locator('#explore-filter-badge');
    await expect(badge).not.toHaveClass(/hidden/);
    await expect(badge).toHaveText('1');
  });

  test('6. Date-from filter → URL param', async ({ page }) => {
    await page.goto(MAP_ES);
    await page.waitForSelector('#ef-date-from', { timeout: 8_000 });

    await page.fill('#ef-date-from', '2025-01-01');
    await page.click('#explore-filter-apply');

    const url = new URL(page.url());
    expect(url.searchParams.get('dateFrom')).toBe('2025-01-01');
  });

  test('7. Date-to filter → URL param', async ({ page }) => {
    await page.goto(MAP_ES);
    await page.waitForSelector('#ef-date-to', { timeout: 8_000 });

    await page.fill('#ef-date-to', '2025-12-31');
    await page.click('#explore-filter-apply');

    const url = new URL(page.url());
    expect(url.searchParams.get('dateTo')).toBe('2025-12-31');
  });

  test('8. Observer filter → URL param', async ({ page }) => {
    await page.goto(MAP_ES);
    await page.waitForSelector('#ef-observer', { timeout: 8_000 });

    await page.fill('#ef-observer', 'comargentina1');
    await page.click('#explore-filter-apply');

    const url = new URL(page.url());
    expect(url.searchParams.get('observer')).toBe('comargentina1');
  });

  test('9. All 4 filters together → badge count = 4', async ({ page }) => {
    await page.goto(MAP_ES);
    await page.waitForSelector('#explore-filter-form', { timeout: 8_000 });

    await page.fill('#ef-taxon', 'Monnina');
    await page.fill('#ef-date-from', '2024-01-01');
    await page.fill('#ef-date-to', '2025-12-31');
    await page.fill('#ef-observer', 'comargentina1');
    await page.click('#explore-filter-apply');

    const url = new URL(page.url());
    expect(url.searchParams.get('taxon')).toBe('Monnina');
    expect(url.searchParams.get('dateFrom')).toBe('2024-01-01');
    expect(url.searchParams.get('dateTo')).toBe('2025-12-31');
    expect(url.searchParams.get('observer')).toBe('comargentina1');

    await expect(page.locator('#explore-filter-badge')).toHaveText('4');
  });

  test('10. Clear button resets fields and URL params', async ({ page }) => {
    await page.goto(`${MAP_ES}?taxon=Quercus&dateFrom=2024-01-01&dateTo=2025-12-31&observer=test`);
    await page.waitForSelector('#explore-filter-form', { timeout: 8_000 });

    await page.click('#explore-filter-clear');

    const url = new URL(page.url());
    expect(url.searchParams.get('taxon')).toBeNull();
    expect(url.searchParams.get('dateFrom')).toBeNull();
    expect(url.searchParams.get('dateTo')).toBeNull();
    expect(url.searchParams.get('observer')).toBeNull();

    await expect(page.locator('#ef-taxon')).toHaveValue('');
    await expect(page.locator('#ef-date-from')).toHaveValue('');
    await expect(page.locator('#ef-date-to')).toHaveValue('');
    await expect(page.locator('#ef-observer')).toHaveValue('');

    await expect(page.locator('#explore-filter-badge')).toHaveClass(/hidden/);
  });
});

test.describe('Explore Map — URL hydration (shareable links)', () => {
  test('11. ?taxon= hydrates taxon input + badge on load', async ({ page }) => {
    await page.goto(`${MAP_ES}?taxon=Ortilia`);
    await page.waitForSelector('#ef-taxon', { timeout: 8_000 });

    await expect(page.locator('#ef-taxon')).toHaveValue('Ortilia');
    await expect(page.locator('#explore-filter-badge')).toHaveText('1');
  });

  test('12. ?dateFrom=&dateTo= hydrates both date inputs', async ({ page }) => {
    await page.goto(`${MAP_ES}?dateFrom=2024-03-01&dateTo=2024-09-30`);
    await page.waitForSelector('#ef-date-from', { timeout: 8_000 });

    await expect(page.locator('#ef-date-from')).toHaveValue('2024-03-01');
    await expect(page.locator('#ef-date-to')).toHaveValue('2024-09-30');
    await expect(page.locator('#explore-filter-badge')).toHaveText('2');
  });

  test('13. ?observer= hydrates observer input', async ({ page }) => {
    await page.goto(`${MAP_ES}?observer=comargentina1`);
    await page.waitForSelector('#ef-observer', { timeout: 8_000 });

    await expect(page.locator('#ef-observer')).toHaveValue('comargentina1');
    await expect(page.locator('#explore-filter-badge')).toHaveText('1');
  });

  test('14. All 4 URL params hydrate all inputs', async ({ page }) => {
    await page.goto(`${MAP_ES}?taxon=Monnina&dateFrom=2024-01-01&dateTo=2025-12-31&observer=test`);
    await page.waitForSelector('#explore-filter-form', { timeout: 8_000 });

    await expect(page.locator('#ef-taxon')).toHaveValue('Monnina');
    await expect(page.locator('#ef-date-from')).toHaveValue('2024-01-01');
    await expect(page.locator('#ef-date-to')).toHaveValue('2025-12-31');
    await expect(page.locator('#ef-observer')).toHaveValue('test');
    await expect(page.locator('#explore-filter-badge')).toHaveText('4');
  });
});

test.describe('Explore Map — i18n labels', () => {
  test('15. EN page shows English labels', async ({ page }) => {
    await page.goto(MAP_EN);
    await page.waitForSelector('#explore-filter-form', { timeout: 8_000 });

    await expect(page.locator('label[for="ef-taxon"]')).toHaveText('Taxon');
    await expect(page.locator('label[for="ef-date-from"]')).toHaveText('From');
    await expect(page.locator('label[for="ef-date-to"]')).toHaveText('To');
    await expect(page.locator('label[for="ef-observer"]')).toHaveText('Observer');
    await expect(page.locator('#explore-filter-apply')).toHaveText('Apply');
    await expect(page.locator('#explore-filter-clear')).toHaveText('Clear');
  });

  test('16. ES page shows Spanish labels', async ({ page }) => {
    await page.goto(MAP_ES);
    await page.waitForSelector('#explore-filter-form', { timeout: 8_000 });

    await expect(page.locator('label[for="ef-taxon"]')).toHaveText('Taxón');
    await expect(page.locator('label[for="ef-date-from"]')).toHaveText('Desde');
    await expect(page.locator('label[for="ef-date-to"]')).toHaveText('Hasta');
    await expect(page.locator('label[for="ef-observer"]')).toHaveText('Observador');
    await expect(page.locator('#explore-filter-apply')).toHaveText('Aplicar');
    await expect(page.locator('#explore-filter-clear')).toHaveText('Limpiar');
  });
});

test.describe('Explore Map — accessibility', () => {
  test('17. Each input has a linked <label> (for= attribute)', async ({ page }) => {
    await page.goto(MAP_ES);
    await page.waitForSelector('#explore-filter-form', { timeout: 8_000 });

    for (const id of ['ef-taxon', 'ef-date-from', 'ef-date-to', 'ef-observer']) {
      await expect(page.locator(`label[for="${id}"]`)).toHaveCount(1);
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
  });

  test('18. Badge has aria-live="polite"', async ({ page }) => {
    await page.goto(MAP_ES);
    await page.waitForSelector('#explore-filter-badge', { state: 'attached', timeout: 8_000 });
    await expect(page.locator('#explore-filter-badge')).toHaveAttribute('aria-live', 'polite');
  });
});

test.describe('Explore Map — edge cases', () => {
  test('19. dateTo before dateFrom is accepted (no UI constraint)', async ({ page }) => {
    await page.goto(MAP_ES);
    await page.waitForSelector('#explore-filter-form', { timeout: 8_000 });

    await page.fill('#ef-date-from', '2025-12-31');
    await page.fill('#ef-date-to', '2025-01-01');
    await page.click('#explore-filter-apply');

    const url = new URL(page.url());
    expect(url.searchParams.get('dateFrom')).toBe('2025-12-31');
    expect(url.searchParams.get('dateTo')).toBe('2025-01-01');
  });

  test('20. Observer with leading @ is accepted', async ({ page }) => {
    await page.goto(MAP_ES);
    await page.waitForSelector('#ef-observer', { timeout: 8_000 });

    await page.fill('#ef-observer', '@comargentina1');
    await page.click('#explore-filter-apply');

    const url = new URL(page.url());
    expect(url.searchParams.get('observer')).toBe('@comargentina1');
  });

  test('21. Whitespace-only taxon is trimmed (no URL param set)', async ({ page }) => {
    await page.goto(MAP_ES);
    await page.waitForSelector('#ef-taxon', { timeout: 8_000 });

    await page.fill('#ef-taxon', '   ');
    await page.click('#explore-filter-apply');

    const url = new URL(page.url());
    expect(url.searchParams.get('taxon')).toBeNull();
  });

  test('22. Applying then clearing a single filter removes only that param', async ({ page }) => {
    await page.goto(`${MAP_ES}?taxon=Quercus&observer=test`);
    await page.waitForSelector('#explore-filter-form', { timeout: 8_000 });

    // Remove taxon, keep observer
    await page.fill('#ef-taxon', '');
    await page.click('#explore-filter-apply');

    const url = new URL(page.url());
    expect(url.searchParams.get('taxon')).toBeNull();
    expect(url.searchParams.get('observer')).toBe('test');
  });
});
