import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        setupFiles: "./src/setupTests.js",
    },
    resolve: {
        extensions: [".tsx", ".ts", ".jsx", ".js"],
    },
    server: {
        port: 5173,
        proxy: {
            "/api": "http://127.0.0.1:8000",
        },
    },
});
