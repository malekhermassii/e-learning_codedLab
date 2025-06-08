import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000, // remplace ce port par ce que tu veux (ex: 3001, 5174, etc.)
    host: 'localhost', // ou '0.0.0.0' si tu veux y accéder depuis d'autres machines
  },
})