// Varre o bundle do Shell procurando IPs privados e strings de segredo.
// Critério do runbook (seção 7, "Segurança de build").
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST = "apps/shell/dist";
const PROIBIDOS = [
  { nome: "IP privado 192.168.x.x", re: /192\.168\.\d{1,3}\.\d{1,3}/ },
  { nome: "IP privado 10.x.x.x", re: /\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/ },
  { nome: "Basic auth", re: /Basic\s+[A-Za-z0-9+/=]{12,}/ },
  { nome: "senha/password literal", re: /(password|senha)\s*[:=]\s*["'][^"']+["']/i },
  { nome: "porta S7 (ISO-on-TCP 102)", re: /:102\b/ },
];

function arquivos(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? arquivos(p) : [p];
  });
}

let falhas = 0;
for (const arq of arquivos(DIST)) {
  const txt = readFileSync(arq, "utf8");
  for (const { nome, re } of PROIBIDOS) {
    if (re.test(txt)) {
      console.error(`❌ ${nome} encontrado em ${arq}`);
      falhas++;
    }
  }
}
if (falhas) process.exit(1);
console.log("✅ Bundle limpo: nenhum IP privado / segredo encontrado.");
