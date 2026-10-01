import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const esPath = path.join(__dirname, '../src/i18n/es.json');
const enPath = path.join(__dirname, '../src/i18n/en.json');

function replaceRastrumInValue(val, key) {
  if (typeof val === 'string') {
    // Preserve internal keys or URLs
    if (val.startsWith('rastrum.') || val.startsWith('http://') || val.startsWith('https://')) {
      return val;
    }
    // Perform clean text replacements
    let updated = val;
    updated = updated.replace(/\bBienvenido a Rastrum\b/g, 'Bienvenido a COM Argentina');
    updated = updated.replace(/\bWelcome to Rastrum\b/g, 'Welcome to COM Argentina');
    updated = updated.replace(/\bDocs de Rastrum\b/g, 'Docs de COM Argentina');
    updated = updated.replace(/\bRastrum Docs\b/g, 'COM Argentina Docs');
    updated = updated.replace(/\bVolver a Rastrum\b/g, 'Volver a COM Argentina');
    updated = updated.replace(/\bBack to Rastrum\b/g, 'Back to COM Argentina');
    updated = updated.replace(/\bExplorar Rastrum\b/g, 'Explorar COM Argentina');
    updated = updated.replace(/\bExplore Rastrum\b/g, 'Explore COM Argentina');
    updated = updated.replace(/\bIniciar sesión en Rastrum\b/g, 'Iniciar sesión en COM Argentina');
    updated = updated.replace(/\bSign in to Rastrum\b/g, 'Sign in to COM Argentina');
    updated = updated.replace(/- Rastrum\b/g, '- COM Argentina');
    updated = updated.replace(/— Rastrum\b/g, '— COM Argentina');
    updated = updated.replace(/\bRastrum —\b/g, 'COM Argentina —');
    updated = updated.replace(/\bBuscar Rastrum\./g, 'Buscar en COM Argentina.');
    updated = updated.replace(/\bSearch Rastrum\./g, 'Search COM Argentina.');
    updated = updated.replace(/\bRastrum\b/g, 'COM Argentina');
    return updated;
  }
  if (Array.isArray(val)) {
    return val.map(item => replaceRastrumInValue(item, key));
  }
  if (val && typeof val === 'object') {
    const res = {};
    for (const k of Object.keys(val)) {
      res[k] = replaceRastrumInValue(val[k], k);
    }
    return res;
  }
  return val;
}

function processJsonFile(filePath) {
  const jsonRaw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(jsonRaw);
  const updated = replaceRastrumInValue(data, '');
  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2) + '\n', 'utf8');
  console.log(`Successfully updated ${filePath}`);
}

processJsonFile(esPath);
processJsonFile(enPath);
