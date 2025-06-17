import type { Config } from "tailwindcss";
// @ts-ignore
import tailwindcssAnimate from "tailwindcss-animate";

export default {
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
      fontFamily: {
        sans: ["var(--font-inter)"],
        heading: ["var(--font-outfit)"],
      },
      typography: {
        DEFAULT: {
          css: {
            'h1, h2, h3, h4, h5, h6': {
              fontFamily: 'var(--font-outfit)',
            },
          },
        },
      },
  		colors: {
  			// ─── Primary Brand Colors ───────────────────────────────
  			'brand-red': 'var(--brand-red)',
  			'brand-blue': 'var(--brand-blue)',
  			'brand-white': 'var(--brand-white)',
  			
  			// ─── Blue Tints & Shades ────────────────────────────────
  			'blue-50': 'var(--blue-50)',
  			'blue-100': 'var(--blue-100)',
  			'blue-200': 'var(--blue-200)',
  			'blue-300': 'var(--blue-300)',
  			'blue-400': 'var(--blue-400)',
  			'blue-500': 'var(--blue-500)',
  			'blue-dark': 'var(--blue-dark)',
  			
  			// ─── Red Tints & Shades ─────────────────────────────────
  			'red-100': 'var(--red-100)',
  			'red-200': 'var(--red-200)',
  			'red-300': 'var(--red-300)',
  			'red-400': 'var(--red-400)',
  			'red-dark': 'var(--red-dark)',
  			
  			// ─── Neutral Grays ──────────────────────────────────────
  			'gray-100': 'var(--gray-100)',
  			'gray-200': 'var(--gray-200)',
  			'gray-300': 'var(--gray-300)',
  			'gray-400': 'var(--gray-400)',
  			'gray-500': 'var(--gray-500)',
  			'gray-600': 'var(--gray-600)',
  			'gray-700': 'var(--gray-700)',
  			
  			// ─── Semantic Aliases ───────────────────────────────────
  			'text-primary': 'var(--text-primary)',
  			'text-secondary': 'var(--text-secondary)',
  			'text-inverse': 'var(--text-inverse)',
  			
  			// ─── shadcn/ui System Colors ────────────────────────────
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'hard': '0 8px 30px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.7s ease-out',
        'fade-in-down': 'fadeInDown 0.7s ease-out',
        'fade-in-left': 'fadeInLeft 0.7s ease-out',
        'fade-in-right': 'fadeInRight 0.7s ease-out',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translate3d(0, 20px, 0)' },
          '100%': { opacity: '1', transform: 'translate3d(0, 0, 0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translate3d(0, -20px, 0)' },
          '100%': { opacity: '1', transform: 'translate3d(0, 0, 0)' },
        },
        fadeInLeft: {
          '0%': { opacity: '0', transform: 'translate3d(-20px, 0, 0)' },
          '100%': { opacity: '1', transform: 'translate3d(0, 0, 0)' },
        },
        fadeInRight: {
          '0%': { opacity: '0', transform: 'translate3d(20px, 0, 0)' },
          '100%': { opacity: '1', transform: 'translate3d(0, 0, 0)' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      maxWidth: {
        '8xl': '88rem',
      },
      transitionDuration: {
        '400': '400ms',
      },
  	}
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
