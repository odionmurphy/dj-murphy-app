import type { MetadataRoute } from "next";

const pages = ["", "/services", "/gigs", "/mixes", "/booking", "/press-kit", "/impressum", "/datenschutz"];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map((path) => ({ url: `https://www.djmurphy.de${path}` }));
}