import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    resolve: {
        alias: {
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
    server: {
        host: '0.0.0.0',       // Permite acesso de fora (ex: 172.22.100.125)
        port: 5173,            // Porta padrão do Vite
        strictPort: true,      // Impede fallback automático se a porta estiver ocupada
        cors: true,            // Libera CORS para outras origens
        hmr: {
            host: '172.22.100.125', // <-- importante! IP da sua máquina local na rede
        },
    },
});
