import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "djhipxldlkvkcrmudinv.supabase.co",
      },
    ],
  },
};

export default nextConfig;
