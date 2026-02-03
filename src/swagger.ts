import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Eczane Scraper API',
      version: '1.0.0',
      description: 'Nöbetçi eczaneleri sorgulama REST API - https://www.eczaneler.gen.tr/ sitesinden veri çeker',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.example.com',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Eczaneler',
        description: 'Nöbetçi eczane sorgulama endpoints',
      },
      {
        name: 'Sistem',
        description: 'Sistem bilgileri ve cache yönetimi',
      },
    ],
    components: {
      schemas: {
        Pharmacy: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Eczane adı',
              example: 'Verda Eczanesi',
            },
            dist: {
              type: 'string',
              description: 'İlçe adı',
              example: 'Kadıköy',
            },
            address: {
              type: 'string',
              description: 'Eczane adresi',
              example: 'Caferağa Mahallesi, General Asım Gündüz Caddesi No:104',
            },
            phone: {
              type: 'string',
              description: 'Telefon numarası',
              example: '0 (216) 337-19-94',
            },
            loc: {
              type: 'string',
              description: 'Lokasyon bilgisi (şimdilik boş)',
              example: '',
            },
            dutyDate: {
              type: 'string',
              description: 'Eczanenin nöbetçi olduğu tarih bilgisi',
              example: '3 Şubat Salı akşamından 4 Şubat Çarşamba sabahına kadar.',
            },
          },
        },
        PharmacyResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            result: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Pharmacy',
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'İl (city) parametresi zorunludur',
            },
          },
        },
      },
    },
  },
  apis: ['./src/server.ts', './dist/server.js'], // JSDoc yorumlarını okuyacak dosyalar
};

export const swaggerSpec = swaggerJsdoc(options);
