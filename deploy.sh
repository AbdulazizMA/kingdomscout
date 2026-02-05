#!/bin/bash
set -e

# ==========================================
# KingdomScout - One-Command Deployment
# ==========================================
# Usage: ./deploy.sh [command]
#   ./deploy.sh          - Full deploy (build + start)
#   ./deploy.sh start    - Start existing containers
#   ./deploy.sh stop     - Stop all containers
#   ./deploy.sh restart  - Restart all containers
#   ./deploy.sh rebuild  - Rebuild and restart
#   ./deploy.sh logs     - View logs
#   ./deploy.sh seed     - Seed database with sample data
#   ./deploy.sh status   - Check service health
# ==========================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Install it from https://docs.docker.com/get-docker/"
        exit 1
    fi

    if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed."
        exit 1
    fi

    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running. Start Docker first."
        exit 1
    fi

    log_success "Prerequisites OK"
}

# Docker compose command (v2 vs v1)
dc() {
    if docker compose version &> /dev/null 2>&1; then
        docker compose "$@"
    else
        docker-compose "$@"
    fi
}

# Setup environment
setup_env() {
    if [ ! -f .env ]; then
        log_info "Creating .env from .env.example..."
        cp .env.example .env

        # Generate a random JWT secret
        JWT=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)
        if [ -n "$JWT" ]; then
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s/change-me-to-a-random-64-char-string/$JWT/" .env
            else
                sed -i "s/change-me-to-a-random-64-char-string/$JWT/" .env
            fi
            log_success "Generated random JWT secret"
        fi

        log_warn "Review .env file and update values as needed"
        log_warn "Especially: POSTGRES_PASSWORD, FRONTEND_URL, NEXT_PUBLIC_API_URL"
    else
        log_success ".env file exists"
    fi
}

# Build and start
deploy() {
    log_info "=========================================="
    log_info "  KingdomScout Deployment"
    log_info "=========================================="
    echo ""

    check_prerequisites
    setup_env

    log_info "Building Docker images..."
    dc build --parallel 2>/dev/null || dc build

    log_info "Starting services..."
    dc up -d

    echo ""
    log_info "Waiting for services to be healthy..."
    wait_for_health

    echo ""
    log_success "=========================================="
    log_success "  Deployment Complete!"
    log_success "=========================================="
    echo ""
    echo "  Frontend:  http://localhost:3000"
    echo "  Backend:   http://localhost:3001"
    echo "  API Docs:  http://localhost:3001/api"
    echo "  Health:    http://localhost:3001/health"
    echo ""
    echo "  Useful commands:"
    echo "    ./deploy.sh logs      - View live logs"
    echo "    ./deploy.sh status    - Check health"
    echo "    ./deploy.sh seed      - Load sample data"
    echo "    ./deploy.sh stop      - Stop services"
    echo ""
}

# Wait for services to be healthy
wait_for_health() {
    local max_wait=120
    local waited=0

    # Wait for backend
    log_info "Waiting for backend..."
    while [ $waited -lt $max_wait ]; do
        if curl -sf http://localhost:3001/health > /dev/null 2>&1; then
            log_success "Backend is healthy"
            break
        fi
        sleep 2
        waited=$((waited + 2))
        printf "."
    done
    echo ""

    if [ $waited -ge $max_wait ]; then
        log_warn "Backend didn't become healthy within ${max_wait}s"
        log_info "Check logs: ./deploy.sh logs backend"
        return
    fi

    # Wait for frontend
    waited=0
    log_info "Waiting for frontend..."
    while [ $waited -lt 60 ]; do
        if curl -sf http://localhost:3000 > /dev/null 2>&1; then
            log_success "Frontend is healthy"
            break
        fi
        sleep 2
        waited=$((waited + 2))
        printf "."
    done
    echo ""

    if [ $waited -ge 60 ]; then
        log_warn "Frontend didn't respond within 60s"
        log_info "Check logs: ./deploy.sh logs frontend"
    fi
}

# Seed database
seed_database() {
    log_info "Seeding database with sample data..."

    local response
    response=$(curl -sf -X POST http://localhost:3001/api/properties/debug/seed 2>&1)
    if [ $? -eq 0 ]; then
        log_success "Database seeded successfully"
        echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
    else
        log_error "Seed failed. Is the backend running?"
        log_info "Start with: ./deploy.sh start"
    fi
}

# Check status
check_status() {
    log_info "Service Status:"
    echo ""
    dc ps
    echo ""

    log_info "Health Check:"
    local health
    health=$(curl -sf http://localhost:3001/health 2>&1)
    if [ $? -eq 0 ]; then
        echo "$health" | python3 -m json.tool 2>/dev/null || echo "$health"
    else
        log_error "Backend not responding"
    fi
}

# Main
case "${1:-deploy}" in
    deploy|"")
        deploy
        ;;
    start)
        check_prerequisites
        dc up -d
        log_success "Services started"
        ;;
    stop)
        dc down
        log_success "Services stopped"
        ;;
    restart)
        dc down
        dc up -d
        log_success "Services restarted"
        ;;
    rebuild)
        dc down
        dc build --no-cache
        dc up -d
        wait_for_health
        log_success "Rebuilt and restarted"
        ;;
    logs)
        shift
        dc logs -f "${@:-}"
        ;;
    seed)
        seed_database
        ;;
    status)
        check_status
        ;;
    *)
        echo "Usage: ./deploy.sh [deploy|start|stop|restart|rebuild|logs|seed|status]"
        exit 1
        ;;
esac
