import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// Custom plugin to suppress Figma entrypoint warnings
function suppressFigmaWarnings() {
  return {
    name: 'suppress-figma-warnings',
    configureServer(server: any) {
      const originalWarn = console.warn;
      console.warn = (...args: any[]) => {
        const message = args.join(' ');
        // Suppress "dynamic import cannot be analyzed" warnings from Figma entrypoint
        if (message.includes('dynamic import cannot be analyzed') && 
            message.includes('__figma__entrypoint__')) {
          return;
        }
        originalWarn.apply(console, args);
      };
    },
  };
}

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    // Suppress Figma entrypoint warnings
    suppressFigmaWarnings(),
    // Polyfill Node.js built-ins for browser compatibility
    nodePolyfills({
      // Include specific polyfills
      include: ['util', 'buffer', 'stream'],
      // Enable globals
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      // Polyfill specific modules
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  // Optimize dependencies for browser compatibility
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
    include: [
      'buffer',
      'readable-stream',
      'pdfjs-dist',
      'tesseract.js',
    ],
  },

  // Explicitly define globals for browser environment
  define: {
    'process.env': {},
    'global': 'globalThis',
  },
  
  // Build configuration
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    // Suppress dynamic import warnings from Figma entrypoint
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress "The above dynamic import cannot be analyzed" warnings from Figma entrypoint
        if (
          warning.code === 'UNRESOLVED_IMPORT' ||
          (warning.message && warning.message.includes('dynamic import cannot be analyzed'))
        ) {
          return;
        }
        warn(warning);
      },
    },
  },
  
  // Suppress Vite warnings for dynamic imports
  logLevel: 'warn',
  clearScreen: false,
})