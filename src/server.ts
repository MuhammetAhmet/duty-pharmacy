import express, { Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { format } from 'date-fns';
import { EczaneScraper } from './scraper';
import { CacheManager } from './cache';
import { FileWriter } from './fileWriter';
import { swaggerSpec } from './swagger';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Eczane API Docs',
}));

// Swagger JSON
app.get('/api-docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
app.use(cors());
app.use(express.json());

// Services
const scraper = new EczaneScraper();
const cache = new CacheManager('./output');
const fileWriter = new FileWriter('./output');

// Request counter
let requestCount = 0;
let cacheHits = 0;
let cacheMisses = 0;

/**
 * @swagger
 * /api/pharmacies:
 *   get:
 *     summary: Nöbetçi eczaneleri sorgula
 *     description: |
 *       İl ve ilçe bazında nöbetçi eczaneleri getirir.
 *       
 *       **Saat Bazlı Akıllı Filtreleme:**
 *       - Saat >= 08:00 ise: Bugün akşamından yarın sabahına nöbetçi eczaneler
 *       - Saat < 08:00 ise: Dün akşamından bugün sabahına nöbetçi eczaneler
 *       
 *       Eczaneler 08:00-18:00 saatleri arası açıktır.
 *     tags: [Eczaneler]
 *     parameters:
 *       - in: query
 *         name: city
 *         required: true
 *         schema:
 *           type: string
 *         description: İl adı (Türkçe karakter olmadan yazın, ör. Istanbul, Ankara, Izmir)
 *         example: Istanbul
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *         description: İlçe adı (opsiyonel, boş bırakılırsa tüm ilçeler)
 *         example: Kadikoy
 *     responses:
 *       200:
 *         description: Başarılı response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PharmacyResponse'
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   result:
 *                     - name: Gaye Eczanesi
 *                       dist: Kadikoy
 *                       address: Caddebostan Mahallesi, Ömer Paşa Sokak No:12/A
 *                       phone: 0 (216) 360-64-45
 *                       loc: ""
 *                       dutyDate: 3 Şubat Salı akşamından 4 Şubat Çarşamba sabahına kadar.
 *       400:
 *         description: Geçersiz parametreler
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: İl (city) parametresi zorunludur
 *               example: /api/pharmacies?city=Istanbul&district=Kadikoy
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/pharmacies', async (req: Request, res: Response) => {
  try {
    requestCount++;
    const startTime = Date.now();

    // Parametreleri al
    const city = req.query.city as string;
    const district = (req.query.district as string) || '';
    const date = format(new Date(), 'yyyy-MM-dd'); // Her zaman bugünün tarihini kullan

    // Validasyon
    if (!city) {
      return res.status(400).json({
        success: false,
        error: 'İl (city) parametresi zorunludur',
        example: '/api/pharmacies?city=İstanbul&district=Kadıköy'
      });
    }

    console.log(`\n[${requestCount}] İstek alındı: ${city}${district ? '/' + district : ''} - Saat bazlı filtreleme aktif`);

    // Önce cache'e bak
    let result = await cache.get(city, district, date);
    let fromCache = false;

    if (result) {
      // Cache'den bulundu
      cacheHits++;
      fromCache = true;
      console.log(`✓ Cache HIT (${cacheHits}/${requestCount})`);
    } else {
      // Cache'de yok, scraping yap
      cacheMisses++;
      console.log(`⚠ Cache MISS (${cacheMisses}/${requestCount}) - Scraping başlatılıyor...`);
      
      result = await scraper.scrape({ city, district, date });
      
      // Cache'e kaydet
      await cache.set(result);
    }

    const duration = Date.now() - startTime;

    // Response - Yeni format
    // Saat bazlı akıllı filtreleme:
    // - Saat >= 08:00 ise: Bugün akşamından yarın sabahına nöbetçi olanları göster
    // - Saat < 08:00 ise: Dün akşamından bugün sabahına nöbetçi olanları göster
    let filteredPharmacies = result.pharmacies;
    
    const now = new Date();
    const currentHour = now.getHours();
    
    // Hedef tarihi belirle (nöbetin BAŞLADIĞI gün)
    let targetDate: Date;
    if (currentHour >= 8) {
      // Saat 08:00'dan sonra: Bugün akşamından yarın sabahına (bugünün tarihini ara)
      targetDate = new Date(now);
    } else {
      // Saat 08:00'dan önce: Dün akşamından bugün sabahına (dünün tarihini ara)
      targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - 1);
    }
    
    const targetDay = targetDate.getDate();
    const targetMonthName = targetDate.toLocaleString('tr-TR', { month: 'long' }).toLowerCase();
    
    console.log(`Saat: ${currentHour}:${now.getMinutes()} - Hedef nöbet başlangıç tarihi: ${targetDay} ${targetMonthName}`);
    
    filteredPharmacies = result.pharmacies.filter(pharmacy => {
      const dutyText = (pharmacy.dutyDate || '').toLowerCase();
      
      // dutyDate formatı: "X Şubat Gün_Adı akşamından Y Şubat Gün_Adı sabahına kadar"
      // X (başlangıç tarihi) hedef tarihse eşleşir
      const regexPattern = `${targetDay}\\s+${targetMonthName}\\s+\\S+\\s+akşamından`;
      const regex = new RegExp(regexPattern, 'i');
      const matches = regex.test(dutyText);
      
      return matches || !pharmacy.dutyDate;
    });
    
    console.log(`Filtreleme sonucu: ${filteredPharmacies.length}/${result.pharmacies.length} eczane`);

    const responseData = filteredPharmacies.map(pharmacy => ({
      name: pharmacy.name,
      dist: pharmacy.district,
      address: pharmacy.address,
      phone: pharmacy.phone,
      loc: "", // Şimdilik boş, ileride koordinat eklenebilir
      dutyDate: pharmacy.dutyDate // Nöbet tarihi bilgisi
    }));

    res.json({
      success: true,
      result: responseData
    });

  } catch (error) {
    console.error('API Hatası:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata',
    });
  }
});

/**
 * @swagger
 * /api/cities:
 *   get:
 *     summary: İl listesi
 *     description: Türkiye'deki tüm illeri listeler
 *     tags: [Eczaneler]
 *     responses:
 *       200:
 *         description: Başarılı response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 * @swagger
 * /api/stats:
 *   get:
 *     summary: Cache istatistikleri
 *     description: API kullanım istatistikleri ve cache performansı
 *     tags: [Sistem]
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
 *                   example: true
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalRequests:
 *                       type: integer
 *                       example: 100
 *                     cacheHits:
 *                       type: integer
 *                       example: 70
 *                     cacheMisses:
 *                       type: integer
 *                       example: 30
 *                     hitRate:
 *                       type: string
 *                       example: "70.00%"  success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 25
 *                 cities:
 *                   type: array
 * @swagger
 * /api/cache:
 *   delete:
 *     summary: Cache temizle
 *     description: Tüm cache'i veya belirli bir tarihe ait cache'i temizler
 *     tags: [Sistem]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Temizlenecek tarih (opsiyonel, boş bırakılırsa tüm cache temizlenir)
 *         example: 2026-02-03
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
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Tüm cache temizlendi
 *       500:
 * @swagger
 * /health:
 *   get:
 *     summary: Sağlık kontrolü
 *     description: Servis durumu ve uptime bilgisi
 *     tags: [Sistem]
 *     responses:
 *       200:
 *         description: Servis çalışıyor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 uptime:
 *                   type: number
 *                   example: 3600.123
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2026-02-03T10:30:00.000Ztent:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *                   example: ["İstanbul", "Ankara", "İzmir"]
 */
app.get('/api/cities', (req: Request, res: Response) => {
  const cities = scraper.getCities();
  res.json({
    success: true,
    count: cities.length,
    cities,
  });
});

/**
 * Cache istatistikleri
 * GET /api/stats
 */
app.get('/api/stats', (req: Request, res: Response) => {
  res.json({
    success: true,
    stats: {
      totalRequests: requestCount,
      cacheHits,
      cacheMisses,
      hitRate: requestCount > 0 ? ((cacheHits / requestCount) * 100).toFixed(2) + '%' : '0%',
    }
  });
});

/**
 * Cache temizleme
 * DELETE /api/cache?date=2026-02-03
 */
app.delete('/api/cache', async (req: Request, res: Response) => {
  try {
    const date = req.query.date as string;

    if (date) {
      await cache.clearByDate(date);
      res.json({
        success: true,
        message: `${date} tarihli cache temizlendi`,
      });
    } else {
      await cache.clear();
      res.json({
        success: true,
        message: 'Tüm cache temizlendi',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Cache temizleme hatası',
    });
  }
});

/**
 * Health check
 * GET /health
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Ana sayfa - API dokümantasyonu
 * GET /
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Eczane Scraper API',
    version: '1.0.0',
    endpoints: {
      'GET /api/pharmacies': {
        description: 'Nöbetçi eczaneleri sorgula',
        params: {
          city: 'İl (zorunlu)',
          district: 'İlçe (opsiyonel)',
          date: 'Tarih YYYY-MM-DD (opsiyonel, varsayılan: bugün)',
        },
        example: '/api/pharmacies?city=İstanbul&district=Kadıköy&date=2026-02-03',
      },
      'GET /api/cities': {
        description: 'Tüm illeri listele',
      },
      'GET /api/stats': {
        description: 'Cache istatistikleri',
      },
      'DELETE /api/cache': {
        description: 'Cache temizle',
        params: {
          date: 'Belirli bir tarihi temizle (opsiyonel)',
        },
      },
      'GET /health': {
        description: 'Servis sağlık durumu',
      },
    },
  });
});

// Server başlat
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 Eczane Scraper API Başlatıldı');
  console.log('='.repeat(60));
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`📄 Dokümantasyon: http://localhost:${PORT}`);
  console.log(`🔍 Örnek: http://localhost:${PORT}/api/pharmacies?city=İstanbul&district=Kadıköy`);
  console.log('='.repeat(60));
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n📊 Kapanış İstatistikleri:');
  console.log(`   Toplam İstek: ${requestCount}`);
  console.log(`   Cache Hit: ${cacheHits} (${requestCount > 0 ? ((cacheHits / requestCount) * 100).toFixed(2) : 0}%)`);
  console.log(`   Cache Miss: ${cacheMisses}`);
  console.log('\n👋 Server kapatılıyor...\n');
  process.exit(0);
});
