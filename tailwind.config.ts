import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        cta: {
          DEFAULT: "hsl(var(--cta))",
          hover: "hsl(var(--cta-hover))",
          foreground: "hsl(var(--cta-foreground))",
          border: "hsl(var(--cta-border))",
          shadow: "hsl(var(--cta-shadow))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        logo: "hsl(var(--logo))",
        "hebrew-input": "hsl(var(--input-hebrew-bg))",
        "mobile-header": "hsl(var(--mobile-header))",
        "mobile-border": "hsl(var(--mobile-border))",
        "mobile-logo": "hsl(var(--mobile-logo))",
        "mobile-active": "hsl(var(--mobile-active))",
        "mobile-inactive": "hsl(var(--mobile-inactive))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "marquee": {
          "0%": {
            transform: "translateX(0%)",
          },
          "100%": {
            transform: "translateX(-50%)",
          },
        },
        "marquee-rtl": {
          "0%": {
            transform: "translateX(-50%)",
          },
          "100%": {
            transform: "translateX(0%)",
          },
        },
        "heart-pop": {
          "0%": {
            transform: "scale(1)",
          },
          "25%": {
            transform: "scale(1.35)",
          },
          "50%": {
            transform: "scale(0.9)",
          },
          "100%": {
            transform: "scale(1)",
          },
        },
        "heart-float": {
          "0%": {
            opacity: "1",
            transform: "translate(-50%, -50%) translateY(0) translateX(0) scale(1) rotate(0deg)",
          },
          "50%": {
            opacity: "0.9",
          },
          "100%": {
            opacity: "0",
            transform: "translate(-50%, -50%) translateY(var(--float-y, -50px)) translateX(var(--float-x, 0px)) scale(0.2) rotate(var(--float-rotate, 0deg))",
          },
        },
        "hero-fade-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(25px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "latest-scroll": {
          "0%": {
            transform: "translateX(0)",
          },
          "100%": {
            transform: "translateX(-50%)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "marquee": "marquee 30s linear infinite",
        "marquee-rtl": "marquee-rtl 30s linear infinite",
        "heart-pop": "heart-pop 0.4s ease-out",
        "heart-float": "heart-float 0.8s ease-out forwards",
        "hero-fade-up": "hero-fade-up 0.8s ease-out forwards",
        "latest-scroll": "latest-scroll linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
