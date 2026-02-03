export interface Pharmacy {
  name: string;
  address: string;
  phone: string;
  district: string;
  city: string;
  date: string; // Scrape parametresi
  dutyDate?: string; // Eczanenin nöbetçi olduğu gerçek tarih (web sayfasından)
}

export interface ScraperOptions {
  city: string;
  district?: string;
  date?: string; // Format: YYYY-MM-DD
}

export interface ScraperResult {
  city: string;
  district: string;
  date: string;
  pharmacies: Pharmacy[];
  scrapedAt: string;
}
