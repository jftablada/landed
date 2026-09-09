import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://www.getlanded.ca',
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://www.getlanded.ca/about',
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];
}
