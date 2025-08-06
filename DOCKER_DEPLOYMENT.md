# Docker Deployment Guide

This guide explains how to deploy the WebRTC-HLS application using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Minimum 2GB RAM
- Minimum 1GB disk space

## Quick Start

### 1. Clone and Prepare

```bash
git clone <repository-url>
cd webrtc-hls
```

### 2. Environment Configuration

Copy the example environment file and customize it:

```bash
cp .env.example .env
```

Edit `.env` with your specific configuration:

```bash
# For production deployment, update these values:
MEDIASOUP_ANNOUNCED_IP=your-server-public-ip
ALLOWED_ORIGINS=https://yourdomain.com
NEXT_PUBLIC_SERVER_URL=https://yourdomain.com:3001
NEXT_PUBLIC_WS_URL=wss://yourdomain.com:3001
```

### 3. Development Deployment

```bash
# Start all services including database
docker-compose up --build

# Or run in background
docker-compose up --build -d

# View logs
docker-compose logs -f app
```

### 4. Production Deployment

```bash
# Use production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f app
```

## Service Architecture

The deployment includes:

- **PostgreSQL 15**: Database for rooms and participants
- **Redis 7**: Session management and caching  
- **App Container**: Next.js client + Express.js server + Mediasoup SFU

## Exposed Ports

- `3000`: Next.js client application
- `3001`: Express.js API server
- `40000-49999/udp`: Mediasoup RTC ports
- `5432`: PostgreSQL (development only)
- `6379`: Redis (development only)

## Health Checks

The application includes health checks for all services:

- **App**: `http://localhost:3001/health`
- **Database**: `pg_isready` command
- **Redis**: `redis-cli ping`

## Data Persistence

The following volumes persist data:

- `postgres_data`: Database files
- `redis_data`: Redis persistence
- `hls_data`: HLS video segments
- `logs_data`: Application logs

## Production Considerations

### 1. Network Configuration

For production deployment, update these environment variables:

```bash
# Set your server's public IP
MEDIASOUP_ANNOUNCED_IP=YOUR_PUBLIC_IP

# Configure allowed origins
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Set public URLs
NEXT_PUBLIC_SERVER_URL=https://yourdomain.com
NEXT_PUBLIC_WS_URL=wss://yourdomain.com
```

### 2. Reverse Proxy Setup

Use nginx or another reverse proxy in front of the application:

```nginx
# Example nginx configuration
upstream webrtc_app {
    server localhost:3000;
}

upstream webrtc_api {
    server localhost:3001;
}

server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://webrtc_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api/ {
        proxy_pass http://webrtc_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /socket.io/ {
        proxy_pass http://webrtc_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. Firewall Configuration

Ensure these ports are open:

- `80/443`: HTTP/HTTPS traffic
- `40000-49999/udp`: Mediasoup RTC traffic

### 4. Resource Limits

The production compose file includes resource limits:

- Memory: 2GB limit, 1GB reservation
- CPU: 1.0 limit, 0.5 reservation

Adjust based on your server capacity.

## Monitoring

### Container Status

```bash
# Check all containers
docker-compose ps

# Check specific service logs
docker-compose logs app
docker-compose logs postgres
docker-compose logs redis
```

### Application Health

```bash
# Check application health
curl http://localhost:3001/health

# Check database connection
docker-compose exec postgres pg_isready -U webrtc_user

# Check Redis
docker-compose exec redis redis-cli ping
```

### Resource Usage

```bash
# Check resource usage
docker stats

# Check disk usage
docker system df
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 3001, 5432, 6379 are available
2. **Memory issues**: Increase Docker memory allocation if containers are killed
3. **Network connectivity**: Ensure Docker networks are properly configured

### Container Debugging

```bash
# Access app container
docker-compose exec app sh

# Check app logs
docker-compose logs -f app

# Restart specific service
docker-compose restart app
```

### Database Issues

```bash
# Reset database
docker-compose down -v
docker-compose up --build

# Access database directly
docker-compose exec postgres psql -U webrtc_user -d webrtc_hls
```

## Backup and Recovery

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U webrtc_user webrtc_hls > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U webrtc_user webrtc_hls < backup.sql
```

### Volume Backup

```bash
# Backup all volumes
docker run --rm -v webrtc-hls_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
docker run --rm -v webrtc-hls_hls_data:/data -v $(pwd):/backup alpine tar czf /backup/hls_backup.tar.gz -C /data .
```

## Scaling

For high-traffic deployments:

1. **Horizontal scaling**: Deploy multiple app instances behind a load balancer
2. **Database scaling**: Use PostgreSQL read replicas
3. **Storage scaling**: Use distributed storage for HLS segments
4. **Mediasoup scaling**: Deploy multiple Mediasoup workers

## Security

1. Change default passwords in production
2. Use environment variables for secrets
3. Enable SSL/TLS for all connections
4. Regularly update Docker images
5. Implement proper firewall rules
6. Use non-root users in containers (already configured)

## Performance Tuning

1. **Database**: Tune PostgreSQL configuration for your workload
2. **Redis**: Configure appropriate memory policies
3. **Network**: Optimize MTU sizes for UDP traffic
4. **Storage**: Use fast storage for HLS segments
5. **CPU**: Ensure adequate CPU for video transcoding
