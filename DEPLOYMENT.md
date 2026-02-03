# Deployment Guide - Eczane Scraper API

Bu doküman uygulamayı local ve production ortamda nasıl çalıştıracağınızı açıklar.

## 📋 Gereksinimler

- **Node.js**: v18.0.0 veya üzeri (Node.js 22 ile uyumludur ✅)
- **npm**: v8.0.0 veya üzeri
- **Disk Alanı**: Minimum 100MB (cache dosyaları için)

## 🏠 Local Development

### 1. Proje Kurulumu

```bash
# Projeyi klonlayın veya indirin
cd eczane-scraper

# Bağımlılıkları yükleyin
npm install
```

### 2. Development Modunda Çalıştırma

```bash
# REST API sunucusunu başlatın
npm run server

# Veya watch mode (otomatik yeniden başlatma)
npm run server:watch
```

Server `http://localhost:3000` adresinde başlayacaktır.

### 3. Test

```bash
# Health check
curl http://localhost:3000/health

# Eczane sorgulama
curl "http://localhost:3000/api/pharmacies?city=Istanbul&district=Kadikoy"
```

## 🚀 Production Deployment

### Adım 1: Build Alma

```bash
# TypeScript kodunu JavaScript'e dönüştür
npm run build
```

Bu komut `dist/` klasöründe production-ready kod oluşturur:
```
dist/
├── server.js
├── scraper.js
├── cache.js
├── fileWriter.js
└── types.js
```

### Adım 2: Production'da Çalıştırma

```bash
# Build alıp başlat
npm run prod

# Veya sadece başlat (build alınmışsa)
npm start
```

## 🖥️ Unix Server Deployment

### Yöntem 1: PM2 ile Deployment (Önerilen)

PM2, Node.js uygulamaları için production process manager'dır.

```bash
# PM2'yi global olarak yükleyin
npm install -g pm2

# Uygulamayı build edin
npm run build

# PM2 ile başlatın (Basit yöntem)
pm2 start dist/server.js --name eczane-api

# Veya ecosystem.config.js ile (Cluster mode - Önerilen)
pm2 start ecosystem.config.js

# Otomatik başlatma (sistem yeniden başladığında)
pm2 startup
pm2 save

# Logları görüntüleme
pm2 logs eczane-api

# Durumu kontrol etme
pm2 status

# Yeniden başlatma
pm2 restart eczane-api

# Durdurma
pm2 stop eczane-api

# Silme
pm2 delete eczane-api
```

#### PM2 Local Development (Vite Benzeri)

PM2'yi local geliştirme için de kullanabilirsiniz:

```bash
# Development modunda başlat
pm2 start ecosystem.config.js --env development

# Watch mode (kod değiştiğinde otomatik restart)
pm2 start dist/server.js --name eczane-api --watch

# Real-time monitoring (CPU, Memory, Logs)
pm2 monit

# Logları canlı takip et
pm2 logs eczane-api --lines 100

# Detaylı durum bilgisi
pm2 show eczane-api

# Zero-downtime reload
pm2 reload eczane-api

# Tüm process'leri yönet
pm2 list
pm2 restart all
pm2 stop all
pm2 delete all
```

#### PM2 Plus (Web Dashboard)

Tarayıcıda monitoring için:

```bash
pm2 plus
```

Web dashboard özellikleri:
- Real-time metrics
- CPU & Memory grafikler
- Log streaming
- Exception tracking
- Custom metrics

#### PM2 Ecosystem Dosyası (Önerilen)

`ecosystem.config.js` oluşturun:

```javascript
module.exports = {
  apps: [{
    name: 'eczane-api',
    script: './dist/server.js',
    instances: 2, // Cluster mode için instance sayısı
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
```

Sonra başlatın:
```bash
pm2 start ecosystem.config.js
```

### Yöntem 2: Systemd Service

Ubuntu/Debian sistemlerde systemd service oluşturun:

```bash
sudo nano /etc/systemd/system/eczane-api.service
```

İçerik:
```ini
[Unit]
Description=Eczane Scraper API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/eczane-scraper
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node /path/to/eczane-scraper/dist/server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=eczane-api

[Install]
WantedBy=multi-user.target
```

Servisi aktifleştirin:
```bash
sudo systemctl daemon-reload
sudo systemctl enable eczane-api
sudo systemctl start eczane-api
sudo systemctl status eczane-api

# Logları görüntüleme
sudo journalctl -u eczane-api -f
```

### Yöntem 3: Docker (Container)

`Dockerfile` oluşturun:

```dockerfile
FROM node:22-alpine

WORKDIR /app

# Package files
COPY package*.json ./
RUN npm ci --only=production

# Source code
COPY . .

# Build
RUN npm run build

# Port
EXPOSE 3000

# Start
CMD ["npm", "start"]
```

`.dockerignore` oluşturun:
```
node_modules
dist
output
*.log
.git
.env
```

Build ve çalıştır:
```bash
# Image build
docker build -t eczane-api .

# Container çalıştır
docker run -d \
  --name eczane-api \
  -p 3000:3000 \
  -v $(pwd)/output:/app/output \
  --restart unless-stopped \
  eczane-api

# Logları görüntüleme
docker logs -f eczane-api
```

`docker-compose.yml`:
```yaml
version: '3.8'
services:
  api:
    build: .
    container_name: eczane-api
    ports:
      - "3000:3000"
    volumes:
      - ./output:/app/output
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3000
```

Çalıştır:
```bash
docker-compose up -d
```

## 🔧 Environment Variables

`.env` dosyası oluşturabilirsiniz (opsiyonel):

```env
NODE_ENV=production
PORT=3000
OUTPUT_DIR=./output
```

Kodda kullanmak için:
```bash
npm install dotenv
```

## 🌐 Nginx Reverse Proxy

Nginx ile domain üzerinden yayınlama:

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

SSL için (Let's Encrypt):
```bash
sudo certbot --nginx -d api.example.com
```

## 📊 Monitoring & Logs

### PM2 Monitoring
```bash
pm2 monit
pm2 logs eczane-api --lines 100
```

### Disk Kullanımı
Cache dosyaları zamanla büyüyebilir:
```bash
# Cache boyutunu kontrol et
du -sh output/

# Eski cache'leri temizle
find output/ -name "*.json" -mtime +7 -delete
```

### Log Rotation
PM2 ile log rotation:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## 🔒 Security

1. **Firewall**:
```bash
sudo ufw allow 3000/tcp
```

2. **Rate Limiting**: Express rate limiter ekleyin
3. **CORS**: Production'da specific domain'lere izin verin
4. **HTTPS**: Her zaman SSL kullanın

## 📦 Deployment Checklist

- [ ] Node.js 22 yüklü
- [ ] `npm install` çalıştırıldı
- [ ] `npm run build` başarılı
- [ ] `output/` klasörü yazılabilir
- [ ] PM2 veya systemd yapılandırıldı
- [ ] Nginx reverse proxy ayarlandı (opsiyonel)
- [ ] SSL sertifikası kuruldu (production)
- [ ] Monitoring aktif
- [ ] Log rotation ayarlandı
- [ ] Backup stratejisi belirlendi

## 🐛 Troubleshooting

### Port zaten kullanımda
```bash
# Port'u kullanan process'i bul
lsof -i :3000
# veya
netstat -tulpn | grep :3000

# Process'i öldür
kill -9 <PID>
```

### Node.js versiyonu
```bash
node --version  # v22.x.x görmeli
```

### Build hatası
```bash
rm -rf node_modules dist
npm install
npm run build
```

### Cache sorunları
```bash
# Tüm cache'i temizle
rm -rf output/*.json
```

## 📈 Performance Tips

1. **Cluster Mode**: PM2 ile multiple instance çalıştırın
2. **Memory Limit**: PM2'de memory limit belirleyin
3. **Cache Strategy**: Eski cache'leri otomatik temizleyin
4. **CDN**: Static content için CDN kullanın
5. **Load Balancer**: Yüksek trafik için load balancer ekleyin

## 📞 Support

Sorun yaşarsanız:
- Logları kontrol edin: `pm2 logs eczane-api`
- Health endpoint'i test edin: `curl http://localhost:3000/health`
- Server kaynaklarını kontrol edin: `htop` veya `free -m`
