# 🛠️ Production Setup Guide

Panduan setup Mini Firebase untuk production.

---

## 📋 Prerequisites

- Node.js 18+
- npm atau yarn
- Docker (optional)

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd api
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

**Minimum configuration:**
```env
PORT=3000
NODE_ENV=production
JWT_SECRET=your-super-secret-key-change-this
```

### 3. Start Server

```bash
# Development
npm run dev

# Production
npm start
```

---

## 🐳 Docker Deployment

### Build Image

```bash
docker build -t mini-firebase .
```

### Run Container

```bash
docker run -d \
  -p 3000:3000 \
  -p 3001:3001 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  -e NODE_ENV=production \
  --name mini-firebase \
  mini-firebase
```

### Docker Compose

```bash
docker-compose up -d
```

Services:
- `mini-firebase`: Main application
- `backup`: Auto backup daily

---

## 🔒 Security Checklist

### Required Settings

- [ ] Change `JWT_SECRET` in `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Configure `ALLOWED_ORIGINS` for CORS
- [ ] Enable HTTPS (use reverse proxy)
- [ ] Set proper file permissions

### Recommended

- [ ] Enable firewall (allow only 3000, 3001)
- [ ] Setup fail2ban for brute-force protection
- [ ] Enable automatic security updates
- [ ] Configure log rotation
- [ ] Setup monitoring (Prometheus, Grafana)

---

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-03-20T00:00:00.000Z"
}
```

### Logs

```bash
# View all logs
tail -f logs/combined.log

# View errors only
tail -f logs/error.log

# Real-time with Docker
docker logs -f mini-firebase
```

---

## 💾 Backup Strategy

### Manual Backup

```bash
npm run backup
```

### Automatic Backup

Docker Compose includes auto backup service. Backups stored in `./backups/`.

### Restore Backup

```bash
# List available backups
node scripts/backup.js --list

# Restore latest
node scripts/backup.js --restore latest

# Restore specific
node scripts/backup.js --restore backup-2024-01-01.tar.gz
```

---

## ⚡ Performance Tuning

### Rate Limiting

Default limits in `.env`:
```env
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100   # 100 requests per window
```

### Database Optimization

- Keep collections under 10,000 documents
- Use queries with `limit` for large datasets
- Regular backup and cleanup old data

### Memory

Recommended RAM:
- Development: 512 MB
- Production (small): 1 GB
- Production (medium): 2 GB
- Production (large): 4 GB+

---

## 🔧 Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Permission Denied

```bash
# Fix data directory permissions
chmod -R 755 ./data
chown -R node:node ./data
```

### High Memory Usage

```bash
# Set memory limit
export NODE_OPTIONS="--max-old-space-size=512"
npm start
```

---

## 📈 Scaling

### Horizontal Scaling

Mini Firebase is single-node by design. For horizontal scaling:

1. Use load balancer (nginx, HAProxy)
2. Shared storage (NFS, S3)
3. External database (MongoDB, PostgreSQL)

### Vertical Scaling

- Increase RAM
- Use SSD storage
- Multi-core CPU benefits WebSocket handling

---

## 🆘 Support

- Documentation: `/docs`
- GitHub Issues: https://github.com/snipkode/mini-firebase/issues
- Dashboard: http://localhost:3000

---

**Mini Firebase - Production Ready**
