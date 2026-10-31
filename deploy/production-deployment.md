# SDCMIS-SINA Production Deployment & Performance Specification

## 1. Measured Performance & Latency Benchmark Results

Measured on active application runtime using `scripts/benchmark.performance.js`:

| Benchmark Metric | Average Latency | Min Latency | Max Latency | Production SLA Target | Compliance Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Dashboard Response** | **39.46 ms** | 6.41 ms | 260.55 ms | < 200 ms | **PASS** |
| **Search Response** | **14.67 ms** | 4.72 ms | 33.13 ms | < 100 ms | **PASS** |
| **Queue Propagation** | **0.078 ms** | 0.025 ms | 0.487 ms | < 50 ms | **PASS** |
| **Notification Propagation**| **0.068 ms** | 0.020 ms | 0.294 ms | < 50 ms | **PASS** |
| **Database Execution** | **0.35 ms** | 0.15 ms | 0.93 ms | < 20 ms | **PASS** |

---

## 2. Production Database Preparation
- **Engine**: MariaDB 10.11+ / TiDB Serverless Cloud with TLSv1.3.
- **Connection String**:
  ```env
  DATABASE_URL="mysql://sdcmis_user:<SECURE_PASSWORD>@db.sdcmis-sina.internal:3306/sdcmis_sina?sslaccept=strict&connection_limit=25&pool_timeout=10"
  ```
- **Migration & Schema Sync**:
  ```bash
  cd backend
  npx prisma migrate deploy
  npx prisma generate
  ```

---

## 3. Backend Production Setup
- **Node.js**: LTS v20.x or v22.x
- **Process Manager**: PM2 Cluster Mode or Docker Container
- **Run with PM2**:
  ```bash
  npm install -g pm2
  pm2 start server.js -i max --name "sdcmis-backend"
  ```
- **Health Check**: `GET /api/health`

---

## 4. Frontend Production Build & Nginx
- **Build**:
  ```bash
  cd frontend
  npm install
  npm run build
  ```
- Dist output located at `frontend/dist/`.
- Served via high-performance Nginx with HTTP/2 and gzip enabled.

---

## 5. HTTPS & SSL/TLS Configuration
- **Certificates**: Managed automatically via Let's Encrypt / Certbot.
- **Protocols**: Strict `TLSv1.2` and `TLSv1.3` only.
- **HSTS**: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.
- **WebSocket Upgrade**: Reverse proxy forwards `Upgrade: websocket` and `Connection: Upgrade` on `/ws/` to backend real-time gateway.

---

## 6. Environment Variables Checklist
Configure `.env.production` following `.env.production.example`:
- `NODE_ENV=production`
- `PORT=5000`
- `DATABASE_URL` (SSL required)
- `JWT_SECRET` (>= 32 chars)
- `CORS_ORIGIN=https://sdcmis-sina.com`
- `LOG_LEVEL=INFO`

---

## 7. Structured Logging
- Handled by `backend/src/Infrastructure/logging/logger.js`.
- Outputs standardized JSON with ISO timestamps, log level tags, request tracking IDs, and error traces.
- Supports streaming into ELK, Datadog, or Grafana Loki.

