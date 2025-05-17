/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sfile.chatglm.cn",
      },
    ],
    unoptimized: true,
  },
  output: 'export',
  basePath: process.env.GITHUB_PAGES ? '/image-hosting' : '',
  assetPrefix: process.env.GITHUB_PAGES ? '/image-hosting/' : '',
  reactStrictMode: true,
};

export default nextConfig;
