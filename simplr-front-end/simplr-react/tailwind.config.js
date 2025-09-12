/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Category color classes
    'bg-red-500',
    'bg-orange-500', 
    'bg-blue-500',
    'bg-green-500',
    'bg-pink-500',
    'bg-purple-500',
    'bg-cyan-500',
    'bg-yellow-500',
    'bg-indigo-500'
  ],
  theme: {
    extend: {
      fontFamily: {
        comfortaa: [
          'Comfortaa',
          'sans-serif'
        ],
        inter: [
          'Inter',
          'sans-serif'
        ]
      },
      letterSpacing: {
        'tight-heading': '-0.09em', // -9%
      },
      fontWeight: {
        'extra-bold': '800',
        'black': '900',
      },
      colors: {
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
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
      animation: {
        'task-complete': 'taskCompleteSuccess 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        checkmark: 'taskCompleteCheckmark 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
        sparkle: 'taskCompleteSparkle 0.6s ease-out forwards'
      },
      keyframes: {
        taskCompleteSuccess: {
          '0%': {
            transform: 'scale(1)',
            opacity: '1'
          },
          '25%': {
            transform: 'scale(1.02)'
          },
          '50%': {
            transform: 'scale(1.05)'
          },
          '75%': {
            transform: 'scale(0.98)',
            opacity: '0.8'
          },
          '100%': {
            transform: 'scale(0.95) translateX(100%)',
            opacity: '0'
          }
        },
        taskCompleteCheckmark: {
          '0%': {
            transform: 'scale(1) rotate(0deg)'
          },
          '25%': {
            transform: 'scale(1.3) rotate(-10deg)'
          },
          '50%': {
            transform: 'scale(1.5) rotate(10deg)'
          },
          '75%': {
            transform: 'scale(1.2) rotate(-5deg)'
          },
          '100%': {
            transform: 'scale(1) rotate(0deg)'
          }
        },
        taskCompleteSparkle: {
          '0%': {
            opacity: '0',
            transform: 'scale(0) rotate(0deg)'
          },
          '50%': {
            opacity: '1',
            transform: 'scale(1.2) rotate(180deg)'
          },
          '100%': {
            opacity: '0',
            transform: 'scale(0) rotate(360deg)'
          }
        }
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
}