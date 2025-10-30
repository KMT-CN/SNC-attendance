#Requires -RunAsAdministrator

# ANSI Color Codes (PowerShell doesn't support them natively in all terminals, but good for modern ones)
$RED = "`e[31m"
$GREEN = "`e[32m"
$YELLOW = "`e[33m"
$BLUE = "`e[34m"
$NC = "`e[0m" # No Color

# Function to display menu and get user choice
function Show-Menu {
    Write-Host "$BLUE=======================================$NC"
    Write-Host "  SNC Attendance System Deployment"
    Write-Host "$BLUE=======================================$NC"
    Write-Host "Choose an action:"
    Write-Host "  1) ${GREEN}Deploy${NC} services"
    Write-Host "  2) ${RED}Remove${NC} services and data"
    Write-Host "  3) ${YELLOW}Exit${NC}"
    Write-Host "$BLUE---------------------------------------$NC"
    $action_choice = Read-Host "Enter your choice [1-3]"
    return $action_choice
}

# Function to get deployment/removal scope
function Get-Scope {
    Write-Host ""
    Write-Host "$BLUE---------------------------------------$NC"
    Write-Host "Choose the scope:"
    Write-Host "  1) ${GREEN}Backend${NC} only"
    Write-Host "  2) ${GREEN}Frontend${NC} only"
    Write-Host "  3) ${GREEN}All${NC} (Frontend and Backend)"
    Write-Host "  4) ${YELLOW}Back to main menu${NC}"
    Write-Host "$BLUE---------------------------------------$NC"
    $scope_choice = Read-Host "Enter your choice [1-4]"
    return $scope_choice
}

# Function to deploy services
function Deploy-Services($scope) {
    switch ($scope) {
        "backend" {
            Write-Host "`n${GREEN}Deploying Backend...$NC"
            docker-compose -f Backend/docker-compose.yml pull backend
            docker-compose -f Backend/docker-compose.yml up -d --build backend
        }
        "frontend" {
            Write-Host "`n${GREEN}Deploying Frontend...$NC"
            docker-compose -f Frontend/docker-compose.yml pull frontend
            docker-compose -f Frontend/docker-compose.yml up -d --build frontend
        }
        "all" {
            Write-Host "`n${GREEN}Deploying All Services...$NC"
            docker-compose -f Backend/docker-compose.yml pull
            docker-compose -f Frontend/docker-compose.yml pull
            docker-compose -f Backend/docker-compose.yml up -d --build
            docker-compose -f Frontend/docker-compose.yml up -d --build
        }
    }
    Write-Host "`n${GREEN}Deployment complete!$NC"
}

# Function to remove services
function Remove-Services($scope) {
    switch ($scope) {
        "backend" {
            Write-Host "`n${RED}Removing Backend...$NC"
            docker-compose -f Backend/docker-compose.yml down -v --remove-orphans
        }
        "frontend" {
            Write-Host "`n${RED}Removing Frontend...$NC"
            docker-compose -f Frontend/docker-compose.yml down -v --remove-orphans
        }
        "all" {
            Write-Host "`n${RED}Removing All Services...$NC"
            docker-compose -f Backend/docker-compose.yml down -v --remove-orphans
            docker-compose -f Frontend/docker-compose.yml down -v --remove-orphans
        }
    }
    Write-Host "`n${RED}Removal complete!$NC"
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
                    default { Write-Host "${RED}Invalid choice, please try again.$NC" }
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
                    default { Write-Host "${RED}Invalid choice, please try again.$NC" }
                }
            }
        }
        '3' { # Exit
            Write-Host "${YELLOW}Exiting script.$NC"
            exit 0
        }
        default {
            Write-Host "${RED}Invalid choice, please try again.$NC"
        }
    }
    Write-Host "`n"
}
