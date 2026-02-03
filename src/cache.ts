import * as fs from 'fs/promises';
import * as path from 'path';
import { ScraperResult } from './types';

export class CacheManager {
  private outputDir: string;

  constructor(outputDir: string = './output') {
    this.outputDir = outputDir;
  }

  /**
   * Cache key oluşturur
   */
  private getCacheKey(city: string, district: string, date: string): string {
    const districtPart = district ? `_${district}` : '_Tümü';
    return `eczane_${city}${districtPart}_${date}`;
  }

  /**
   * Cache'den veri okur
   */
  async get(city: string, district: string, date: string): Promise<ScraperResult | null> {
    try {
      const cacheKey = this.getCacheKey(city, district, date);
      const files = await fs.readdir(this.outputDir);
      
      // İlgili cache dosyasını bul
      const cacheFile = files.find(f => f.startsWith(cacheKey) && f.endsWith('.json'));
      
      if (cacheFile) {
        const filePath = path.join(this.outputDir, cacheFile);
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content) as ScraperResult;
        
        console.log(`✓ Cache'den okundu: ${cacheFile}`);
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('Cache okuma hatası:', error);
      return null;
    }
  }

  /**
   * Veriyi cache'e yazar
   */
  async set(result: ScraperResult): Promise<string> {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const cacheKey = this.getCacheKey(result.city, result.district, result.date);
      const filename = `${cacheKey}_${timestamp}.json`;
      const filepath = path.join(this.outputDir, filename);
      
      const jsonContent = JSON.stringify(result, null, 2);
      await fs.writeFile(filepath, jsonContent, 'utf-8');
      
      console.log(`✓ Cache'e yazıldı: ${filename}`);
      return filepath;
    } catch (error) {
      throw new Error(`Cache yazma hatası: ${error}`);
    }
  }

  /**
   * Tüm cache'i temizler
   */
  async clear(): Promise<void> {
    try {
      const files = await fs.readdir(this.outputDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          await fs.unlink(path.join(this.outputDir, file));
        }
      }
      console.log('✓ Cache temizlendi');
    } catch (error) {
      console.error('Cache temizleme hatası:', error);
    }
  }

  /**
   * Belirli bir tarihteki cache'leri temizler
   */
  async clearByDate(date: string): Promise<void> {
    try {
      const files = await fs.readdir(this.outputDir);
      let count = 0;
      
      for (const file of files) {
        if (file.includes(date) && file.endsWith('.json')) {
          await fs.unlink(path.join(this.outputDir, file));
          count++;
        }
      }
      
      console.log(`✓ ${date} tarihli ${count} cache dosyası temizlendi`);
    } catch (error) {
      console.error('Cache temizleme hatası:', error);
    }
  }
}
