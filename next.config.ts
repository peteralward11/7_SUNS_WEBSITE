import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  async redirects() {
    return [
      {
        source: "/book-now",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
