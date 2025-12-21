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

    // Turbopack configuration (Next.js 16+ default)
    // Empty config to silence the warning - Turbopack works fine with defaults
    turbopack: {},

    // Webpack config (for backward compatibility when using --webpack flag)
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
