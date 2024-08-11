import { fontFamily } from "tailwindcss/defaultTheme";
import type { Config } from "tailwindcss";

const config: Config = {
	darkMode: ["class"],
	content: ["./src/**/*.{html,js,svelte,ts}"],
	safelist: ["dark"],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px"
			}
		},
		extend: {
			colors: {
				"primary": "rgb(var(--m3-scheme-primary) / <alpha-value>)",
				"on-primary": "rgb(var(--m3-scheme-on-primary) / <alpha-value>)",
				"primary-container": "rgb(var(--m3-scheme-primary-container) / <alpha-value>)",
				"on-primary-container": "rgb(var(--m3-scheme-on-primary-container) / <alpha-value>)",
				"secondary": "rgb(var(--m3-scheme-secondary) / <alpha-value>)",
				"on-secondary": "rgb(var(--m3-scheme-on-secondary) / <alpha-value>)",
				"secondary-container": "rgb(var(--m3-scheme-secondary-container) / <alpha-value>)",
				"on-secondary-container": "rgb(var(--m3-scheme-on-secondary-container) / <alpha-value>)",
				"tertiary": "rgb(var(--m3-scheme-tertiary) / <alpha-value>)",
				"on-tertiary": "rgb(var(--m3-scheme-on-tertiary) / <alpha-value>)",
				"tertiary-container": "rgb(var(--m3-scheme-tertiary-container) / <alpha-value>)",
				"on-tertiary-container": "rgb(var(--m3-scheme-on-tertiary-container) / <alpha-value>)",
				"error": "rgb(var(--m3-scheme-error) / <alpha-value>)",
				"on-error": "rgb(var(--m3-scheme-on-error) / <alpha-value>)",
				"error-container": "rgb(var(--m3-scheme-error-container) / <alpha-value>)",
				"on-error-container": "rgb(var(--m3-scheme-on-error-container) / <alpha-value>)",
				"background": "rgb(var(--m3-scheme-background) / <alpha-value>)",
				"on-background": "rgb(var(--m3-scheme-on-background) / <alpha-value>)",
				"surface": "rgb(var(--m3-scheme-surface) / <alpha-value>)",
				"on-surface": "rgb(var(--m3-scheme-on-surface) / <alpha-value>)",
				"surface-variant": "rgb(var(--m3-scheme-surface-variant) / <alpha-value>)",
				"on-surface-variant": "rgb(var(--m3-scheme-on-surface-variant) / <alpha-value>)",
				"outline": "rgb(var(--m3-scheme-outline) / <alpha-value>)",
				"outline-variant": "rgb(var(--m3-scheme-outline-variant) / <alpha-value>)",
				"shadow": "rgb(var(--m3-scheme-shadow) / <alpha-value>)",
				"scrim": "rgb(var(--m3-scheme-scrim) / <alpha-value>)",
				"inverse-surface": "rgb(var(--m3-scheme-inverse-surface) / <alpha-value>)",
				"inverse-on-surface": "rgb(var(--m3-scheme-inverse-on-surface) / <alpha-value>)",
				"inverse-primary": "rgb(var(--m3-scheme-inverse-primary) / <alpha-value>)",
				"surface-bright": "rgb(var(--m3-scheme-surface-bright) / <alpha-value>)",
				"surface-container": "rgb(var(--m3-scheme-surface-container) / <alpha-value>)",
				"surface-container-high": "rgb(var(--m3-scheme-surface-container-high) / <alpha-value>)",
				"surface-container-highest": "rgb(var(--m3-scheme-surface-container-highest) / <alpha-value>)",
				"surface-container-low": "rgb(var(--m3-scheme-surface-container-low) / <alpha-value>)",
				"surface-container-lowest": "rgb(var(--m3-scheme-surface-container-lowest) / <alpha-value>)",
				"surface-dim": "rgb(var(--m3-scheme-surface-dim) / <alpha-value>)",
				"surface-tint": "rgb(var(--m3-scheme-surface-tint) / <alpha-value>)",
				"preview": "rgb(var(--m3-preview) / <alpha-value>)",
				"on-preview": "rgb(var(--m3-on-preview) / <alpha-value>)",

				border: "hsl(var(--border) / <alpha-value>)",
				input: "hsl(var(--input) / <alpha-value>)",
				ring: "hsl(var(--ring) / <alpha-value>)",
				// background: "hsl(var(--background) / <alpha-value>)",
				foreground: "hsl(var(--foreground) / <alpha-value>)",
				// primary: {
				// 	DEFAULT: "hsl(var(--primary) / <alpha-value>)",
				// 	foreground: "hsl(var(--primary-foreground) / <alpha-value>)"
				// },
				// secondary: {
				// 	DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
				// 	foreground: "hsl(var(--secondary-foreground) / <alpha-value>)"
				// },
				destructive: {
					DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
					foreground: "hsl(var(--destructive-foreground) / <alpha-value>)"
				},
				muted: {
					DEFAULT: "hsl(var(--muted) / <alpha-value>)",
					foreground: "hsl(var(--muted-foreground) / <alpha-value>)"
				},
				accent: {
					DEFAULT: "hsl(var(--accent) / <alpha-value>)",
					foreground: "hsl(var(--accent-foreground) / <alpha-value>)"
				},
				popover: {
					DEFAULT: "hsl(var(--popover) / <alpha-value>)",
					foreground: "hsl(var(--popover-foreground) / <alpha-value>)"
				},
				card: {
					DEFAULT: "hsl(var(--card) / <alpha-value>)",
					foreground: "hsl(var(--card-foreground) / <alpha-value>)"
				}
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
				"4xl": "1.75rem"
			},
			fontFamily: {
				sans: [...fontFamily.sans]
			},
			fontSize: {
				"xss": ["0.688rem", {
					lineHeight: "1rem"
				}]
			}
		}
	},
};

export default config;
