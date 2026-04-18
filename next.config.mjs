/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverComponentsHmrCache: false,
        serverActions: {
            bodySizeLimit: '7mb',
        },
    },

    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: "fslkrrvvrqylhnvyacgt.supabase.co",
            },
            {
                protocol: 'https',
                hostname: "images.unsplash.com",
            }
        ]
    }
};

export default nextConfig;
