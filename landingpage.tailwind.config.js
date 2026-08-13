/** Nachbau der Inline-Config aus index.html (frueher: cdn.tailwindcss.com). */
module.exports = {
  darkMode: "class",
  content: ["./index.html"],
  theme: {
    extend: {
      colors: {
        "primary-fixed-dim": "#eac249", "on-surface": "#e4e1ea",
        "on-secondary-container": "#b8b6d0", "primary-container": "#f2ca50",
        "inverse-primary": "#745b00", "on-tertiary-container": "#565858",
        "background": "#131319", "on-primary": "#3d2f00",
        "on-surface-variant": "#d0c5af", "surface-variant": "#35343b",
        "surface-container": "#1f1f26", "secondary-container": "#47475d",
        "outline": "#99907c", "tertiary-container": "#cecece",
        "surface-container-highest": "#35343b", "surface-bright": "#393840",
        "on-primary-container": "#6b5500", "surface": "#131319",
        "surface-container-low": "#1b1b22", "secondary": "#c6c4df",
        "surface-dim": "#131319", "error-container": "#93000a",
        "on-error-container": "#ffdad6", "on-background": "#e4e1ea",
        "primary": "#ffe9b0", "error": "#ffb4ab",
        "inverse-surface": "#e4e1ea", "surface-container-lowest": "#0e0e14",
        "inverse-on-surface": "#303037", "tertiary": "#eaeaea",
        "surface-tint": "#eac249", "primary-fixed": "#ffe08a",
        "surface-container-high": "#2a2930", "outline-variant": "#4d4635"
      },
      borderRadius: { DEFAULT: "0.125rem", lg: "0.25rem", xl: "0.5rem", full: "0.75rem" },
      fontFamily: { headline: ["Noto Serif"], body: ["Inter"], label: ["Inter"] }
    }
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/container-queries")]
};
