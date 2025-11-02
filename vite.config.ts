import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Enable minification
    minify: "esbuild",
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Separate vendor chunks
          "react-vendor": ["react", "react-dom"],
          "ui-vendor": [
            "@radix-ui/react-slot",
            "class-variance-authority",
            "clsx",
            "tailwind-merge",
          ],
          "icons": ["lucide-react"],
          "utils": ["jszip"],
        },
        // Optimize chunk names
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
      },
    },
    // Improve build performance
    cssCodeSplit: true,
    sourcemap: false, // Disable in production for smaller builds
    // Target modern browsers for smaller bundle
    target: "esnext",
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
})
