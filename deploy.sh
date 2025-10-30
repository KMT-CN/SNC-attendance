#!/bin/bash

# ANSI Color Codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display menu and get user choice
show_menu() {
    echo -e "${BLUE}=======================================${NC}"
    echo -e "  SNC Attendance System Deployment"
    echo -e "${BLUE}=======================================${NC}"
    echo -e "Choose an action:"
    echo -e "  1) ${GREEN}Deploy${NC} services"
    echo -e "  2) ${RED}Remove${NC} services and data"
    echo -e "  3) ${YELLOW}Exit${NC}"
    echo -e "${BLUE}---------------------------------------${NC}"
    read -p "Enter your choice [1-3]: " action_choice
}

# Function to get deployment/removal scope
get_scope() {
    echo -e "\n${BLUE}---------------------------------------${NC}"
    echo -e "Choose the scope:"
    echo -e "  1) ${GREEN}Backend${NC} only"
    echo -e "  2) ${GREEN}Frontend${NC} only"
    echo -e "  3) ${GREEN}All${NC} (Frontend and Backend)"
    echo -e "  4) ${YELLOW}Back to main menu${NC}"
    echo -e "${BLUE}---------------------------------------${NC}"
    read -p "Enter your choice [1-4]: " scope_choice
}

# Function to deploy services
deploy() {
    case $1 in
        "backend")
            echo -e "\n${GREEN}Deploying Backend...${NC}"
            docker-compose -f Backend/docker-compose.yml pull backend
            docker-compose -f Backend/docker-compose.yml up -d --build backend
            ;;
        "frontend")
            echo -e "\n${GREEN}Deploying Frontend...${NC}"
            docker-compose -f Frontend/docker-compose.yml pull frontend
            docker-compose -f Frontend/docker-compose.yml up -d --build frontend
            ;;
        "all")
            echo -e "\n${GREEN}Deploying All Services...${NC}"
            docker-compose -f Backend/docker-compose.yml pull
            docker-compose -f Frontend/docker-compose.yml pull
            docker-compose -f Backend/docker-compose.yml up -d --build
            docker-compose -f Frontend/docker-compose.yml up -d --build
            ;;
    esac
    echo -e "\n${GREEN}Deployment complete!${NC}"
}

# Function to remove services
remove() {
    case $1 in
        "backend")
            echo -e "\n${RED}Removing Backend...${NC}"
            docker-compose -f Backend/docker-compose.yml down -v --remove-orphans
            ;;
        "frontend")
            echo -e "\n${RED}Removing Frontend...${NC}"
            docker-compose -f Frontend/docker-compose.yml down -v --remove-orphans
            ;;
        "all")
            echo -e "\n${RED}Removing All Services...${NC}"
            docker-compose -f Backend/docker-compose.yml down -v --remove-orphans
            docker-compose -f Frontend/docker-compose.yml down -v --remove-orphans
            ;;
    esac
    echo -e "\n${RED}Removal complete!${NC}"
}


# Main loop
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
                    *) echo -e "${RED}Invalid choice, please try again.${NC}" ;;
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
                    *) echo -e "${RED}Invalid choice, please try again.${NC}" ;;
                esac
            done
            ;;
        3) # Exit
            echo -e "${YELLOW}Exiting script.${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice, please try again.${NC}"
            ;;
    esac
    echo -e "\n"
done
