// Copia SystemJS e import-map-overrides para public/vendor (scripts clássicos, não passam pelo bundler).
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, "../public/vendor");
mkdirSync(out, { recursive: true });

// procura node_modules subindo diretórios (funciona com workspaces/hoisting)
function findFile(rel) {
  let dir = here;
  while (true) {
    const p = join(dir, "node_modules", rel);
    if (existsSync(p)) return p;
    const up = dirname(dir);
    if (up === dir) throw new Error(`Não encontrado: ${rel} (rode npm install)`);
    dir = up;
  }
}

for (const [rel, name] of [
  ["systemjs/dist/system.min.js", "system.min.js"],
  ["import-map-overrides/dist/import-map-overrides.js", "import-map-overrides.js"],
]) copyFileSync(findFile(rel), join(out, name));
console.log("vendor copiado →", out);
