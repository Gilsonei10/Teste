import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 Iniciando empacotamento para LG webOS TV...');

// 1. Build web application
console.log('📦 Executando build da aplicação web...');
execSync('npm run build', { cwd: rootDir, stdio: 'inherit', shell: true });

// 2. Copiar arquivos do webOS para dist/
console.log('📋 Copiando manifestos e ícones do webOS para dist/...');
const webosDir = path.join(rootDir, 'webos');
const distDir = path.join(rootDir, 'dist');
const outputDir = path.join(rootDir, 'release-webos');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Sincronizar versão do appinfo.json com package.json
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
const appinfoPath = path.join(webosDir, 'appinfo.json');
const appinfo = JSON.parse(fs.readFileSync(appinfoPath, 'utf-8'));
appinfo.version = pkg.version;
fs.writeFileSync(appinfoPath, JSON.stringify(appinfo, null, 2));

// Copiar para dist
fs.copyFileSync(appinfoPath, path.join(distDir, 'appinfo.json'));
fs.copyFileSync(path.join(webosDir, 'icon.png'), path.join(distDir, 'icon.png'));
fs.copyFileSync(path.join(webosDir, 'largeIcon.png'), path.join(distDir, 'largeIcon.png'));

// 3. Executar ares-package
console.log('⚙️ Gerando pacote .ipk com ares-package...');
execSync(`npx ares-package "${distDir}" -o "${outputDir}"`, {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
});

const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.ipk'));
console.log(`\n🎉 Pacote webOS gerado com sucesso!`);
files.forEach(f => {
  const stats = fs.statSync(path.join(outputDir, f));
  console.log(`📦 Arquivo: release-webos/${f} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
});
