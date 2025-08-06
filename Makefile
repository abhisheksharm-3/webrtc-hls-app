# WebRTC-HLS Docker Deployment Makefile

.PHONY: help build up down logs clean dev prod restart backup restore

# Default environment
COMPOSE_FILE := docker-compose.yml
COMPOSE_PROJECT_NAME := webrtc-hls

help: ## Show this help message
	@echo "WebRTC-HLS Docker Deployment Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""

build: ## Build all containers
	docker-compose -f $(COMPOSE_FILE) build

up: ## Start all services in background
	docker-compose -f $(COMPOSE_FILE) up -d

down: ## Stop all services
	docker-compose -f $(COMPOSE_FILE) down

logs: ## View logs from all services
	docker-compose -f $(COMPOSE_FILE) logs -f

logs-app: ## View logs from app service only
	docker-compose -f $(COMPOSE_FILE) logs -f app

clean: ## Remove all containers, networks, and volumes
	docker-compose -f $(COMPOSE_FILE) down -v --remove-orphans
	docker system prune -f

dev: ## Start development environment
	docker-compose -f $(COMPOSE_FILE) up --build

dev-logs: ## Start development environment and show logs
	docker-compose -f $(COMPOSE_FILE) up --build

prod: ## Start production environment
	docker-compose -f $(COMPOSE_FILE) -f docker-compose.prod.yml up --build -d

prod-logs: ## Start production environment and show logs
	docker-compose -f $(COMPOSE_FILE) -f docker-compose.prod.yml up --build

restart: ## Restart all services
	docker-compose -f $(COMPOSE_FILE) restart

restart-app: ## Restart only the app service
	docker-compose -f $(COMPOSE_FILE) restart app

status: ## Show status of all services
	docker-compose -f $(COMPOSE_FILE) ps

health: ## Check health of all services
	@echo "Checking application health..."
	@curl -f http://localhost:3001/health || echo "App health check failed"
	@echo ""
	@echo "Checking database..."
	@docker-compose -f $(COMPOSE_FILE) exec postgres pg_isready -U webrtc_user || echo "Database check failed"
	@echo ""
	@echo "Checking Redis..."
	@docker-compose -f $(COMPOSE_FILE) exec redis redis-cli ping || echo "Redis check failed"

backup: ## Backup database and volumes
	@echo "Creating database backup..."
	@docker-compose -f $(COMPOSE_FILE) exec postgres pg_dump -U webrtc_user webrtc_hls > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Database backup created: backup_$(shell date +%Y%m%d_%H%M%S).sql"

restore: ## Restore database from backup file (usage: make restore BACKUP_FILE=backup.sql)
	@if [ -z "$(BACKUP_FILE)" ]; then echo "Please specify BACKUP_FILE=<filename>"; exit 1; fi
	@echo "Restoring database from $(BACKUP_FILE)..."
	@docker-compose -f $(COMPOSE_FILE) exec -T postgres psql -U webrtc_user webrtc_hls < $(BACKUP_FILE)
	@echo "Database restored from $(BACKUP_FILE)"

shell: ## Access the app container shell
	docker-compose -f $(COMPOSE_FILE) exec app sh

shell-db: ## Access the database container shell
	docker-compose -f $(COMPOSE_FILE) exec postgres psql -U webrtc_user webrtc_hls

shell-redis: ## Access the Redis container shell
	docker-compose -f $(COMPOSE_FILE) exec redis redis-cli

reset: ## Reset everything (WARNING: This will delete all data)
	@echo "WARNING: This will delete all data. Press Ctrl+C to cancel, or Enter to continue..."
	@read
	$(MAKE) down
	docker volume rm webrtc-hls_postgres_data webrtc-hls_redis_data webrtc-hls_hls_data webrtc-hls_logs_data 2>/dev/null || true
	$(MAKE) up

update: ## Update and rebuild all containers
	docker-compose -f $(COMPOSE_FILE) pull
	$(MAKE) build
	$(MAKE) up

install: ## First-time setup (install dependencies and start services)
	@echo "Setting up WebRTC-HLS application..."
	@if [ ! -f .env ]; then cp .env.example .env; echo "Created .env file from template. Please review and update it."; fi
	$(MAKE) build
	$(MAKE) up
	@echo ""
	@echo "Setup complete! Services starting..."
	@echo "Frontend: http://localhost:3000"
	@echo "Backend API: http://localhost:3001"
	@echo ""
	@echo "Use 'make logs' to view logs"
	@echo "Use 'make status' to check service status"
