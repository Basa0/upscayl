const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const root = path.resolve(__dirname, "..");
const nsisDir = path.join(
  root,
  "src-tauri",
  "target",
  "release",
  "bundle",
  "nsis",
);

if (process.platform !== "win32") {
  console.error("This script only runs on Windows.");
  process.exit(1);
}

if (!fs.existsSync(nsisDir)) {
  console.error(`NSIS bundle directory not found: ${nsisDir}`);
  console.error("Run `npm run build` first to generate the Windows installer.");
  process.exit(1);
}

const installers = fs
  .readdirSync(nsisDir)
  .filter((name) => name.endsWith("-setup.exe"))
  .map((name) => {
    const fullPath = path.join(nsisDir, name);
    return { name, fullPath, mtimeMs: fs.statSync(fullPath).mtimeMs };
  })
  .sort((a, b) => b.mtimeMs - a.mtimeMs);

if (installers.length === 0) {
  console.error(`No NSIS installer found in ${nsisDir}`);
  console.error("Run `npm run build` first to generate the Windows installer.");
  process.exit(1);
}

const installer = installers[0];
console.log(`Launching installer: ${installer.name}`);

const child = spawn(`"${installer.fullPath}"`, [], {
  detached: true,
  stdio: "ignore",
  shell: true,
  windowsHide: true,
});

child.on("error", (error) => {
  console.error(`Failed to launch installer: ${error.message}`);
  process.exit(1);
});

child.unref();
