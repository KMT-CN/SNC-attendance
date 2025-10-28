# 签到签退系统 - Windows 快速启动脚本

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Attendance Management - Quick Deploy" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Docker
try {
    $dockerVersion = docker --version
    $dockerComposeVersion = docker compose version
    Write-Host "[OK] Docker and Docker Compose are installed" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker not installed or not running" -ForegroundColor Red
    Write-Host "Please install Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# 进入 Backend 目录
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$scriptPath\Backend"

# 检查 .env 文件
if (-not (Test-Path .env)) {
    Write-Host "Creating .env configuration file..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    
    # 生成随机 JWT_SECRET (PowerShell 方式)
    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $jwtSecret = [Convert]::ToBase64String($bytes)
    
    $content = Get-Content .env -Raw
    $content = $content -replace 'JWT_SECRET=.*', "JWT_SECRET=$jwtSecret"
    Set-Content .env -Value $content -NoNewline
    
    Write-Host "[OK] Environment file created" -ForegroundColor Green
    Write-Host "   JWT_SECRET auto-generated" -ForegroundColor Green
} else {
    Write-Host "[OK] Environment file exists" -ForegroundColor Green
}
Write-Host ""

# 检查端口
$envContent = Get-Content .env | Where-Object { $_ -match 'BACKEND_PORT=' }
if ($envContent) {
    $backendPort = ($envContent -split '=')[1].Trim()
} else {
    $backendPort = 10234
}

$portInUse = netstat -ano | Select-String ":$backendPort " | Select-String "LISTENING"
if ($portInUse) {
    Write-Host "[WARN] Port $backendPort is already in use" -ForegroundColor Yellow
    Write-Host "   Change BACKEND_PORT in .env or stop the process using the port" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Port $backendPort is available" -ForegroundColor Green
Write-Host ""

# 启动服务
Write-Host "Starting Docker services..." -ForegroundColor Cyan
docker compose up -d

Write-Host ""
Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 检查服务状态
$services = docker compose ps
if ($services -match "Up") {
    Write-Host "[OK] Services started successfully!" -ForegroundColor Green
    Write-Host ""
    docker compose ps
    Write-Host ""
    
    # 测试健康检查
    Write-Host "Testing backend service..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:$backendPort/health" -UseBasicParsing -TimeoutSec 5
        if ($response.Content -match "ok") {
            Write-Host "[OK] Backend service healthy" -ForegroundColor Green
        }
    } catch {
        Write-Host "Backend may still be starting; please wait..." -ForegroundColor Yellow
    }
    Write-Host ""
    
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host " Deployment complete!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Configure reverse proxy (required)" -ForegroundColor White
    Write-Host ("   Backend listens on 127.0.0.1:" + $backendPort) -ForegroundColor Gray
    Write-Host "   See: Backend\\REVERSE_PROXY.md" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Create admin account (example)" -ForegroundColor White
    Write-Host ("   curl.exe -X POST http://127.0.0.1:" + $backendPort + "/api/auth/register -H 'Content-Type: application/json' -d") -ForegroundColor Gray
    Write-Host '   {"username":"admin","password":"your_password"}' -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Configure frontend API URL" -ForegroundColor White
    Write-Host "   Edit Frontend\\js\\api.js" -ForegroundColor Gray
    Write-Host "   Set BASE_URL to your domain" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Deploy frontend" -ForegroundColor White
    Write-Host "   Copy the Frontend directory to your web server" -ForegroundColor Gray
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "Common commands:" -ForegroundColor Yellow
    Write-Host "   View logs: docker compose logs -f" -ForegroundColor Gray
    Write-Host "   Stop services: docker compose stop" -ForegroundColor Gray
    Write-Host "   Restart services: docker compose restart" -ForegroundColor Gray
    Write-Host "   Remove services: docker compose down" -ForegroundColor Gray
    Write-Host "=========================================" -ForegroundColor Cyan
} else {
    Write-Host "[ERROR] Service failed to start" -ForegroundColor Red
    Write-Host ""
    Write-Host "View logs:" -ForegroundColor Yellow
    docker compose logs
    exit 1
}
