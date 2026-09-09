import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/about'],
      disallow: [
        '/api/',
        '/checkin',
        '/forgot-password',
        '/intake',
        '/login',
        '/reset-password',
        '/roadmap/',
        '/start',
      ],
    },
    sitemap: 'https://www.getlanded.ca/sitemap.xml',
  };
}
