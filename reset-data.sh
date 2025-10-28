#!/bin/bash

# 签到签退系统 - 仅重置数据脚本
# 警告：此脚本会删除所有数据库数据！

echo "========================================="
echo -e "\033[1;33m Reset Database Data Only\033[0m"
echo "========================================="
echo ""
echo -e "\033[1;33mThis script will:\033[0m"
echo "  - Stop MongoDB container"
echo -e "  - \033[1;31mDelete MongoDB volume (ALL DATA WILL BE LOST)\033[0m"
echo "  - Restart services with clean database"
echo ""
echo -e "\033[1;32mConfiguration (.env) will be preserved\033[0m"
echo ""

# 确认操作
read -p "Type 'YES' to continue with data reset: " confirmation
if [ "$confirmation" != "YES" ]; then
    echo -e "\033[1;32mReset cancelled.\033[0m"
    exit 0
fi

echo ""
echo -e "\033[1;33mProceeding with data reset...\033[0m"
echo ""

# 进入 Backend 目录
cd "$(dirname "$0")/Backend" || exit 1

# 停止所有服务
echo -e "\033[1;36mStopping all services...\033[0m"
docker compose stop
echo ""

# 删除容器和卷
echo -e "\033[1;36mRemoving containers and volumes...\033[0m"
docker compose down -v
echo ""

# 重新启动服务
echo -e "\033[1;36mRestarting services with clean database...\033[0m"
docker compose up -d
echo ""

echo -e "\033[1;33mWaiting for services to start...\033[0m"
sleep 5

# 检查服务状态
if docker compose ps | grep -q "Up"; then
    echo -e "\033[1;32m[OK] Services restarted successfully!\033[0m"
    echo ""
    docker compose ps
    echo ""
    
    echo "========================================="
    echo -e "\033[1;32m Data Reset Complete!\033[0m"
    echo "========================================="
    echo ""
    echo "Database has been reset to empty state."
    echo ""
    echo -e "\033[1;36mNext steps:\033[0m"
    echo "1. Visit the login page"
    echo "2. You will see the registration form (first-time setup)"
    echo "3. Register the first superadmin account"
    echo ""
else
    echo -e "\033[1;31m[ERROR] Services failed to start\033[0m"
    echo ""
    echo -e "\033[1;33mView logs:\033[0m"
    docker compose logs
    exit 1
fi
