# 签到签退系统 - 完全重置脚本
# 警告：此脚本会删除所有数据和配置！

Write-Host "=========================================" -ForegroundColor Red
Write-Host " DANGER: Complete System Reset" -ForegroundColor Red
Write-Host "=========================================" -ForegroundColor Red
Write-Host ""
Write-Host "This script will:" -ForegroundColor Yellow
Write-Host "  - Stop all Docker containers" -ForegroundColor Yellow
Write-Host "  - Remove all containers" -ForegroundColor Yellow
Write-Host "  - Delete all volumes (ALL DATA WILL BE LOST)" -ForegroundColor Red
Write-Host "  - Remove all images" -ForegroundColor Yellow
Write-Host "  - Delete .env configuration" -ForegroundColor Yellow
Write-Host ""

# 确认操作
$confirmation = Read-Host "Type 'YES' to continue with complete reset"
if ($confirmation -ne "YES") {
    Write-Host "Reset cancelled." -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "Proceeding with complete reset..." -ForegroundColor Red
Write-Host ""

# 进入 Backend 目录
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$scriptPath\Backend"

# 停止所有服务
Write-Host "Stopping all services..." -ForegroundColor Yellow
docker compose stop
Write-Host ""

# 删除容器、网络和卷
Write-Host "Removing containers, networks, and volumes..." -ForegroundColor Yellow
docker compose down -v --remove-orphans
Write-Host ""

# 删除镜像
Write-Host "Removing images..." -ForegroundColor Yellow
$images = docker images --filter=reference='attendance-backend*' -q
if ($images) {
    docker rmi $images -f
    Write-Host "[OK] Images removed" -ForegroundColor Green
} else {
    Write-Host "[INFO] No images to remove" -ForegroundColor Gray
}
Write-Host ""

# 删除 .env 文件
if (Test-Path .env) {
    Write-Host "Removing .env configuration..." -ForegroundColor Yellow
    Remove-Item .env
    Write-Host "[OK] .env file removed" -ForegroundColor Green
} else {
    Write-Host "[INFO] No .env file found" -ForegroundColor Gray
}
Write-Host ""

# 清理 Docker 系统（可选）
Write-Host "Cleaning up Docker system..." -ForegroundColor Yellow
docker system prune -f
Write-Host ""

Write-Host "=========================================" -ForegroundColor Green
Write-Host " Reset Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "All data, configurations, and containers have been removed." -ForegroundColor White
Write-Host ""
Write-Host "To redeploy the system:" -ForegroundColor Cyan
Write-Host "  .\\deploy.ps1" -ForegroundColor White
Write-Host ""
Write-Host "This will create a fresh installation." -ForegroundColor Gray
Write-Host ""
