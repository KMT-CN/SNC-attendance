#!/bin/bash

# 签到签退系统 - 快速启动脚本

set -e

echo "========================================="
echo " 签到签退管理系统 - 快速部署"
echo "========================================="
echo ""

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: Docker 未安装"
    echo "请先安装 Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo "❌ 错误: Docker Compose 未安装"
    echo "请先安装 Docker Compose"
    exit 1
fi

echo "✅ Docker 和 Docker Compose 已安装"
echo ""

# 进入 Backend 目录
cd "$(dirname "$0")/Backend"

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "📝 创建环境配置文件..."
    cp .env.example .env
    
    # 生成随机 JWT_SECRET
    JWT_SECRET=$(openssl rand -base64 32)
    if [ "$(uname)" = "Darwin" ]; then
        sed -i '' "s/JWT_SECRET=.*/JWT_SECRET=${JWT_SECRET}/" .env
    else
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=${JWT_SECRET}/" .env
    fi
    
    echo "✅ 环境配置文件已创建"
    echo "   JWT_SECRET 已自动生成"
else
    echo "✅ 环境配置文件已存在"
fi
echo ""

# 检查端口
BACKEND_PORT=$(grep BACKEND_PORT .env | cut -d '=' -f2 | tr -d ' ')
BACKEND_PORT=${BACKEND_PORT:-10234}

if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  警告: 端口 $BACKEND_PORT 已被占用"
    echo "   请修改 .env 中的 BACKEND_PORT 或停止占用端口的程序"
    exit 1
fi

echo "✅ 端口 $BACKEND_PORT 可用"
echo ""

# 启动服务
echo "🚀 启动 Docker 服务..."
docker compose up -d

echo ""
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
if docker compose ps | grep -q "Up"; then
    echo "✅ 服务启动成功！"
    echo ""
    docker compose ps
    echo ""
    
    # 测试健康检查
    echo "🔍 测试后端服务..."
    if curl -s http://127.0.0.1:$BACKEND_PORT/health | grep -q "ok"; then
        echo "✅ 后端服务运行正常"
    else
        echo "⚠️  后端服务可能还在启动中，请稍等..."
    fi
    echo ""
    
    echo "========================================="
    echo " 🎉 部署完成！"
    echo "========================================="
    echo ""
    echo "📝 下一步操作："
    echo ""
    echo "1. 配置反向代理（必须）"
    echo "   后端只监听 127.0.0.1:$BACKEND_PORT"
    echo "   查看详细配置: cat Backend/REVERSE_PROXY.md"
    echo ""
    echo "2. 创建管理员账户"
    echo "   curl -X POST http://127.0.0.1:$BACKEND_PORT/api/auth/register \\"
    echo "     -H \"Content-Type: application/json\" \\"
    echo "     -d '{\"username\":\"admin\",\"password\":\"your_password\"}'"
    echo ""
    echo "3. 配置前端 API 地址"
    echo "   编辑 Frontend/js/api.js"
    echo "   修改 BASE_URL 为你的域名"
    echo ""
    echo "4. 部署前端"
    echo "   sudo cp -r Frontend/* /var/www/attendance/"
    echo ""
    echo "========================================="
    echo "📚 常用命令："
    echo "   查看日志: docker compose logs -f"
    echo "   停止服务: docker compose stop"
    echo "   重启服务: docker compose restart"
    echo "   删除服务: docker compose down"
    echo "========================================="
else
    echo "❌ 服务启动失败"
    echo ""
    echo "查看日志："
    docker compose logs
    exit 1
fi
