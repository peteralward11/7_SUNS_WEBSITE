import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
