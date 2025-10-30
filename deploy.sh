#!/bin/bash

# ANSI 颜色代码
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 显示菜单并获取用户选择的函数
show_menu() {
    echo -e "${BLUE}=======================================${NC}"
    echo -e "  SNC 考勤系统 部署脚本"
    echo -e "${BLUE}=======================================${NC}"
    echo -e "请选择操作："
    echo -e "  1) ${GREEN}部署${NC} 服务"
    echo -e "  2) ${RED}移除${NC} 服务与数据"
    echo -e "  3) ${YELLOW}退出${NC}"
    echo -e "${BLUE}---------------------------------------${NC}"
    read -p "请输入您的选择 [1-3]: " action_choice
}

# 获取部署/移除范围的函数
get_scope() {
    echo -e "\n${BLUE}---------------------------------------${NC}"
    echo -e "请选择范围："
    echo -e "  1) ${GREEN}仅 后端${NC}"
    echo -e "  2) ${GREEN}仅 前端${NC}"
    echo -e "  3) ${GREEN}全部${NC}（前后端）"
    echo -e "  4) ${YELLOW}返回主菜单${NC}"
    echo -e "${BLUE}---------------------------------------${NC}"
    read -p "请输入您的选择 [1-4]: " scope_choice
}

# Function to deploy services
deploy() {
    case $1 in
        "backend")
            echo -e "\n${GREEN}正在部署 后端...${NC}"
            docker-compose -f Backend/docker-compose.yml pull backend
            docker-compose -f Backend/docker-compose.yml up -d --build backend
            ;;
        "frontend")
            echo -e "\n${GREEN}正在部署 前端...${NC}"
            docker-compose -f Frontend/docker-compose.yml pull frontend
            docker-compose -f Frontend/docker-compose.yml up -d --build frontend
            ;;
        "all")
            echo -e "\n${GREEN}正在部署 所有服务...${NC}"
            docker-compose -f Backend/docker-compose.yml pull
            docker-compose -f Frontend/docker-compose.yml pull
            docker-compose -f Backend/docker-compose.yml up -d --build
            docker-compose -f Frontend/docker-compose.yml up -d --build
            ;;
    esac
    echo -e "\n${GREEN}部署完成！${NC}"
}

# Function to remove services
remove() {
    case $1 in
        "backend")
            echo -e "\n${RED}正在移除 后端...${NC}"
            docker-compose -f Backend/docker-compose.yml down -v --remove-orphans
            ;;
        "frontend")
            echo -e "\n${RED}正在移除 前端...${NC}"
            docker-compose -f Frontend/docker-compose.yml down -v --remove-orphans
            ;;
        "all")
            echo -e "\n${RED}正在移除 所有服务...${NC}"
            docker-compose -f Backend/docker-compose.yml down -v --remove-orphans
            docker-compose -f Frontend/docker-compose.yml down -v --remove-orphans
            ;;
    esac
    echo -e "\n${RED}移除完成！${NC}"
}


# 主循环
while true; do
    show_menu
    case $action_choice in
        1) # Deploy
            while true; do
                get_scope
                case $scope_choice in
                    1) deploy "backend"; break ;;
                    2) deploy "frontend"; break ;;
                    3) deploy "all"; break ;;
                    4) break ;;
                    *) echo -e "${RED}无效选择，请重试。${NC}" ;;
                esac
            done
            ;;
        2) # Remove
            while true; do
                get_scope
                case $scope_choice in
                    1) remove "backend"; break ;;
                    2) remove "frontend"; break ;;
                    3) remove "all"; break ;;
                    4) break ;;
                    *) echo -e "${RED}无效选择，请重试。${NC}" ;;
                esac
            done
            ;;
        3) # Exit
            echo -e "${YELLOW}退出脚本。${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}无效选择，请重试。${NC}"
            ;;
    esac
    echo -e "\n"
done
