import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        // Opción A: http-proxy añade X-Forwarded-* automáticamente
        xfwd: true,
        // Opción B (si tu versión no soporta xfwd): setear manualmente
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            console.log("[Vite proxy] →", req.method, req.url);
            const ip =
              (req.headers["x-forwarded-for"]) ||
              (req.socket?.remoteAddress ?? "");
            if (ip) proxyReq.setHeader("x-forwarded-for", ip);
            proxyReq.setHeader("x-forwarded-proto", "http");
            proxyReq.setHeader("x-forwarded-host", req.headers.host || "");
          });
        },
      },
    },
  },
});
