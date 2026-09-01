$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $projectRoot "edumind-backend"
$frontendPath = Join-Path $projectRoot "edumind-frontend"

$pythonCommand = $null
$virtualEnvironmentCandidates = @(
    (Join-Path $backendPath ".venv\Scripts\python.exe"),
    (Join-Path $backendPath "venv\Scripts\python.exe")
)

foreach ($candidate in $virtualEnvironmentCandidates) {
    if (Test-Path $candidate) {
        $pythonCommand = $candidate
        break
    }
}

if (-not $pythonCommand) {
    $pythonCommand = (Get-Command python -ErrorAction SilentlyContinue).Source
}

if (-not $pythonCommand) {
    $pythonCommand = (Get-Command py -ErrorAction SilentlyContinue).Source
}

if (-not $pythonCommand) {
    throw "Python was not found. Install Python and add it to PATH, or create edumind-backend\.venv."
}

if (-not (Test-Path (Join-Path $frontendPath "node_modules"))) {
    Write-Host "Frontend dependencies are missing. Run 'npm install' in edumind-frontend first."
    exit 1
}

Start-Process -FilePath $pythonCommand `
    -WorkingDirectory $backendPath `
    -ArgumentList "-m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

Start-Process -FilePath "npm.cmd" `
    -WorkingDirectory $frontendPath `
    -ArgumentList "run dev"

Write-Host "EduMind is starting..."
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend:  http://localhost:8000"