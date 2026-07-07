# Creates follow-up GitHub issues on Basa0/upscayl.
# Requires: GitHub CLI + git credentials or GH_TOKEN.

$ErrorActionPreference = 'Stop'
$gh = 'C:\Program Files\GitHub CLI\gh.exe'
$repo = 'Basa0/upscayl'

if (-not (Test-Path $gh)) {
  $cmd = Get-Command gh -ErrorAction SilentlyContinue
  if ($cmd) { $gh = $cmd.Source }
}
if (-not $gh) {
  throw 'GitHub CLI (gh) not found. Install from https://cli.github.com/'
}

if (-not $env:GH_TOKEN) {
  $credInput = "protocol=https`nhost=github.com`n"
  $credOutput = $credInput | git credential fill 2>$null
  $token = ($credOutput | Select-String '^password=(.+)$').Matches.Groups[1].Value
  if ($token) {
    $env:GH_TOKEN = $token
  }
}

function New-Issue {
  param(
    [string]$Title,
    [string]$Body,
    [string[]]$Labels = @()
  )

  $bodyFile = [System.IO.Path]::GetTempFileName()
  try {
    [System.IO.File]::WriteAllText($bodyFile, $Body, [System.Text.UTF8Encoding]::new($false))

    $args = @('issue', 'create', '--repo', $repo, '--title', $Title, '--body-file', $bodyFile)
    foreach ($label in $Labels) {
      $args += @('--label', $label)
    }

    $url = & $gh @args 2>&1
    if ($LASTEXITCODE -ne 0) {
      throw ($url -join "`n")
    }
    return ($url | Select-Object -Last 1).Trim()
  }
  finally {
    Remove-Item -Force $bodyFile -ErrorAction SilentlyContinue
  }
}

$issues = @(
  @{
    Title = 'Hide metadata toggle until EXIF copy is implemented'
    Labels = @('bug')
    Body = @'
The "Copy metadata" toggle is visible in Settings and persists to `localStorage`, and `copy_metadata` is sent to Rust — but `upscaler.rs` has only a `TODO(metadata)` and never copies EXIF. Users who enable it will silently lose metadata.

**Options:**
- Hide the toggle (like auto-update) until implemented
- Or implement with a Rust crate such as `little_exif`

**Refs:** `src/app/components/sidebar/settings-tab.component.ts`, `src-tauri/src/upscaler.rs` (~line 234)
'@
  }
  @{
    Title = 'Wire auto-update via tauri-plugin-updater'
    Labels = @('enhancement')
    Body = @'
Auto-update was deferred in the Tauri migration. `autoUpdate` persists in settings but does nothing; the settings toggle is commented out with `TODO(updater)`.

**Tasks:**
- Add `tauri-plugin-updater` and signing keypair
- Add pubkey to `tauri.conf.json`
- Enable updater artifacts in `.github/workflows/release.yml`
- Un-comment settings toggle

**Refs:** `src-tauri/src/lib.rs`, `settings-tab.component.ts`, `release.yml`
'@
  }
  @{
    Title = 'Restore i18n / language switcher'
    Labels = @('enhancement')
    Body = @'
Migration kept English only (`src/assets/locales/en.json`). Original had 20 locales under `renderer/locales/`.

**Tasks:**
- Restore locale JSON files from `main`
- Lazy-load locales in `TranslationService`
- Add language switcher in Settings
'@
  }
  @{
    Title = 'UI polish pass'
    Labels = @('enhancement')
    Body = @'
Core flows work but several UI areas need refinement after the Electron → Angular port (layout, spacing, component styling, sidebar/main content balance).

Track specific items as sub-tasks or comments as they are found during use.
'@
  }
  @{
    Title = 'Restore model picker fullscreen zoom'
    Labels = @('enhancement')
    Body = @'
Original model dialog had a per-model fullscreen before/after zoom. New dialog shows larger inline comparisons but no zoom view.

**Tasks:**
- Add second native `<dialog>` for fullscreen before/after
- Reference: `main:renderer/components/sidebar/upscayl-tab/select-model-dialog.tsx`
'@
  }
  @{
    Title = 'Restore first-run onboarding dialog'
    Labels = @('enhancement')
    Body = @'
First-run onboarding was removed in migration. Port from `main:renderer/components/main-content/onboarding-dialog.tsx`, gated by a `localStorage` flag.
'@
  }
  @{
    Title = 'Remove or wire up dead userStats setting'
    Labels = @('enhancement')
    Body = @'
`userStats` is persisted in `SettingsService` but nothing updates or displays it after PostHog was removed. Either remove the signal and storage key, or reintroduce a local stats display if desired.

**Ref:** `src/app/services/settings.service.ts`
'@
  }
  @{
    Title = 'Document fork differences from upstream Upscayl'
    Labels = @('documentation')
    Body = @'
Add a README section (or `FORK.md`) documenting:

- Stack change (Electron → Tauri + Angular)
- Intentionally dropped features (cloud, analytics, news, MAS, locales)
- Deferred features (updater, metadata, onboarding)
- Build/run instructions for the new stack
'@
  }
)

Write-Host "Creating issues on $repo ..."
foreach ($issue in $issues) {
  $url = New-Issue -Title $issue.Title -Body $issue.Body -Labels $issue.Labels
  Write-Host "Created: $url"
}

Write-Host "Done. $($issues.Count) issues created on $repo."
