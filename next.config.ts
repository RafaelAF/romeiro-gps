import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite conexões de HMR/Dev a partir do celular na rede local
  allowedDevOrigins: ["192.168.0.236", "localhost:3000"],
};

export default nextConfig;
