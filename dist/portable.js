import { validateLevel, clone } from './solver.js';
const MAX_BYTES = 300000;
const allowed = new Set(['format', 'version', 'name', 'capacity', 'bottles']);
export function normalizeLevel(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Each level must be a JSON object.');
  if (Object.keys(raw).some(key => !allowed.has(key))) throw new Error('Unknown level fields. Use only name, capacity and bottles (plus format/version).');
  if (raw.format !== undefined && raw.format !== 'pourlab') throw new Error('Unsupported level format.');
  if (raw.version !== undefined && raw.version !== 1) throw new Error('Unsupported version. This app accepts version 1.');
  const name = raw.name === undefined ? 'Imported study' : raw.name;
  if (typeof name !== 'string' || !name.trim() || name.length > 60 || /[\u0000-\u001f\u007f]/u.test(name)) throw new Error('Level names need 1–60 characters and no control characters.');
  const checked = validateLevel(raw, { inventory: false });
  if (!checked.valid) throw new Error(checked.errors.join(' '));
  return { name: name.trim(), ...clone(raw) };
}
export function packLevel(level, name) { return { format: 'pourlab', version: 1, ...normalizeLevel({ name, ...clone(level) }) }; }
export function parsePortable(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_BYTES) throw new Error('JSON must be smaller than 300 KB.');
  let raw; try { raw = JSON.parse(text); } catch { throw new Error('This is not valid JSON. Check commas, brackets and quoted field names.'); }
  if (raw?.format === 'pourlab-library') {
    if (Object.keys(raw).some(key => !['format', 'version', 'levels'].includes(key)) || raw.version !== 1 || !Array.isArray(raw.levels) || raw.levels.length < 1 || raw.levels.length > 50) throw new Error('A library backup needs version 1 and between 1 and 50 levels.');
    return { type: 'library', levels: raw.levels.map(normalizeLevel) };
  }
  return { type: 'level', levels: [normalizeLevel(raw)] };
}
export function encodeShare(level, name) {
  const encoded = encodeURIComponent(JSON.stringify(packLevel(level, name)));
  if (encoded.length > 10000) throw new Error('This level is too large for a shared link. Export JSON instead.');
  return `#level=${encoded}`;
}
export function decodeShare(hash) {
  if (!hash.startsWith('#level=')) return null;
  if (hash.length > 10007) throw new Error('This shared level exceeds the link size limit.');
  let text; try { text = decodeURIComponent(hash.slice(7)); } catch { throw new Error('The shared link has invalid encoding.'); }
  const parsed = parsePortable(text);
  if (parsed.type !== 'level') throw new Error('A shared link must contain a single level.');
  return parsed.levels[0];
}
