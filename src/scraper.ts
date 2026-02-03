import axios from 'axios';
import * as cheerio from 'cheerio';
import { Pharmacy, ScraperOptions, ScraperResult } from './types';
import { format } from 'date-fns';

export class EczaneScraper {
  private readonly baseUrl = 'https://www.eczaneler.gen.tr';

  /**
   * Nöbetçi eczaneleri çeker
   */
  async scrape(options: ScraperOptions): Promise<ScraperResult> {
    const { city, district = '', date = format(new Date(), 'yyyy-MM-dd') } = options;

    console.log(`Scraping başlatılıyor...`);
    console.log(`İl: ${city}, İlçe: ${district || 'Tümü'}, Tarih: ${date}`);

    try {
      // URL'yi oluştur
      const url = this.buildUrl(city, district, date);
      console.log(`URL: ${url}`);

      // Sayfayı çek
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false
        })
      });

      // HTML'i parse et
      const $ = cheerio.load(response.data);
      const pharmacies: Pharmacy[] = [];
      const seenNames = new Set<string>(); // Tekrar eden eczaneleri engelle

      // Tüm tab-pane'leri çek (dün, bugün, yarın)
      $('.tab-pane').each((_, tabElement) => {
        const $tab = $(tabElement);
        
        // Tarih bilgisini al (örn: "3 Şubat Salı akşamından 4 Şubat Çarşamba sabahına kadar.")
        const dutyDateText = $tab.find('.alert-warning').text().trim();
        if (!dutyDateText) return; // Tarih bilgisi yoksa atla
        
        console.log(`Nöbet tarihi bulundu: ${dutyDateText}`);

        // Site yapısı: table.table tr içinde her eczane
        // İsim: .isim içinde
        // Adres: .col-lg-6 içinde (ilk div içeriği)
        // Telefon: .col-lg-3.py-lg-2 içinde
        $tab.find('table.table tr').each((_, element) => {
        try {
          const $el = $(element);
          
          // İsmi al
          const name = $el.find('.isim').text().trim();
          if (!name || name.length < 3) return;
          
          // Tekrar kontrolü
          if (seenNames.has(name)) return;
          
          // Adres - col-lg-6 içindeki ilk doğrudan text içeriğini al
          const $addressDiv = $el.find('.col-lg-6');
          let address = '';
          
          // İlk text node'u al (adres genellikle ilk satırda)
          $addressDiv.contents().each((_, node) => {
            if (node.type === 'text') {
              const text = $(node).text().trim();
              if (text && !address) {
                address = text;
              }
            }
          });
          
          // Eğer bulamadıysak, tüm içeriği al ve temizle
          if (!address) {
            address = $addressDiv.clone().children().remove().end().text().trim();
          }
          
          // Telefon numarasını al - col-lg-3 py-lg-2 içinde
          const phone = $el.find('.col-lg-3.py-lg-2').text().trim();

          seenNames.add(name);
          pharmacies.push({
            name,
            address: address || 'Adres bilgisi bulunamadı',
            phone: phone || 'Telefon bilgisi bulunamadı',
            district: district || city,
            city,
            date,
            dutyDate: dutyDateText || date, // Web sayfasındaki nöbet tarihi
          });
        } catch (err) {
          console.error('Eczane parse hatası:', err);
        }
      });
      }); // Tab loop sonu

      console.log(`✓ ${pharmacies.length} eczane bulundu`);

      return {
        city,
        district: district || 'Tümü',
        date,
        pharmacies,
        scrapedAt: new Date().toISOString(),
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`HTTP Hatası: ${error.response?.status} - ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * URL'yi oluşturur
   */
  private buildUrl(city: string, district: string, date: string): string {
    // Site yapısı: https://www.eczaneler.gen.tr/nobetci-istanbul
    // İlçe için: https://www.eczaneler.gen.tr/nobetci-istanbul-kadikoy
    
    const citySlug = this.slugify(city);
    const districtSlug = district ? this.slugify(district) : '';
    
    if (districtSlug) {
      return `${this.baseUrl}/nobetci-${citySlug}-${districtSlug}`;
    }
    
    return `${this.baseUrl}/nobetci-${citySlug}`;
  }

  /**
   * String'i URL-friendly slug'a çevirir
   */
  private slugify(text: string): string {
    const trMap: { [key: string]: string } = {
      'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
      'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u',
    };

    return text
      .split('')
      .map(char => trMap[char] || char)
      .join('')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Mevcut illeri listeler (yaygın kullanılan iller)
   */
  getCities(): string[] {
    return [
      'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya',
      'Adana', 'Konya', 'Gaziantep', 'Şanlıurfa', 'Kocaeli',
      'Mersin', 'Diyarbakır', 'Hatay', 'Manisa', 'Kayseri',
      'Samsun', 'Balıkesir', 'Kahramanmaraş', 'Van', 'Aydın',
      'Denizli', 'Sakarya', 'Tekirdağ', 'Muğla', 'Eskişehir',
    ];
  }
}
