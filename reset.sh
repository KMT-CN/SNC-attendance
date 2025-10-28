#!/bin/bash

# 签到签退系统 - 完全重置脚本
# 警告：此脚本会删除所有数据和配置！

echo "========================================="
echo -e "\033[1;31m DANGER: Complete System Reset\033[0m"
echo "========================================="
echo ""
echo -e "\033[1;33mThis script will:\033[0m"
echo "  - Stop all Docker containers"
echo "  - Remove all containers"
echo -e "  - \033[1;31mDelete all volumes (ALL DATA WILL BE LOST)\033[0m"
echo "  - Remove all images"
echo "  - Delete .env configuration"
echo ""

# 确认操作
read -p "Type 'YES' to continue with complete reset: " confirmation
if [ "$confirmation" != "YES" ]; then
    echo -e "\033[1;32mReset cancelled.\033[0m"
    exit 0
fi

echo ""
echo -e "\033[1;31mProceeding with complete reset...\033[0m"
echo ""

# 进入 Backend 目录
cd "$(dirname "$0")/Backend" || exit 1

# 停止所有服务
echo -e "\033[1;33mStopping all services...\033[0m"
docker compose stop
echo ""

# 删除容器、网络和卷
echo -e "\033[1;33mRemoving containers, networks, and volumes...\033[0m"
docker compose down -v --remove-orphans
echo ""

# 删除镜像
echo -e "\033[1;33mRemoving images...\033[0m"
images=$(docker images --filter=reference='attendance-backend*' -q)
if [ -n "$images" ]; then
    docker rmi $images -f
    echo -e "\033[1;32m[OK] Images removed\033[0m"
else
    echo -e "\033[0;37m[INFO] No images to remove\033[0m"
fi
echo ""

# 删除 .env 文件
if [ -f .env ]; then
    echo -e "\033[1;33mRemoving .env configuration...\033[0m"
    rm .env
    echo -e "\033[1;32m[OK] .env file removed\033[0m"
else
    echo -e "\033[0;37m[INFO] No .env file found\033[0m"
fi
echo ""

# 清理 Docker 系统（可选）
echo -e "\033[1;33mCleaning up Docker system...\033[0m"
docker system prune -f
echo ""

echo "========================================="
echo -e "\033[1;32m Reset Complete!\033[0m"
echo "========================================="
echo ""
echo "All data, configurations, and containers have been removed."
echo ""
echo -e "\033[1;36mTo redeploy the system:\033[0m"
echo "  ./deploy.sh"
echo ""
echo "This will create a fresh installation."
echo ""
