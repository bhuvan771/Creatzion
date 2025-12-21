/** @type {import('next').NextConfig} */
const nextConfig = {
    images:{
        remotePatterns: [
            {
                protocol: "https",
                hostname: "cdn.pixabay.com",
            },
        ],
    },

    experimental:{
        serverActions:{
            bodySizeLimit:"5mb"
        }
    },

    // Ensure proper handling of Clerk and prevent connection issues
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
            };
        }
        return config;
    },

    // Suppress hydration warnings in development
    reactStrictMode: true,
};


export default nextConfig;
