import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mantenemos standalone para optimizar el tamaño de la imagen Docker en Railway.
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Permite que Railway inyecte la preview URL del dominio propio.
  allowedDevOrigins: ["*.space-z.ai", "*.chatglm.cn", "*.railway.app", "*.up.railway.app"],
};

export default nextConfig;
