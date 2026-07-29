import type { MetadataRoute } from "next";
import { releaseConfig } from "@/config/release";

export default function robots(): MetadataRoute.Robots {
  if (!releaseConfig.isPublicRelease) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
  };
}
