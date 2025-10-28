# 签到签退系统 - 仅重置数据脚本
# 警告：此脚本会删除所有数据库数据！

Write-Host "=========================================" -ForegroundColor Yellow
Write-Host " Reset Database Data Only" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "This script will:" -ForegroundColor Yellow
Write-Host "  - Stop MongoDB container" -ForegroundColor Yellow
Write-Host "  - Delete MongoDB volume (ALL DATA WILL BE LOST)" -ForegroundColor Red
Write-Host "  - Restart services with clean database" -ForegroundColor Yellow
Write-Host ""
Write-Host "Configuration (.env) will be preserved" -ForegroundColor Green
Write-Host ""

# 确认操作
$confirmation = Read-Host "Type 'YES' to continue with data reset"
if ($confirmation -ne "YES") {
    Write-Host "Reset cancelled." -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "Proceeding with data reset..." -ForegroundColor Yellow
Write-Host ""

# 进入 Backend 目录
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$scriptPath\Backend"

# 停止所有服务
Write-Host "Stopping all services..." -ForegroundColor Cyan
docker compose stop
Write-Host ""

# 删除容器和卷
Write-Host "Removing containers and volumes..." -ForegroundColor Cyan
docker compose down -v
Write-Host ""

# 重新启动服务
Write-Host "Restarting services with clean database..." -ForegroundColor Cyan
docker compose up -d
Write-Host ""

Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 检查服务状态
$services = docker compose ps
if ($services -match "Up") {
    Write-Host "[OK] Services restarted successfully!" -ForegroundColor Green
    Write-Host ""
    docker compose ps
    Write-Host ""
    
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host " Data Reset Complete!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Database has been reset to empty state." -ForegroundColor White
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Visit the login page" -ForegroundColor White
    Write-Host "2. You will see the registration form (first-time setup)" -ForegroundColor White
    Write-Host "3. Register the first superadmin account" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "[ERROR] Services failed to start" -ForegroundColor Red
    Write-Host ""
    Write-Host "View logs:" -ForegroundColor Yellow
    docker compose logs
    exit 1
}
