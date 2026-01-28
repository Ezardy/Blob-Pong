import { defineConfig, loadEnv } from "vite";
import path from "path";

export default ({mode}) => {
  process.env = {...process.env, ...loadEnv(mode, process.cwd())};
  return defineConfig({
    base: process.env.VITE_HOSTNAME,
    resolve: { alias: { "@": path.resolve(__dirname, "src") } },
    server: {
      port: 3000,
      host: true,
    }
  });
}
