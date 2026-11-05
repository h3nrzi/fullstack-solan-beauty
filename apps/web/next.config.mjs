/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/admin/:path*',
        destination: '/dashboard/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
