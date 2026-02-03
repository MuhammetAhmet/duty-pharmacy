# Eczane Scraper - REST API

Nöbetçi eczaneleri https://www.eczaneler.gen.tr/ sitesinden çeken TypeScript REST API uygulaması.

## 🎯 Özellikler

- 🚀 REST API ile kolay entegrasyon
- 💾 Akıllı cache mekanizması (aynı sorgu için dosyadan okuma)
- 📊 Cache istatistikleri ve performans takipi
- 🔍 İl ve ilçe bazında sorgulama
- ⏰ **Saat bazlı akıllı filtreleme** (08:00-18:00 çalışma saatine göre otomatik nöbet seçimi)
- 📝 JSON formatında detaylı çıktı
- ⚡ Hızlı response süreleri (cache HIT: ~1-2ms, MISS: ~300ms)
- ✅ Node.js 22 ile tamamen uyumlu
- 📚 Swagger/OpenAPI otomatik dokümantasyon

## ⏰ Akıllı Nöbet Sistemi

Eczaneler **08:00-18:00** saatleri arası açıktır. API otomatik olarak şu anki saate göre doğru nöbetçi eczaneleri gösterir:

- **Saat >= 08:00** ise: Bugün akşamından yarın sabahına nöbetçi eczaneler
- **Saat < 08:00** ise: Dün akşamından bugün sabahına nöbetçi eczaneler

**Örnek:**
- 3 Şubat 13:00'de istek → "3 Şubat akşamından 4 Şubat sabahına" nöbetçiler
- 4 Şubat 02:00'de istek → "3 Şubat akşamından 4 Şubat sabahına" nöbetçiler
- 4 Şubat 09:00'de istek → "4 Şubat akşamından 5 Şubat sabahına" nöbetçiler

## 📖 API Dokümantasyonu

Uygulama Swagger UI ile otomatik dokümantasyon sağlar:

**Swagger UI**: http://localhost:3000/api-docs  
**OpenAPI Spec**: http://localhost:3000/api-docs.json

### Yeni Endpoint Ekleme

Yeni bir API endpoint'i eklemek için JSDoc yorumu kullanın:

```typescript
/**
 * @swagger
 * /api/yeni-endpoint:
 *   get:
 *     summary: Kısa açıklama
 *     description: Detaylı açıklama
 *     tags: [Eczaneler]
 *     parameters:
 *       - in: query
 *         name: parametre
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Başarılı response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 */
app.get('/api/yeni-endpoint', (req, res) => {
  // Implementation
});
```

Swagger otomatik olarak bu JSDoc yorumlarını okur ve dokümantasyonu oluşturur!

## 📋 Sistem Gereksinimleri

- **Node.js**: v18.0.0 veya üzeri (✅ Node.js 22 destekleniyor)
- **npm**: v8.0.0 veya üzeri
- **Disk**: Minimum 100MB (cache için)

## 🚀 Hızlı Başlangıç

### 1. Kurulum

```bash
# Bağımlılıkları yükleyin
npm install
```

### 2. Local Development

```bash
# Development server (hot reload)
npm run server:watch

# Veya normal mode
npm run server
```

Server `http://localhost:3000` adresinde başlar.

### 3. Test

```bash
# Health check
curl http://localhost:3000/health

# Nöbetçi eczane sorgulama (tarih parametresi gerekmez, otomatik)
curl "http://localhost:3000/api/pharmacies?city=Istanbul&district=Kadikoy"
```

## 🏭 Production Deployment

### Yöntem 1: Direkt Node.js (Basit)

```bash
# 1. Build alın
npm run build

# 2. Production'da çalıştırın
npm start

# Veya tek komutla
npm run prod
```

Build işlemi `dist/` klasöründe production-ready kod oluşturur.

### Yöntem 2: PM2 ile Deployment (Önerilen)

PM2, Node.js uygulamaları için production process manager'dır.

```bash
# PM2'yi yükleyin (global)
npm install -g pm2

# Build alın
npm run build

# PM2 ile başlatın (ecosystem.config.js kullanarak)
pm2 start ecosystem.config.js

# Veya manuel
pm2 start dist/server.js --name eczane-api -i 2

# Otomatik başlatma (sistem reboot'ta)
pm2 startup
pm2 save

# Komutlar
pm2 logs eczane-api      # Logları görüntüle
pm2 status               # Durum
pm2 restart eczane-api   # Yeniden başlat
pm2 stop eczane-api      # Durdur
pm2 delete eczane-api    # Kaldır
```

### Yöntem 3: Docker ile Deployment

```bash
# Docker image build
docker build -t eczane-api .

# Container çalıştır
docker run -d \
  --name eczane-api \
  -p 3000:3000 \
  -v $(pwd)/output:/app/output \
  --restart unless-stopped \
  eczane-api

# Logları görüntüle
docker logs -f eczane-api

# Veya Docker Compose ile
docker-compose up -d
```

### Yöntem 4: Systemd Service (Linux)

```bash
# Service dosyası oluştur
sudo nano /etc/systemd/system/eczane-api.service
```

Detaylar için [DEPLOYMENT.md](DEPLOYMENT.md) dosyasına bakın.

## 📡 API Endpoints

#### 1. Nöbetçi Eczaneleri Sorgula
```
GET /api/pharmacies?city=İstanbul&district=Kadıköy&date=2026-02-03
```

**Parametreler:**
- `city` (zorunlu): İl adı
- `district` (opsiyonel): İlçe adı
- `date` (opsiyonel): Tarih (YYYY-MM-DD formatında, varsayılan: bugün)

**Örnek İstek:**
```bash
curl "http://localhost:3000/api/pharmacies?city=İstanbul&district=Kadıköy"
```

**Örnek Response:**
```json
{
  "success": true,
  "result": [
    {
      "name": "Verda Eczanesi",
      "dist": "Kadikoy",
      "address": "Caferağa Mahallesi, General Asım Gündüz Caddesi No:104",
      "phone": "0 (216) 337-19-94",
      "loc": ""
    }
  ]
}
```

#### 2. İl Listesi
```
GET /api/cities
```

**Örnek İstek:**
```bash
curl "http://localhost:3000/api/cities"
```

#### 3. Cache İstatistikleri
```
GET /api/stats
```

**Örnek Response:**
```json
{
  "success": true,
  "stats": {
    "totalRequests": 10,
    "cacheHits": 7,
    "cacheMisses": 3,
    "hitRate": "70.00%"
  }
}
```

#### 4. Cache Temizleme
```
DELETE /api/cache?date=2026-02-03
```

**Parametreler:**
- `date` (opsiyonel): Belirli bir tarihi temizle. Boş bırakılırsa tüm cache temizlenir.

#### 5. Health Check
```
GET /health
```

#### 6. API Dokümantasyonu
```
GET /
```

## CLI Kullanımı (Eski Yöntem)

```bash
# Varsayılan örnekleri çalıştır
npm run dev

# Özel parametrelerle
npm run scrape -- --city=İstanbul --district=Kadıköy
npm run scrape -- --city=Ankara
```

## 📦 Deployment'a Hazırlık

### Deploy Edilecek Dosyalar

Unix sunucunuza şu dosyaları upload edin:

```
eczane-scraper/
├── package.json          # Bağımlılıklar
├── package-lock.json     # Lock file
├── dist/                 # Build çıktısı (npm run build sonrası)
│   ├── server.js
│   ├── scraper.js
│   ├── cache.js
│   ├── fileWriter.js
│   └── types.js
├── ecosystem.config.js   # PM2 config (opsiyonel)
└── output/              # Cache klasörü (otomatik oluşur)
```

### Sunucuda Kurulum

```bash
# 1. Dosyaları sunucuya upload edin (scp, sftp, git vb.)
scp -r eczane-scraper/ user@server:/var/www/

# 2. Sunucuya bağlanın
ssh user@server

# 3. Proje klasörüne gidin
cd /var/www/eczane-scraper

# 4. Sadece production bağımlılıklarını yükleyin
npm ci --only=production

# 5. PM2 ile başlatın
pm2 start ecosystem.config.js

# 6. Otomatik başlatma
pm2 startup
pm2 save
```

## 🔍 Node.js 22 Uyumluluk

✅ **Evet, uygulama Node.js 22 ile çalışır!**

Test edildi:
- Node.js v22.14.0 ✅
- Node.js v20.x ✅
- Node.js v18.x ✅

Minimum gereksinim: Node.js v18.0.0

## 📊 Cache Mekanizması

- İlk istek geldiğinde web scraping yapılır ve sonuç dosyaya kaydedilir
- Aynı sorgu (il, ilçe, tarih) tekrar geldiğinde dosyadan okunur
- Cache HIT: ~1-2ms response süresi
- Cache MISS: ~300ms response süresi (web scraping)
- Dosyalar `output/` klasöründe JSON formatında saklanır

## Örnek Senaryolar

### 1. Farklı İller İçin Sorgulama
```bash
curl "http://localhost:3000/api/pharmacies?city=İstanbul"
curl "http://localhost:3000/api/pharmacies?city=Ankara"
curl "http://localhost:3000/api/pharmacies?city=İzmir&district=Bornova"
```

### 2. Cache Performance Testi
```bash
# İlk istek (MISS - ~300ms)
curl "http://localhost:3000/api/pharmacies?city=Bursa&district=Osmangazi"

# İkinci istek (HIT - ~2ms)
curl "http://localhost:3000/api/pharmacies?city=Bursa&district=Osmangazi"
```

### 3. İstatistikleri Görüntüleme
```bash
curl "http://localhost:3000/api/stats"
```

## Teknolojiler

- **Node.js** & **TypeScript**: Backend geliştirme
- **Express.js**: REST API framework
- **Axios**: HTTP istekleri
- **Cheerio**: HTML parsing
- **date-fns**: Tarih işlemleri
- **CORS**: Cross-origin resource sharing

## 📚 Ek Dokümantasyon

- [DEPLOYMENT.md](DEPLOYMENT.md) - Detaylı deployment rehberi
  - PM2 yapılandırması
  - Systemd service kurulumu
  - Docker deployment
  - Nginx reverse proxy
  - SSL kurulumu
  - Monitoring ve logging
  - Troubleshooting

## 🔧 Scripts

```bash
npm run server         # Development server başlat
npm run server:watch   # Watch mode (hot reload)
npm run build          # Production build
npm start              # Production server başlat
npm run prod           # Build + start
npm run dev            # CLI scraper çalıştır
npm run scrape         # CLI scraper çalıştır
```

## 📁 Proje Yapısı

```
eczane-scraper/
├── src/
│   ├── server.ts       # REST API server
│   ├── scraper.ts      # Web scraper
│   ├── cache.ts        # Cache yönetimi
│   ├── fileWriter.ts   # Dosya yazma
│   ├── types.ts        # TypeScript tipleri
│   └── index.ts        # CLI interface
├── dist/               # Build çıktısı
├── output/             # Cache dosyaları
├── package.json
├── tsconfig.json
├── ecosystem.config.js # PM2 config
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🐛 Troubleshooting

### Port zaten kullanımda
```bash
# Port'u kullanan process'i bul ve öldür
lsof -i :3000
kill -9 <PID>
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
# veya API ile
curl -X DELETE "http://localhost:3000/api/cache"
```

## 📈 Performance

- **İlk İstek (Cache MISS)**: ~300ms (web scraping)
- **Sonraki İstekler (Cache HIT)**: ~1-2ms
- **Typical Cache Hit Rate**: %60-80
- **Memory Usage**: ~50-100MB (base)
- **Disk Usage**: Cache dosyaları (~10KB/sorgu)

## Çıktı

Tüm sonuçlar `output/` klasöründe şu formatta saklanır:
```
output/eczane_İstanbul_Kadıköy_2026-02-03_timestamp.json
```

## Lisans

MIT

