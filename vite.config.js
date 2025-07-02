import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  base: isProduction ? '/engo/CRM/' : '/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://qlcontrols.nazwa.pl/engo/CRM', // <-- Twój backend PHP tutaj
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      '/ai': {
        target: 'https://engocontrols.com/AI',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ai/, ''),
      }
    }
  }
})
