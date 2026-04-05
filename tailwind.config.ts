import type { Config } from 'tailwindcss'

/**
 * TechEdu Insight brand palette (also mirrored in app/globals.css @theme / :root).
 */
const config = {
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#1B3A6B',
          blue: '#2E5FA3',
          sky: '#4A90D9',
          teal: '#00897B',
          amber: '#F59E0B',
          bg: '#F4F6FA',
        },
      },
    },
  },
} satisfies Config

export default config
