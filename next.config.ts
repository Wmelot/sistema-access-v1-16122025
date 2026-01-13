import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "djhipxldlkvkcrmudinv.supabase.co",
      },
    ],
  },
  // typescript: {
  //   ignoreBuildErrors: false,
  // },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: false,
      },
    ]
  },
};

export default nextConfig;
