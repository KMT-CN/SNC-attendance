# Docker rebuild and redeploy script# Docker 重新构建和部署脚本

# Usage: .\rebuild.ps1# 用途：代码更新后，重新构建镜像并部署

# 使用方法: .\rebuild.ps1

Write-Host "========================================" -ForegroundColor Cyan

Write-Host "   Docker Rebuild and Deploy" -ForegroundColor CyanWrite-Host "========================================" -ForegroundColor Cyan

Write-Host "========================================" -ForegroundColor CyanWrite-Host "   Docker 重新构建和部署" -ForegroundColor Cyan

Write-Host ""Write-Host "========================================" -ForegroundColor Cyan

Write-Host ""

# Enter Backend directory

Set-Location -Path "Backend"# 进入 Backend 目录

Set-Location -Path "Backend"

Write-Host "[1/4] Stopping containers..." -ForegroundColor Yellow

docker compose downWrite-Host "[1/4] 停止现有容器..." -ForegroundColor Yellow

docker compose down

Write-Host ""

Write-Host "[2/4] Rebuilding image..." -ForegroundColor YellowWrite-Host ""

docker compose build --no-cache backendWrite-Host "[2/4] 重新构建镜像..." -ForegroundColor Yellow

docker compose build --no-cache backend

Write-Host ""

Write-Host "[3/4] Starting services..." -ForegroundColor YellowWrite-Host ""

docker compose up -dWrite-Host "[3/4] 启动服务..." -ForegroundColor Yellow

docker compose up -d

Write-Host ""

Write-Host "[4/4] Waiting for services..." -ForegroundColor YellowWrite-Host ""

Start-Sleep -Seconds 10Write-Host "[4/4] 等待服务启动..." -ForegroundColor Yellow

Start-Sleep -Seconds 10

Write-Host ""

Write-Host "========================================" -ForegroundColor GreenWrite-Host ""

Write-Host "   Rebuild Complete!" -ForegroundColor GreenWrite-Host "========================================" -ForegroundColor Green

Write-Host "========================================" -ForegroundColor GreenWrite-Host "   重新构建完成！" -ForegroundColor Green

Write-Host ""Write-Host "========================================" -ForegroundColor Green

Write-Host ""

# Check service status

Write-Host "Service Status:" -ForegroundColor Cyan# 检查服务状态

docker compose psWrite-Host "检查服务状态:" -ForegroundColor Cyan

docker compose ps

Write-Host ""

Write-Host "Testing backend connection:" -ForegroundColor CyanWrite-Host ""

try {Write-Host "测试后端连接:" -ForegroundColor Cyan

    $response = Invoke-WebRequest -Uri "http://127.0.0.1:10234/health" -UseBasicParsing -TimeoutSec 5try {

    Write-Host "✅ Backend OK: " -ForegroundColor Green -NoNewline    $response = Invoke-WebRequest -Uri "http://127.0.0.1:10234/health" -UseBasicParsing -TimeoutSec 5

    Write-Host $response.Content    Write-Host "✅ 后端服务正常: " -ForegroundColor Green -NoNewline

} catch {    Write-Host $response.Content

    Write-Host "❌ Backend error, check logs: docker compose logs backend" -ForegroundColor Red} catch {

}    Write-Host "❌ 后端服务异常，请检查日志: docker compose logs backend" -ForegroundColor Red

}

Write-Host ""

Write-Host "Testing check-setup API:" -ForegroundColor CyanWrite-Host ""

try {Write-Host "测试系统状态检查:" -ForegroundColor Cyan

    $response = Invoke-WebRequest -Uri "http://127.0.0.1:10234/api/auth/check-setup" -UseBasicParsing -TimeoutSec 5try {

    Write-Host "✅ check-setup API OK: " -ForegroundColor Green -NoNewline    $response = Invoke-WebRequest -Uri "http://127.0.0.1:10234/api/auth/check-setup" -UseBasicParsing -TimeoutSec 5

    Write-Host $response.Content    Write-Host "✅ check-setup API 正常: " -ForegroundColor Green -NoNewline

} catch {    Write-Host $response.Content

    Write-Host "❌ check-setup API error: $_" -ForegroundColor Red} catch {

}    Write-Host "❌ check-setup API 异常: $_" -ForegroundColor Red

}

Write-Host ""

Write-Host "Next Steps:" -ForegroundColor CyanWrite-Host ""

Write-Host "  1. Visit http://localhost:10234" -ForegroundColor WhiteWrite-Host "下一步操作:" -ForegroundColor Cyan

Write-Host "  2. Register first user (becomes superadmin)" -ForegroundColor WhiteWrite-Host "  1. 访问 http://localhost:10234（或你的域名）" -ForegroundColor White

Write-Host "  3. Manage users in dashboard" -ForegroundColor WhiteWrite-Host "  2. 如果是全新系统，会显示注册表单" -ForegroundColor White

Write-Host ""Write-Host "  3. 注册第一个用户将成为超级管理员" -ForegroundColor White

Write-Host "View logs: docker compose logs -f backend" -ForegroundColor GrayWrite-Host ""

Write-Host "查看日志: docker compose logs -f backend" -ForegroundColor Gray

# Return to original directory

Set-Location -Path ".."# 返回原目录

Set-Location -Path ".."
