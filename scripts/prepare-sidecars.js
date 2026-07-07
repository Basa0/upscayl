const fs = require('fs');
const path = require('path');
const os = require('os');

const root = path.resolve(__dirname, '..');
const binariesDir = path.join(root, 'src-tauri', 'binaries');

const platformMap = {
  win32: 'win',
  darwin: 'mac',
  linux: 'linux',
};

const tripleMap = {
  'win32-x64': 'x86_64-pc-windows-msvc',
  'darwin-arm64': 'aarch64-apple-darwin',
  'darwin-x64': 'x86_64-apple-darwin',
  'linux-x64': 'x86_64-unknown-linux-gnu',
};

const platform = platformMap[process.platform];
if (!platform) {
  console.error(`Unsupported platform: ${process.platform}`);
  process.exit(1);
}

const arch = process.arch === 'arm64' ? 'arm64' : 'x64';
const tripleKey = `${process.platform}-${arch}`;
const triple = tripleMap[tripleKey];

if (!triple) {
  console.error(`Unsupported target triple key: ${tripleKey}`);
  process.exit(1);
}

const sourceBinDir = path.join(root, 'resources', platform, 'bin');
const sourceBin = path.join(
  sourceBinDir,
  process.platform === 'win32' ? 'upscayl-bin.exe' : 'upscayl-bin',
);

if (!fs.existsSync(sourceBin)) {
  console.warn(`Warning: sidecar binary not found at ${sourceBin}`);
  console.warn('Run update_upscayl_ncnn_binaries.sh or place binaries manually.');
}

fs.mkdirSync(binariesDir, { recursive: true });

const ext = process.platform === 'win32' ? '.exe' : '';
const destName = `upscayl-bin-${triple}${ext}`;
const destBin = path.join(binariesDir, destName);

if (fs.existsSync(sourceBin)) {
  fs.copyFileSync(sourceBin, destBin);
  if (process.platform !== 'win32') {
    fs.chmodSync(destBin, 0o755);
  }
  console.log(`Copied sidecar -> ${destBin}`);
}

if (process.platform === 'win32') {
  for (const dll of ['vcomp140.dll', 'vcomp140d.dll']) {
    const src = path.join(sourceBinDir, dll);
    const dest = path.join(binariesDir, dll);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`Copied ${dll} -> ${dest}`);
    }
  }
}

console.log(`Prepared sidecars for ${triple}`);
