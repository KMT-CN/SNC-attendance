# 签到签退系统 - Windows 快速启动脚本

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " 签到签退管理系统 - 快速部署" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Docker
try {
    $dockerVersion = docker --version
    $dockerComposeVersion = docker compose version
    Write-Host "✅ Docker 和 Docker Compose 已安装" -ForegroundColor Green
} catch {
    Write-Host "❌ 错误: Docker 未安装或未运行" -ForegroundColor Red
    Write-Host "请先安装 Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# 进入 Backend 目录
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$scriptPath\Backend"

# 检查 .env 文件
if (-not (Test-Path .env)) {
    Write-Host "📝 创建环境配置文件..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    
    # 生成随机 JWT_SECRET (PowerShell 方式)
    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $jwtSecret = [Convert]::ToBase64String($bytes)
    
    $content = Get-Content .env -Raw
    $content = $content -replace 'JWT_SECRET=.*', "JWT_SECRET=$jwtSecret"
    Set-Content .env -Value $content -NoNewline
    
    Write-Host "✅ 环境配置文件已创建" -ForegroundColor Green
    Write-Host "   JWT_SECRET 已自动生成" -ForegroundColor Green
} else {
    Write-Host "✅ 环境配置文件已存在" -ForegroundColor Green
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
    Write-Host "⚠️  警告: 端口 $backendPort 已被占用" -ForegroundColor Yellow
    Write-Host "   请修改 .env 中的 BACKEND_PORT 或停止占用端口的程序" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ 端口 $backendPort 可用" -ForegroundColor Green
Write-Host ""

# 启动服务
Write-Host "🚀 启动 Docker 服务..." -ForegroundColor Cyan
docker compose up -d

Write-Host ""
Write-Host "⏳ 等待服务启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 检查服务状态
$services = docker compose ps
if ($services -match "Up") {
    Write-Host "✅ 服务启动成功！" -ForegroundColor Green
    Write-Host ""
    docker compose ps
    Write-Host ""
    
    # 测试健康检查
    Write-Host "🔍 测试后端服务..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:$backendPort/health" -UseBasicParsing -TimeoutSec 5
        if ($response.Content -match "ok") {
            Write-Host "✅ 后端服务运行正常" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  后端服务可能还在启动中，请稍等..." -ForegroundColor Yellow
    }
    Write-Host ""
    
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host " 🎉 部署完成！" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 下一步操作：" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. 配置反向代理（必须）" -ForegroundColor White
    Write-Host "   后端只监听 127.0.0.1:$backendPort" -ForegroundColor Gray
    Write-Host "   查看详细配置: Get-Content Backend\REVERSE_PROXY.md" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. 创建管理员账户" -ForegroundColor White
    Write-Host "   curl.exe -X POST http://127.0.0.1:$backendPort/api/auth/register ``" -ForegroundColor Gray
    Write-Host "     -H `"Content-Type: application/json`" ``" -ForegroundColor Gray
    Write-Host "     -d '{`"username`":`"admin`",`"password`":`"your_password`"}'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. 配置前端 API 地址" -ForegroundColor White
    Write-Host "   编辑 Frontend\js\api.js" -ForegroundColor Gray
    Write-Host "   修改 BASE_URL 为你的域名" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. 部署前端" -ForegroundColor White
    Write-Host "   复制 Frontend 目录到 Web 服务器" -ForegroundColor Gray
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "📚 常用命令：" -ForegroundColor Yellow
    Write-Host "   查看日志: docker compose logs -f" -ForegroundColor Gray
    Write-Host "   停止服务: docker compose stop" -ForegroundColor Gray
    Write-Host "   重启服务: docker compose restart" -ForegroundColor Gray
    Write-Host "   删除服务: docker compose down" -ForegroundColor Gray
    Write-Host "=========================================" -ForegroundColor Cyan
} else {
    Write-Host "❌ 服务启动失败" -ForegroundColor Red
    Write-Host ""
    Write-Host "查看日志：" -ForegroundColor Yellow
    docker compose logs
    exit 1
}
