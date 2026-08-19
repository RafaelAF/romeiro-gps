import type { MetadataRoute } from "next";
import { CATEGORIAS, POIS } from "@/lib/pois";
import { BASE_URL, slugCategoria, slugPoi } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const entradas: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/pontos-de-interesse`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/politica-privacidade`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  for (const poi of POIS) {
    entradas.push({
      url: `${BASE_URL}/pontos-de-interesse/${slugPoi(poi)}`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.6,
    });
  }

  for (const categoria of CATEGORIAS) {
    entradas.push({
      url: `${BASE_URL}/categorias/${slugCategoria(categoria.id)}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  return entradas;
}