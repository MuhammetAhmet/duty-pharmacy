import { EczaneScraper } from './scraper';
import { FileWriter } from './fileWriter';
import { format } from 'date-fns';

async function main() {
  const scraper = new EczaneScraper();
  const fileWriter = new FileWriter('./output');

  try {
    console.log('=== Eczane Scraper Başlatılıyor ===\n');

    // Örnek 1: İstanbul - Kadıköy
    console.log('📍 İstanbul - Kadıköy nöbetçi eczaneleri çekiliyor...');
    const result1 = await scraper.scrape({
      city: 'İstanbul',
      district: 'Kadıköy',
      date: format(new Date(), 'yyyy-MM-dd'),
    });
    await fileWriter.writeToJson(result1);
    await fileWriter.writeSummary(result1);

    console.log('\n---\n');

    // Örnek 2: Ankara
    console.log('📍 Ankara nöbetçi eczaneleri çekiliyor...');
    const result2 = await scraper.scrape({
      city: 'Ankara',
      date: format(new Date(), 'yyyy-MM-dd'),
    });
    await fileWriter.writeToJson(result2);

    console.log('\n---\n');

    // Örnek 3: İzmir - Bornova
    console.log('📍 İzmir - Bornova nöbetçi eczaneleri çekiliyor...');
    const result3 = await scraper.scrape({
      city: 'İzmir',
      district: 'Bornova',
    });
    await fileWriter.writeToJson(result3);

    console.log('\n=== Scraping Tamamlandı ===');
    console.log(`\nToplam sonuçlar:`);
    console.log(`- İstanbul/Kadıköy: ${result1.pharmacies.length} eczane`);
    console.log(`- Ankara: ${result2.pharmacies.length} eczane`);
    console.log(`- İzmir/Bornova: ${result3.pharmacies.length} eczane`);
    console.log(`\n✓ Tüm sonuçlar 'output/' klasörüne kaydedildi.`);

  } catch (error) {
    console.error('❌ Hata oluştu:', error);
    process.exit(1);
  }
}

// CLI arguments ile özelleştirilebilir kullanım
async function customScrape() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Argüman yoksa örnek senaryoları çalıştır
    await main();
    return;
  }

  const scraper = new EczaneScraper();
  const fileWriter = new FileWriter('./output');

  // Kullanım: npm run scrape -- --city=İstanbul --district=Kadıköy --date=2024-01-15
  const options: any = {};
  
  args.forEach(arg => {
    const [key, value] = arg.replace('--', '').split('=');
    options[key] = value;
  });

  if (!options.city) {
    console.error('❌ --city parametresi zorunludur!');
    console.log('\nKullanım:');
    console.log('npm run scrape -- --city=İstanbul --district=Kadıköy --date=2024-01-15');
    console.log('\nMevcut iller:');
    console.log(scraper.getCities().join(', '));
    process.exit(1);
  }

  const result = await scraper.scrape(options);
  await fileWriter.writeToJson(result);
  await fileWriter.writeSummary(result);
  
  console.log(`\n✓ ${result.pharmacies.length} eczane bulundu ve kaydedildi.`);
}

// Ana fonksiyonu çalıştır
customScrape().catch(console.error);
