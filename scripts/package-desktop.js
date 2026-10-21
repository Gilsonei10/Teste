import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import pngToIco from 'png-to-ico';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 Iniciando empacotamento para Computador (Windows)...');

// 1. Gerar ícone .ico a partir de largeIcon.png
console.log('🎨 Gerando ícone oficial Windows (icon.ico)...');
const icoBuf = await pngToIco(path.join(rootDir, 'public', 'largeIcon.png'));
fs.writeFileSync(path.join(rootDir, 'public', 'icon.ico'), icoBuf);
const buildDir = path.join(rootDir, 'build');
if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuf);

// 2. Build da aplicação web
console.log('📦 Executando build da aplicação web...');
execSync('npm run build', { cwd: rootDir, stdio: 'inherit', shell: true });

// 3. Executar electron-builder
console.log('⚙️ Gerando instalador .exe com electron-builder...');
execSync('npx electron-builder --win', { cwd: rootDir, stdio: 'inherit', shell: true });

// 4. Copiar executável para a raiz
const releaseDir = path.join(rootDir, 'release-desktop');
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
const files = fs.readdirSync(releaseDir).filter(f => f.endsWith('.exe') && !f.includes('uninstaller'));

files.forEach(f => {
  const src = path.join(releaseDir, f);
  const destName = `PlayLive-IPTV-Setup-v${pkg.version}.exe`;
  const dest = path.join(rootDir, destName);
  fs.copyFileSync(src, dest);
  const stats = fs.statSync(dest);
  console.log(`\n🎉 Instalador Windows gerado com sucesso!`);
  console.log(`📦 Arquivo na raiz: ${destName} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`📂 Arquivo em release: release-desktop/${f}`);
});
