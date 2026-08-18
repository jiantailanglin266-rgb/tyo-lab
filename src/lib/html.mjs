/** Minimal HTML helpers. Everything interpolated into a template goes through
 *  `esc` unless it is explicitly marked safe with `raw`. */

const AMP = /&/g;
const LT = /</g;
const GT = />/g;
const QUOT = /"/g;
const APOS = /'/g;

/** Escape a value for text or double-quoted attribute context. */
export function esc(value) {
  if (value === null || value === undefined || value === false) return '';
  return String(value)
    .replace(AMP, '&amp;')
    .replace(LT, '&lt;')
    .replace(GT, '&gt;')
    .replace(QUOT, '&quot;')
    .replace(APOS, '&#39;');
}

/** Marks a string as already-safe HTML. */
class Raw {
  constructor(s) {
    this.s = s;
  }
  toString() {
    return this.s;
  }
}
export const raw = (s) => new Raw(s == null ? '' : String(s));
export const isRaw = (v) => v instanceof Raw;

/** Tagged template that escapes interpolations. Arrays are joined. */
export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) {
    out += render(values[i]) + strings[i + 1];
  }
  return raw(out);
}

function render(v) {
  if (v === null || v === undefined || v === false) return '';
  if (isRaw(v)) return v.toString();
  if (Array.isArray(v)) return v.map(render).join('');
  return esc(v);
}

/** Render only when `cond` is truthy. `fn` may be a function or a value. */
export const when = (cond, fn) => (cond ? (typeof fn === 'function' ? fn() : fn) : '');

/** Build a class attribute from strings / conditional pairs. */
export const cx = (...parts) =>
  parts
    .flat()
    .filter(Boolean)
    .join(' ');

/** Build an attribute string from an object. false/null/undefined drop the attr. */
export function attrs(obj) {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === false || v === null || v === undefined) continue;
    if (v === true) out.push(k);
    else out.push(`${k}="${esc(v)}"`);
  }
  return raw(out.length ? ' ' + out.join(' ') : '');
}

/** Newline-separated plain text → paragraphs. */
export const paragraphs = (text) =>
  raw(
    String(text || '')
      .split(/\n{2,}/)
      .map((p) => `<p>${esc(p.trim())}</p>`)
      .join('')
  );

/** Split a display headline into per-word spans so CSS can stagger them. */
export function splitWords(text, cls = 'w') {
  return raw(
    String(text || '')
      .split(/\s+/)
      .filter(Boolean)
      .map((w, i) => `<span class="${cls}" style="--i:${i}">${esc(w)}</span>`)
      .join(' ')
  );
}

/** Split into characters (used for the hero brand mark). */
export function splitChars(text, cls = 'c') {
  return raw(
    [...String(text || '')]
      .map((c, i) => (c === ' ' ? ' ' : `<span class="${cls}" style="--i:${i}">${esc(c)}</span>`))
      .join('')
  );
}
