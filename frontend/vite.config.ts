import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';

export default defineConfig({
  // plugins: [react()],
  // envDir: path.resolve(__dirname, '../'), // 👈 to mówi Vite, gdzie szukać `.env`
  envDir: '../', // 👈 to mówi Vite, gdzie szukać `.env`
  server: {
    port: 3000, // tutaj ustaw swój port, np. 3000
  },
});
