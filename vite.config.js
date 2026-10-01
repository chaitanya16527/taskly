import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/YOUR-REPO-NAME/",
  plugins: [react()],
});
