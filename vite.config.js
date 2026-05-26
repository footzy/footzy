import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    target: 'esnext',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        register: resolve(__dirname, 'src/pages/register.html'),
        login: resolve(__dirname, 'src/pages/login.html'),
        onboarding: resolve(__dirname, 'src/pages/onboarding.html'),
        accueil:     resolve(__dirname, 'src/pages/accueil.html'),
        classement:  resolve(__dirname, 'src/pages/classement.html'),
        oracle:      resolve(__dirname, 'src/pages/oracle.html'),
        home: resolve(__dirname, 'src/pages/home.html'),
        match: resolve(__dirname, 'src/pages/match.html'),
        pronostic: resolve(__dirname, 'src/pages/pronostic.html'),
        groupe: resolve(__dirname, 'src/pages/groupe.html'),
        profil: resolve(__dirname, 'src/pages/profil.html'),
        verdict: resolve(__dirname, 'src/pages/verdict.html'),
      }
    }
  }
});
