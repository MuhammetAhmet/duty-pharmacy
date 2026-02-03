# Değişiklik Geçmişi

## [2.0.0] - 2026-02-03

### ✨ Büyük Özellik: Saat Bazlı Akıllı Nöbet Sistemi

Artık tarih parametresine gerek yok! API otomatik olarak şu anki saate göre doğru nöbetçi eczaneleri gösterir.

#### 🔧 Nasıl Çalışır?

**Eczane Çalışma Saatleri:** 08:00-18:00

- **Saat >= 08:00** ise → Bugün akşamından yarın sabahına nöbetçi eczaneler
- **Saat < 08:00** ise → Dün akşamından bugün sabahına nöbetçi eczaneler

#### 📊 Örnekler

| İstek Zamanı | Gösterilen Nöbetçiler |
|--------------|----------------------|
| 3 Şubat 13:00 | 3 Şubat akşamından 4 Şubat sabahına |
| 4 Şubat 02:00 | 3 Şubat akşamından 4 Şubat sabahına |
| 4 Şubat 09:00 | 4 Şubat akşamından 5 Şubat sabahına |

### 🔄 Breaking Changes

- ❌ `date` parametresi kaldırıldı (artık gerekmiyor)
- ✅ API her zaman şu anki saat bazlı otomatik filtreleme yapar

### 🆕 Yeni Özellikler

- **Çoklu Tab Scraping**: Web sitesindeki tüm tab'lar (dün, bugün, yarın) artık scrape ediliyor
- **Akıllı Tarih Regex**: "X Gün akşamından Y Gün sabahına" formatını parse eden akıllı regex
- **Otomatik Nöbet Seçimi**: Kullanıcı manuel tarih girmek zorunda değil

### 🔧 Teknik Değişiklikler

- Scraper artık `.tab-pane` elemanlarının hepsini loop'layarak çekiyor
- Filtreleme mantığı: `"${targetDay}\s+${targetMonthName}\s+\S+\s+akşamından"` regex pattern
- Server.ts'de tarih parametresi her zaman `format(new Date(), 'yyyy-MM-dd')` olarak ayarlanıyor

### 📝 API Değişiklikleri

**Eski:**
```bash
curl "http://localhost:3000/api/pharmacies?city=Istanbul&district=Kadikoy&date=2026-02-03"
```

**Yeni:**
```bash
curl "http://localhost:3000/api/pharmacies?city=Istanbul&district=Kadikoy"
# Tarih parametresi yok, otomatik!
```

---

## [1.1.0] - 2026-02-03

### ✨ Yeni Özellikler
- **Nöbet Tarihi Bilgisi**: Web sayfasından eczanelerin nöbetçi olduğu tarih bilgisi artık çekiliyor
- **Akıllı Tarih Filtreleme**: API'de tarih parametresi verildiğinde, sadece o tarihe ait nöbetçi eczaneler döndürülüyor
- **dutyDate Field**: Response'a `dutyDate` alanı eklendi (örn: "3 Şubat Salı akşamından 4 Şubat Çarşamba sabahına kadar.")

### 🔧 Değişiklikler
- `Pharmacy` interface'ine `dutyDate?: string` alanı eklendi
- Scraper artık aktif tab'daki tarih bilgisini (`alert-warning` div) çekiyor
- REST API'de tarih bazlı filtreleme mantığı eklendi
- Filtreleme algoritması: İstenen tarih `dutyDate` text'inde geçiyorsa eczane döndürülüyor

### 📊 API Değişiklikleri

**Eski Response:**
```json
{
  "success": true,
  "result": [
    {
      "name": "Gaye Eczanesi",
      "dist": "Kadikoy",
      "address": "Caddebostan Mahallesi...",
      "phone": "0 (216) 360-64-45",
      "loc": ""
    }
  ]
}
```

**Yeni Response:**
```json
{
  "success": true,
  "result": [
    {
      "name": "Gaye Eczanesi",
      "dist": "Kadikoy",
      "address": "Caddebostan Mahallesi...",
      "phone": "0 (216) 360-64-45",
      "loc": "",
      "dutyDate": "3 Şubat Salı akşamından 4 Şubat Çarşamba sabahına kadar."
    }
  ]
}
```

### 🧪 Test Senaryoları

| Tarih | Sonuç |
|-------|-------|
| `2026-02-03` | 7 eczane (3 Şubat Salı akşamından 4 Şubat Çarşamba sabahına kadar nöbetçi) |
| `2026-02-04` | 7 eczane (aynı eczaneler, çünkü 4 Şubat sabahına kadar nöbetçiler) |
| `2026-02-05` | 0 eczane (aktif tab'da bu tarih için veri yok) |

### 📝 Notlar
- Web sitesi tab yapısı kullanıyor: Dün, Bugün, Yarın
- Şu anda sadece "Bugün" (aktif tab) scrape ediliyor
- Nöbet tarihleri genellikle "X Gün akşamından Y Gün sabahına kadar" formatında
- Filtreleme mantığı her iki tarihi de (başlangıç ve bitiş) kapsıyor

### 🔄 Geriye Uyumluluk
- ✅ Mevcut tüm API endpoint'leri çalışmaya devam ediyor
- ✅ Eski client'lar sadece yeni `dutyDate` field'ını görmezden gelebilir
- ✅ Cache mekanizması değişmedi, sadece veri yapısı genişletildi

---

## [1.0.0] - 2026-02-03

### 🎉 İlk Sürüm
- Web scraping ile nöbetçi eczane bilgilerini çekme
- REST API ile kolay entegrasyon
- Akıllı cache mekanizması
- PM2 ile production deployment
- Docker desteği
- Swagger/OpenAPI dokümantasyonu
