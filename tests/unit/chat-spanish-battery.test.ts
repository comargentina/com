import { describe, it, expect } from 'vitest';
import { buildChatSuggestions, buildCascadeInterpretationPrompt, buildVisionFallbackPrompt } from '../../src/lib/chat-attachment-helpers';
import { entityChipHtml, canonicalEntityUrl } from '../../src/lib/chat-bubble-html';
import { CHAT_SYSTEM_PROMPT } from '../../src/lib/local-ai-helpers';

describe('Batería de pruebas: Chat en Español (/es/chat/)', () => {
  it('1. El servidor local responde 200 y sirve la página /es/chat/ con html lang="es"', async () => {
    const res = await fetch('http://localhost:4321/es/chat/');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('lang="es"');
  });

  it('2. Los textos principales del encabezado están en español', async () => {
    const res = await fetch('http://localhost:4321/es/chat/');
    const html = await res.text();
    expect(html).toContain('Chat');
    expect(html).toContain('Asistente de biodiversidad');
    expect(html).toContain('También puedes adjuntar una foto o un audio.');
  });

  it('3. Las sugerencias de inicio rápido (empty suggestions) están en español', async () => {
    const res = await fetch('http://localhost:4321/es/chat/');
    const html = await res.text();
    expect(html).toContain('¿Qué especies puedo encontrar cerca de mí?');
    expect(html).toContain('Cerca de mí');
    expect(html).toContain('Adjunta una observación reciente para revisarla.');
    expect(html).toContain('Revisar observación');
    expect(html).toContain('necesita revisión');
    expect(html).toContain('Cómo funciona');
    expect(html).toContain('¿Cuál es el estado de conservación de esta especie según la UICN y Argentina?');
    expect(html).toContain('Conservación');
  });

  it('4. El área de composición (composer) contiene placeholders y botones en español', async () => {
    const res = await fetch('http://localhost:4321/es/chat/');
    const html = await res.text();
    expect(html).toContain('placeholder="Pregunta lo que quieras sobre especies, hábitats o tus observaciones…');
    expect(html).toContain('Enviar');
    expect(html).toContain('Contexto');
    expect(html).toContain('Adjuntar contexto');
    expect(html).toContain('Tomar foto');
    expect(html).toContain('Elegir de la galería');
    expect(html).toContain('Grabar audio');
  });

  it('5. El banner de cuota y BYO key está en español', async () => {
    const res = await fetch('http://localhost:4321/es/chat/');
    const html = await res.text();
    expect(html).toContain('Límite de uso alcanzado');
    expect(html).toContain('Guardar');
    expect(html).toContain('La clave se guarda solo en este dispositivo');
  });

  it('6. El selector de entidades (ChatEntityPicker) tiene pestañas y botones en español', async () => {
    const res = await fetch('http://localhost:4321/es/chat/');
    const html = await res.text();
    expect(html).toContain('Observaciones');
    expect(html).toContain('Especies');
    expect(html).toContain('Proyectos');
    expect(html).toContain('Estaciones');
    expect(html).toContain('Observadores');
    expect(html).toContain('Yo');
    expect(html).toContain('Buscar…');
  });

  it('7. buildChatSuggestions genera sugerencias en español para especies identificadas', () => {
    const suggestions = buildChatSuggestions({
      locale: 'es',
      scientificName: 'Morpho helenor',
      commonName: 'Mariposa morfo azul',
    });
    expect(suggestions).toHaveLength(3);
    expect(suggestions[0].label).toContain('¿Es Mariposa morfo azul venenosa?');
    expect(suggestions[1].label).toContain('¿Cómo distingo a Mariposa morfo azul de especies similares?');
    expect(suggestions[2].label).toContain('Hábitat típico de Mariposa morfo azul');
  });

  it('8. buildChatSuggestions genérico está en español', () => {
    const generic = buildChatSuggestions({ locale: 'es' });
    expect(generic).toHaveLength(3);
    expect(generic[0].label).toBe('¿Es venenosa?');
    expect(generic[1].label).toBe('¿Cómo la distingo?');
    expect(generic[2].label).toBe('Hábitat típico');
  });

  it('9. buildCascadeInterpretationPrompt solicita respuesta en español', () => {
    const prompt = buildCascadeInterpretationPrompt({
      kind: 'photo',
      userText: '¿Qué mariposa es?',
      locale: 'es',
      best: {
        scientific_name: 'Danaus plexippus',
        confidence: 0.95,
        source: 'plantnet',
      },
    });
    expect(prompt).toContain('In Spanish, write a brief 2-4 sentence reply');
    expect(prompt).toContain('Danaus plexippus');
  });

  it('10. buildVisionFallbackPrompt solicita respuesta en español', () => {
    const prompt = buildVisionFallbackPrompt({
      userText: '',
      locale: 'es',
    });
    expect(prompt).toContain('¿qué es esto?');
    expect(prompt).toContain('Reply in Spanish');
  });

  it('11. CHAT_SYSTEM_PROMPT contiene instrucciones específicas para Argentina y COM', () => {
    expect(CHAT_SYSTEM_PROMPT).toContain('COM');
    expect(CHAT_SYSTEM_PROMPT).toContain('Argentine');
    expect(CHAT_SYSTEM_PROMPT).toContain('UICN Red List');
  });

  it('12. entityChipHtml en español genera enlace y aria-label localizado', () => {
    const chipHtml = entityChipHtml({
      kind: 'species',
      id: 'danaus-plexippus',
      label: 'Danaus plexippus',
      icon: '🦋',
      lang: 'es',
    });
    expect(chipHtml).toContain('href="/es/especie/danaus-plexippus/"');
    expect(chipHtml).toContain('aria-label="Quitar"');
  });
});
