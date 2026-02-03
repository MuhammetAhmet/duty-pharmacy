import * as fs from 'fs/promises';
import * as path from 'path';
import { ScraperResult } from './types';

export class FileWriter {
  private outputDir: string;

  constructor(outputDir: string = './output') {
    this.outputDir = outputDir;
  }

  /**
   * Scraper sonuçlarını JSON dosyasına yazar
   */
  async writeToJson(result: ScraperResult, filename?: string): Promise<string> {
    try {
      // Output dizininin var olduğundan emin ol
      await fs.mkdir(this.outputDir, { recursive: true });

      // Dosya adını oluştur
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const defaultFilename = `eczane_${result.city}_${result.district}_${result.date}_${timestamp}.json`;
      const finalFilename = filename || defaultFilename;
      const filepath = path.join(this.outputDir, finalFilename);

      // JSON'u formatla ve yaz
      const jsonContent = JSON.stringify(result, null, 2);
      await fs.writeFile(filepath, jsonContent, 'utf-8');

      console.log(`✓ Sonuçlar kaydedildi: ${filepath}`);
      return filepath;
    } catch (error) {
      throw new Error(`Dosya yazma hatası: ${error}`);
    }
  }

  /**
   * Özet rapor oluşturur
   */
  async writeSummary(result: ScraperResult): Promise<void> {
    const summary = `
Nöbetçi Eczane Raporu
=====================
İl: ${result.city}
İlçe: ${result.district}
Tarih: ${result.date}
Toplam Eczane: ${result.pharmacies.length}
Çekim Zamanı: ${new Date(result.scrapedAt).toLocaleString('tr-TR')}

Eczaneler:
${result.pharmacies.map((p, i) => `
${i + 1}. ${p.name}
   Adres: ${p.address}
   Telefon: ${p.phone}
`).join('\n')}
`;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filepath = path.join(this.outputDir, `rapor_${result.city}_${timestamp}.txt`);
    await fs.writeFile(filepath, summary, 'utf-8');
    console.log(`✓ Özet rapor kaydedildi: ${filepath}`);
  }
}
