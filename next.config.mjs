/** @type {import('next').NextConfig} */
const nextConfig = {
    // output: 'export', // Desativado temporariamente para permitir o build de rotas dinâmicas
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
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
            {
                protocol: "https",
                hostname: "robptuukezhqvtasjyhz.supabase.co",
            },
        ],
    },
};

export default nextConfig;
