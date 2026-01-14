/// <reference types="vitest" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    include: ['tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      include: ['src/**/*'],
      exclude: ['src/env.d.ts', 'src/**/*.stories.{js,jsx,ts,tsx}'],
    },
  },
});
