/** @type {import('next').NextConfig} */
const nextConfig = {
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

};

export default nextConfig;
