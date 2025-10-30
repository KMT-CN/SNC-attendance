#Requires -RunAsAdministrator

# ANSI 颜色代码（PowerShell 在某些终端中不完全支持，但在现代终端中通常可用）
$RED = "`e[31m"
$GREEN = "`e[32m"
$YELLOW = "`e[33m"
$BLUE = "`e[34m"
$NC = "`e[0m" # No Color

# Function to display menu and get user choice
function Show-Menu {
    Write-Host "$BLUE=======================================$NC"
    Write-Host "  SNC 考勤系统 部署脚本"
    Write-Host "$BLUE=======================================$NC"
    Write-Host "请选择操作："
    Write-Host "  1) ${GREEN}部署${NC} 服务"
    Write-Host "  2) ${RED}移除${NC} 服务与数据"
    Write-Host "  3) ${YELLOW}退出${NC}"
    Write-Host "$BLUE---------------------------------------$NC"
    $action_choice = Read-Host "请输入您的选择 [1-3]"
    return $action_choice
}

# Function to get deployment/removal scope
function Get-Scope {
    Write-Host ""
    Write-Host "$BLUE---------------------------------------$NC"
    Write-Host "请选择范围："
    Write-Host "  1) ${GREEN}仅 后端${NC}"
    Write-Host "  2) ${GREEN}仅 前端${NC}"
    Write-Host "  3) ${GREEN}全部${NC}（前后端）"
    Write-Host "  4) ${YELLOW}返回主菜单${NC}"
    Write-Host "$BLUE---------------------------------------$NC"
    $scope_choice = Read-Host "请输入您的选择 [1-4]"
    return $scope_choice
}

# Function to deploy services
function Deploy-Services($scope) {
    switch ($scope) {
        "backend" {
            Write-Host "`n${GREEN}正在部署 后端...${NC}"
            docker-compose -f Backend/docker-compose.yml pull backend
            docker-compose -f Backend/docker-compose.yml up -d --build backend
        }
        "frontend" {
            Write-Host "`n${GREEN}正在部署 前端...${NC}"
            docker-compose -f Frontend/docker-compose.yml pull frontend
            docker-compose -f Frontend/docker-compose.yml up -d --build frontend
        }
        "all" {
            Write-Host "`n${GREEN}正在部署 所有服务...${NC}"
            docker-compose -f Backend/docker-compose.yml pull
            docker-compose -f Frontend/docker-compose.yml pull
            docker-compose -f Backend/docker-compose.yml up -d --build
            docker-compose -f Frontend/docker-compose.yml up -d --build
        }
    }
    Write-Host "`n${GREEN}部署完成！${NC}"
}

# Function to remove services
function Remove-Services($scope) {
    switch ($scope) {
        "backend" {
            Write-Host "`n${RED}正在移除 后端...${NC}"
            docker-compose -f Backend/docker-compose.yml down -v --remove-orphans
        }
        "frontend" {
            Write-Host "`n${RED}正在移除 前端...${NC}"
            docker-compose -f Frontend/docker-compose.yml down -v --remove-orphans
        }
        "all" {
            Write-Host "`n${RED}正在移除 所有服务...${NC}"
            docker-compose -f Backend/docker-compose.yml down -v --remove-orphans
            docker-compose -f Frontend/docker-compose.yml down -v --remove-orphans
        }
    }
    Write-Host "`n${RED}移除完成！${NC}"
}

# Main loop
while ($true) {
    $action_choice = Show-Menu
    switch ($action_choice) {
        '1' { # Deploy
            while ($true) {
                $scope_choice = Get-Scope
                switch ($scope_choice) {
                    '1' { Deploy-Services "backend"; break }
                    '2' { Deploy-Services "frontend"; break }
                    '3' { Deploy-Services "all"; break }
                    '4' { break }
                    default { Write-Host "${RED}无效选择，请重试。${NC}" }
                }
            }
        }
        '2' { # Remove
            while ($true) {
                $scope_choice = Get-Scope
                switch ($scope_choice) {
                    '1' { Remove-Services "backend"; break }
                    '2' { Remove-Services "frontend"; break }
                    '3' { Remove-Services "all"; break }
                    '4' { break }
                    default { Write-Host "${RED}无效选择，请重试。${NC}" }
                }
            }
        }
        '3' { # Exit
            Write-Host "${YELLOW}退出脚本。${NC}"
            exit 0
        }
        default {
            Write-Host "${RED}无效选择，请重试。${NC}"
        }
    }
    Write-Host "`n"
}
