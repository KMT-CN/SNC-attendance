#!/bin/bash
# Docker 重新构建和部署脚本
# 用途：代码更新后，重新构建镜像并部署
# 使用方法: ./rebuild.sh

echo "========================================"
echo "   Docker 重新构建和部署"
echo "========================================"
echo ""

# 进入 Backend 目录
cd Backend || exit 1

echo "[1/4] 停止现有容器..."
docker compose down

echo ""
echo "[2/4] 重新构建镜像..."
docker compose build --no-cache backend

echo ""
echo "[3/4] 启动服务..."
docker compose up -d

echo ""
echo "[4/4] 等待服务启动..."
sleep 10

echo ""
echo "========================================"
echo "   重新构建完成！"
echo "========================================"
echo ""

# 检查服务状态
echo "检查服务状态:"
docker compose ps

echo ""
echo "测试后端连接:"
if curl -s http://127.0.0.1:10234/health > /dev/null 2>&1; then
    echo "✅ 后端服务正常: $(curl -s http://127.0.0.1:10234/health)"
else
    echo "❌ 后端服务异常，请检查日志: docker compose logs backend"
fi

echo ""
echo "测试系统状态检查:"
if curl -s http://127.0.0.1:10234/api/auth/check-setup > /dev/null 2>&1; then
    echo "✅ check-setup API 正常: $(curl -s http://127.0.0.1:10234/api/auth/check-setup)"
else
    echo "❌ check-setup API 异常"
fi

echo ""
echo "下一步操作:"
echo "  1. 访问 http://localhost:10234（或你的域名）"
echo "  2. 如果是全新系统，会显示注册表单"
echo "  3. 注册第一个用户将成为超级管理员"
echo ""
echo "查看日志: docker compose logs -f backend"

# 返回原目录
cd ..
