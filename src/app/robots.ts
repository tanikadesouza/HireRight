// src/app/robots.ts
// Generates robots.txt. Block admin + authenticated routes from crawlers.

import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://hireright.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/signup", "/login", "/success-stories", "/resources", "/office-hours"],
        disallow: [
          "/admin/",
          "/dashboard/",
          "/discovery/",
          "/reports/",
          "/settings/",
          "/referrals/",
          "/api/",
          "/auth/",
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
