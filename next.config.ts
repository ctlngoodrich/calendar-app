import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@libsql/client",
    "@prisma/adapter-libsql",
    "node-ical",
    "nodemailer",
  ],
};

export default nextConfig;
