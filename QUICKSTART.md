# Quick Start Guide

Bu rehber uygulamayı 5 dakikada çalıştırmanızı sağlar.

## 🚀 Local'de Çalıştırma (Development)

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. Server'ı başlat
npm run server

# 3. Test et
curl "http://localhost:3000/api/pharmacies?city=Istanbul&district=Kadikoy"
```

✅ Server `http://localhost:3000` adresinde çalışıyor!

## 🏭 Production'a Alma (Unix Server - Node.js 22)

### Yöntem 1: Basit Deployment

```bash
# Sunucunuzda:

# 1. Node.js 22'nin yüklü olduğunu doğrula
node --version  # v22.x.x görmeli

# 2. Dosyaları upload et (git, scp, sftp vb.)
git clone <your-repo>
cd eczane-scraper

# 3. Bağımlılıkları yükle
npm ci --only=production

# 4. Build al
npm run build

# 5. Başlat
npm start
```

Server `http://localhost:3000` adresinde başlayacak.

### Yöntem 2: PM2 ile (Önerilen - Production)

```bash
# 1. PM2'yi global olarak yükle
npm install -g pm2

# 2. Proje kurulumu
cd eczane-scraper
npm ci --only=production
npm run build

# 3. PM2 ile başlat
pm2 start ecosystem.config.js

# 4. Otomatik başlatma aktif et (reboot'ta çalışsın)
pm2 startup
pm2 save

# 5. Kontrol et
pm2 status
pm2 logs eczane-api
```

### Yöntem 3: Docker ile

```bash
# 1. Docker image build et
docker build -t eczane-api .

# 2. Container başlat
docker run -d \
  --name eczane-api \
  -p 3000:3000 \
  -v $(pwd)/output:/app/output \
  --restart unless-stopped \
  eczane-api

# 3. Logları kontrol et
docker logs -f eczane-api
```

## 🔥 Hızlı Test Komutları

```bash
# Health check
curl http://localhost:3000/health

# İstanbul - Kadıköy
curl "http://localhost:3000/api/pharmacies?city=Istanbul&district=Kadikoy"

# Ankara (tüm ilçeler)
curl "http://localhost:3000/api/pharmacies?city=Ankara"

# İzmir - Bornova
curl "http://localhost:3000/api/pharmacies?city=Izmir&district=Bornova"

# İl listesi
curl "http://localhost:3000/api/cities"

# İstatistikler
curl "http://localhost:3000/api/stats"
```

## 📦 Deploy Edilecek Dosyalar

Sunucunuza şunları yüklemeniz yeterli:

```
✅ package.json
✅ package-lock.json
✅ dist/ (npm run build sonrası)
✅ ecosystem.config.js (PM2 kullanıyorsanız)
```

**DİKKAT:** `node_modules/` ve `src/` klasörlerini yüklemeyin, gereksiz!

## 🌐 Domain'e Bağlama (Nginx)

```bash
# 1. Nginx config
sudo nano /etc/nginx/sites-available/eczane-api

# 2. İçeriği ekle:
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# 3. Aktif et
sudo ln -s /etc/nginx/sites-available/eczane-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 4. SSL ekle (Let's Encrypt)
sudo certbot --nginx -d api.yourdomain.com
```

## 🔧 Sorun mu var?

### Port 3000 kullanımda
```bash
# Çalışan process'i bul ve durdur
lsof -i :3000
kill -9 <PID>
```

### Node.js versiyonu eski
```bash
# nvm ile Node.js 22 yükle
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
node --version  # v22.x.x görmeli
```

### Build hatası
```bash
rm -rf node_modules dist
npm install
npm run build
```

## 📊 Performans İpuçları

1. **PM2 Cluster Mode**: Multiple instance çalıştır
   ```bash
   pm2 start ecosystem.config.js
   # ecosystem.config.js içinde instances: 2 ayarlı
   ```

2. **Memory Limit**: `ecosystem.config.js` içinde ayarlı
   ```javascript
   max_memory_restart: '1G'
   ```

3. **Cache Temizleme**: Eski cache'leri temizle
   ```bash
   # 7 günden eski cache'leri sil
   find output/ -name "*.json" -mtime +7 -delete
   ```

## ✅ Checklist

Server'ınız için:

- [ ] Node.js 22 yüklü mü? (`node --version`)
- [ ] Port 3000 açık mı? (`lsof -i :3000`)
- [ ] `npm install` tamamlandı mı?
- [ ] `npm run build` başarılı mı?
- [ ] Server başladı mı? (`curl http://localhost:3000/health`)
- [ ] PM2 yapılandırıldı mı? (production için)
- [ ] Firewall kuralları eklen di mi?
- [ ] Nginx reverse proxy kuruldu mu? (domain için)

## 🎉 Başarılı!

Artık API'niz çalışıyor!

- API: `http://your-server:3000`
- Docs: `http://your-server:3000/`
- Health: `http://your-server:3000/health`

Daha fazla bilgi için [README.md](README.md) ve [DEPLOYMENT.md](DEPLOYMENT.md) dosyalarına bakın.
