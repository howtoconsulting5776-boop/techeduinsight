import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

// Pin Turbopack root to this app directory (avoids wrong workspace inference)
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

function supabaseStorageHostname(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return "*.supabase.co";
  try {
    return new URL(raw).hostname;
  } catch {
    return "*.supabase.co";
  }
}

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/showcase", destination: "/#showcase", permanent: true },
    ];
  },
  turbopack: {
    root: projectRoot,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseStorageHostname(),
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
