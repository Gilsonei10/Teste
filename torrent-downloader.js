import WebTorrent from 'webtorrent';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Utilitários de formatação
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function formatSpeed(bytesPerSec) {
  return `${formatBytes(bytesPerSec)}/s`;
}

function formatTime(seconds) {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return '--:--';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function createProgressBar(percent, length = 25) {
  const filledLength = Math.max(0, Math.min(length, Math.round((percent / 100) * length)));
  const emptyLength = length - filledLength;
  return '█'.repeat(filledLength) + '░'.repeat(emptyLength);
}

function cleanPathString(raw) {
  if (!raw) return '';
  return raw.replace(/^["']|["']$/g, '').trim();
}

// Procurar arquivos .torrent existentes em locais comuns
function findLocalTorrentFiles() {
  const candidates = [];
  const searchDirs = [
    { dir: path.resolve(__dirname, 'downloads'), label: 'pasta downloads/' },
    { dir: process.cwd(), label: 'pasta do projeto' },
    { dir: path.join(process.env.USERPROFILE || '', 'Downloads'), label: 'Downloads do Windows' },
    { dir: path.join(process.env.USERPROFILE || '', 'Desktop'), label: 'Área de Trabalho' }
  ];

  const seenPaths = new Set();

  for (const { dir, label } of searchDirs) {
    if (!dir || !fs.existsSync(dir)) continue;
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file.toLowerCase().endsWith('.torrent')) {
          const fullPath = path.resolve(dir, file);
          if (!seenPaths.has(fullPath.toLowerCase())) {
            seenPaths.add(fullPath.toLowerCase());
            try {
              const stats = fs.statSync(fullPath);
              candidates.push({
                name: file,
                fullPath,
                label,
                size: stats.size,
                mtime: stats.mtime
              });
            } catch {
              // ignore stat errors
            }
          }
        }
      }
    } catch {
      // ignore readdir errors
    }
  }

  candidates.sort((a, b) => b.mtime - a.mtime);
  return candidates;
}

// Abrir janela nativa do Windows para escolher arquivo
function openNativeFileDialog() {
  try {
    console.log('📂 Abrindo janela de seleção de arquivo do Windows...');
    const initialDir = fs.existsSync(path.resolve(__dirname, 'downloads'))
      ? path.resolve(__dirname, 'downloads')
      : path.join(process.env.USERPROFILE || '', 'Downloads');

    const escapedDir = initialDir.replace(/'/g, "''");

    const psCommand = `powershell -NoProfile -ExecutionPolicy Bypass -STA -Command "Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.OpenFileDialog; $f.Title = 'Selecione o arquivo .torrent'; $f.Filter = 'Arquivos Torrent (*.torrent)|*.torrent|Todos os Arquivos (*.*)|*.*'; $f.InitialDirectory = '${escapedDir}'; $top = New-Object System.Windows.Forms.Form; $top.TopMost = $true; if ($f.ShowDialog($top) -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $f.FileName }"`;
    const selected = execSync(psCommand, { encoding: 'utf8' }).trim();
    return selected || null;
  } catch (err) {
    console.error('⚠️ Não foi possível abrir a janela do Windows automaticamente:', err.message);
    return null;
  }
}

// Perguntar entrada
async function askInput(promptText) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(promptText, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function resolveTorrentTarget(initialInput) {
  let input = initialInput;

  while (true) {
    const localTorrents = findLocalTorrentFiles();

    if (!input) {
      console.log('----------------------------------------------------');
      if (localTorrents.length > 0) {
        console.log(' 📂 Arquivo(s) .torrent encontrado(s):');
        localTorrents.slice(0, 5).forEach((t, i) => {
          console.log(`   [${i + 1}] ${t.name} (${formatBytes(t.size)} - ${t.label})`);
        });
        console.log('----------------------------------------------------');
        console.log(' Como deseja carregar o download?');
        console.log(`   [ENTER ou 1..${Math.min(5, localTorrents.length)}] Baixar um dos arquivos listados acima`);
        console.log('   [E] Escolher outro arquivo na janela do Windows');
        console.log('   [M] Colar um MAGNET LINK (magnet:?xt=...)');
        console.log('   [C] Digitar ou arrastar o caminho de um arquivo .torrent');
      } else {
        console.log(' Como deseja carregar o download?');
        console.log('   [ENTER ou 1] Abrir janela do Windows para selecionar arquivo .torrent');
        console.log('   [2 ou M] Colar um MAGNET LINK (magnet:?xt=...)');
        console.log('   [3 ou C] Digitar ou arrastar o caminho de um arquivo .torrent');
      }
      console.log('----------------------------------------------------');
      input = await askInput('> ');
    }

    let cleanInput = cleanPathString(input);

    // Se temos arquivos locais e o usuário digitou número correspondente (ou ENTER para o 1º)
    if (localTorrents.length > 0) {
      if (!cleanInput) {
        cleanInput = localTorrents[0].fullPath;
      } else {
        const num = parseInt(cleanInput, 10);
        if (!isNaN(num) && num >= 1 && num <= Math.min(5, localTorrents.length)) {
          cleanInput = localTorrents[num - 1].fullPath;
        }
      }
    }

    // Se escolheu abrir janela de seleção do Windows
    if (cleanInput.toLowerCase() === 'e' || (localTorrents.length === 0 && (!cleanInput || cleanInput === '1'))) {
      const selectedFile = openNativeFileDialog();
      if (selectedFile) {
        cleanInput = selectedFile;
      } else {
        console.log('⚠️ Nenhum arquivo foi selecionado na janela. Tente novamente.\n');
        input = null;
        continue;
      }
    }

    // Se escolheu colar magnet link
    if (cleanInput.toLowerCase() === 'm' || (localTorrents.length === 0 && cleanInput === '2')) {
      const magnetUrl = await askInput('Cole o Magnet Link: ');
      cleanInput = cleanPathString(magnetUrl);
      if (!cleanInput) {
        input = null;
        continue;
      }
    }

    // Se escolheu digitar/arrastar caminho
    if (cleanInput.toLowerCase() === 'c' || (localTorrents.length === 0 && cleanInput === '3')) {
      const manualPath = await askInput('Digite ou arraste o arquivo .torrent: ');
      cleanInput = cleanPathString(manualPath);
      if (!cleanInput) {
        input = null;
        continue;
      }
    }

    // Se for magnet ou URL
    if (cleanInput.startsWith('magnet:') || cleanInput.startsWith('http://') || cleanInput.startsWith('https://')) {
      return cleanInput;
    }

    // Se for arquivo local
    let candidatePath = path.resolve(process.cwd(), cleanInput);

    if (!fs.existsSync(candidatePath)) {
      const userProfile = process.env.USERPROFILE || '';
      const fileName = path.basename(cleanInput);

      const downloadDirTry = path.join(__dirname, 'downloads', fileName);
      const desktopTry = path.join(userProfile, 'Desktop', fileName);
      const downloadsTry = path.join(userProfile, 'Downloads', fileName);

      if (fs.existsSync(downloadDirTry)) {
        candidatePath = downloadDirTry;
      } else if (fs.existsSync(desktopTry)) {
        candidatePath = desktopTry;
      } else if (fs.existsSync(downloadsTry)) {
        candidatePath = downloadsTry;
      }
    }

    if (fs.existsSync(candidatePath)) {
      try {
        console.log(`\n📄 Arquivo carregado: ${candidatePath}`);
        return fs.readFileSync(candidatePath);
      } catch (err) {
        console.error(`❌ Erro ao ler o arquivo: ${err.message}\n`);
      }
    } else {
      console.error(`\n❌ Arquivo não encontrado no disco: ${cleanInput}`);
      console.log('💡 Dica: Digite [E] para abrir a janela de busca de arquivos do Windows!\n');
    }

    input = null;
  }
}

async function main() {
  console.clear();
  console.log('====================================================');
  console.log('       GERENCIADOR DE DOWNLOADS TORRENT (NODE.JS)    ');
  console.log('  Suporte a retomada automática (Resume de onde parou)');
  console.log('====================================================\n');

  const customDest = process.argv[3];
  const torrentTarget = await resolveTorrentTarget(process.argv[2]);

  const downloadDir = customDest
    ? path.resolve(process.cwd(), customDest)
    : path.resolve(__dirname, 'downloads');

  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  console.log(`\n📁 Diretório de destino: ${downloadDir}`);
  console.log('🔄 Conectando aos peers e lendo metadados...');

  const client = new WebTorrent();

  let isExiting = false;
  const gracefulExit = () => {
    if (isExiting) return;
    isExiting = true;
    console.log('\n\n⏸️  Download pausado com segurança.');
    console.log('💾 Os blocos baixados estão preservados no disco.');
    console.log('💡 Para continuar de onde parou, execute novamente o mesmo comando.\n');
    client.destroy(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', gracefulExit);
  process.on('SIGTERM', gracefulExit);

  client.on('error', err => {
    console.error('\n❌ Erro no cliente WebTorrent:', err.message);
  });

  const torrent = client.add(torrentTarget, { path: downloadDir, deselect: true });

  torrent.on('error', err => {
    console.error('\n❌ Erro no torrent:', err.message);
    gracefulExit();
  });

  let totalTargetBytes = 0;

  torrent.on('ready', async () => {
    console.log(`\n📦 Nome: ${torrent.name}`);
    console.log(`📊 Tamanho total do pacote: ${formatBytes(torrent.length)}`);
    console.log(`📄 Arquivos no torrent (${torrent.files.length}):`);
    torrent.files.forEach((file, index) => {
      console.log(`   [${index + 1}] ${file.name} (${formatBytes(file.length)})`);
    });

    if (torrent.files.length > 1) {
      console.log('\n----------------------------------------------------');
      console.log(' Deseja selecionar quais arquivos baixar?');
      console.log(' [ENTER] Baixar TODOS os arquivos');
      console.log(' Ou digite os números dos arquivos desejados (ex: 1 ou 1, 2)');
      console.log('----------------------------------------------------');
      const selection = await askInput('> ');
      if (!selection) {
        torrent.files.forEach(f => f.select());
        totalTargetBytes = torrent.length;
        console.log('✅ Baixando todos os arquivos.\n');
      } else {
        const indices = selection
          .split(',')
          .map(s => parseInt(s.trim(), 10) - 1)
          .filter(i => !isNaN(i) && i >= 0 && i < torrent.files.length);

        if (indices.length > 0) {
          indices.forEach(i => torrent.files[i].select());
          totalTargetBytes = indices.reduce((sum, i) => sum + torrent.files[i].length, 0);
          const chosenNames = indices.map(i => torrent.files[i].name).join(', ');
          console.log(`✅ Selecionado(s) para download (${formatBytes(totalTargetBytes)}): ${chosenNames}\n`);
        } else {
          torrent.files.forEach(f => f.select());
          totalTargetBytes = torrent.length;
          console.log('⚠️ Seleção não reconhecida. Baixando todos os arquivos.\n');
        }
      }
    } else {
      torrent.files[0]?.select();
      totalTargetBytes = torrent.length;
    }

    console.log('🚀 Transferência em andamento...\n');
  });

  let lastPrint = 0;
  torrent.on('download', () => {
    const now = Date.now();
    if (now - lastPrint < 500) return;
    lastPrint = now;

    const targetSize = totalTargetBytes > 0 ? totalTargetBytes : torrent.length;
    const percent = targetSize > 0 ? Math.min(100, (torrent.downloaded / targetSize) * 100) : 0;
    const progressBar = createProgressBar(percent, 20);
    const downloadedStr = formatBytes(torrent.downloaded);
    const totalStr = formatBytes(targetSize);
    const speedStr = formatSpeed(torrent.downloadSpeed);
    const timeRemaining = formatTime(torrent.timeRemaining / 1000);
    const peers = torrent.numPeers;

    process.stdout.write(
      `\r[${progressBar}] ${percent.toFixed(1).padStart(5, ' ')}% | ${downloadedStr}/${totalStr} | ⬇️ ${speedStr} | 👥 ${peers} peers | ⏱️ ${timeRemaining}  `
    );
  });

  torrent.on('done', () => {
    console.log('\n\n====================================================');
    console.log('🎉 DOWNLOAD CONCLUÍDO COM SUCESSO!');
    console.log(`📁 Salvo em: ${downloadDir}`);
    console.log(`📦 Arquivo/Pasta: ${torrent.name}`);
    console.log(`📊 Tamanho final: ${formatBytes(totalTargetBytes > 0 ? totalTargetBytes : torrent.length)}`);
    console.log('====================================================\n');

    client.destroy(() => {
      process.exit(0);
    });
  });
}

main().catch(err => {
  console.error('\n❌ Ocorreu um erro inesperado:', err);
  process.exit(1);
});
