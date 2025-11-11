import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite'
import { config } from 'dotenv';

config();

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  // const env = loadEnv(mode, process.cwd(), '');
  return {
    define: {
      'process.env': process.env
    },
    plugins: [react()],
  }
})