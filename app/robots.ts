import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || "https://worklog-app.vercel.app";
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
