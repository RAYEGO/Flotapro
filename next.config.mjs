import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = {
  async rewrites() {
    const beforeFiles = [
      { source: "/freights", destination: "/api/freights" },
      { source: "/freights/:path*", destination: "/api/freights/:path*" },
      { source: "/drivers", destination: "/api/drivers" },
      { source: "/drivers/:path*", destination: "/api/drivers/:path*" },
      { source: "/vehicles", destination: "/api/trucks" },
      { source: "/vehicles/:path*", destination: "/api/trucks/:path*" },
      { source: "/trucks", destination: "/api/trucks" },
      { source: "/trucks/:path*", destination: "/api/trucks/:path*" },
      { source: "/expenses", destination: "/api/freight-expenses" },
      { source: "/expenses/:path*", destination: "/api/freight-expenses/:path*" },
      { source: "/freight-expenses", destination: "/api/freight-expenses" },
      {
        source: "/freight-expenses/:path*",
        destination: "/api/freight-expenses/:path*",
      },
      { source: "/fuels", destination: "/api/fuels" },
      { source: "/fuels/:path*", destination: "/api/fuels/:path*" },
      { source: "/operational-points", destination: "/api/operational-points" },
      {
        source: "/operational-points/:path*",
        destination: "/api/operational-points/:path*",
      },
      { source: "/maintenance-plans", destination: "/api/maintenance-plans" },
      {
        source: "/maintenance-plans/:path*",
        destination: "/api/maintenance-plans/:path*",
      },
      { source: "/maintenance-records", destination: "/api/maintenance-records" },
      {
        source: "/maintenance-records/:path*",
        destination: "/api/maintenance-records/:path*",
      },
      { source: "/clients", destination: "/api/clients" },
      { source: "/clients/:path*", destination: "/api/clients/:path*" },
      { source: "/regions", destination: "/api/regions" },
      { source: "/regions/:path*", destination: "/api/regions/:path*" },
      { source: "/provinces", destination: "/api/provinces" },
      { source: "/provinces/:path*", destination: "/api/provinces/:path*" },
      { source: "/districts", destination: "/api/districts" },
      { source: "/districts/:path*", destination: "/api/districts/:path*" },
      { source: "/me", destination: "/api/me" },
      { source: "/me/:path*", destination: "/api/me/:path*" },
    ];

    return { beforeFiles, afterFiles: [], fallback: [] };
  },
};

export default withPWA(nextConfig);
