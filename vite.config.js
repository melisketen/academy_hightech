import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        auth: resolve(__dirname, 'auth.html'),
        library: resolve(__dirname, 'library.html'),
        profile: resolve(__dirname, 'profile.html'),
        subscription: resolve(__dirname, 'subscription.html'),
        admin: resolve(__dirname, 'admin.html'),
        author: resolve(__dirname, 'author.html'),
        manifesto: resolve(__dirname, 'manifesto.html'),
        gitForTeams: resolve(__dirname, 'books/git-for-teams.html'),
        pdfViewer: resolve(__dirname, 'books/pdf-viewer.html'),
        developerSeries: resolve(__dirname, 'series/developer.html'),
        academicSeries: resolve(__dirname, 'series/academic.html'),
        aiDataSeries: resolve(__dirname, 'series/ai-data.html'),
      },
    },
  },
});
