const ENTITY_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
};

export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'/]/g, (ch) => ENTITY_MAP[ch] ?? ch);
}

const SCRIPT_PATTERN = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const ON_EVENT_PATTERN = /\son\w+\s*=\s*["']?[^"'\s>]+["']?/gi;
const JS_PROTOCOL = /javascript\s*:/gi;

export function stripScripts(str: string): string {
  return str
    .replace(SCRIPT_PATTERN, "")
    .replace(ON_EVENT_PATTERN, "")
    .replace(JS_PROTOCOL, "")
    .trim();
}

export function sanitizeInput(str: string, maxLength = 5000): string {
  const trimmed = str.slice(0, maxLength);
  return stripScripts(escapeHtml(trimmed));
}

export function sanitizeRichText(str: string, maxLength = 10000): string {
  const trimmed = str.slice(0, maxLength);
  const noScripts = stripScripts(trimmed);
  return noScripts;
}
