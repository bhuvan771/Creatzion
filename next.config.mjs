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
    }
};


export default nextConfig;
