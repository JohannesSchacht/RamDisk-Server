export function splitPath(name: string): { absolute: boolean; path: string[] } {
  const s = name.trim();
  const abs = s[0] === "/";
  const p = s.split("/");
  if (abs) p.shift();
  if (p[p.length - 1] === "") p.pop();
  return { absolute: abs, path: p };
}
