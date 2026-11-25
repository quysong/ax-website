import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'GOOGLE_SCRIPT_APP');

  return {
    plugins: [
      react({
        babel: {
          plugins: [
            [
              'babel-plugin-styled-components',
              { displayName: false, pure: true, ssr: true },
            ],
          ],
        },
      }),
    ],
    define: {
      'import.meta.env.VITE_RSVP_ENDPOINT': JSON.stringify(env.GOOGLE_SCRIPT_APP ?? ''),
    },
  };
});
