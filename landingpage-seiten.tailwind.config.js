/** Konfiguration der Unterseiten (agb, datenschutz, impressum, partner-apply).
 *
 * BEWUSST GETRENNT von landingpage.tailwind.config.js: Die Startseite
 * ueberschreibt borderRadius (full = 0.75rem statt 9999px). Die Unterseiten tun
 * das nicht. Ein gemeinsames Stylesheet wuerde dort jede Pille und jeden runden
 * Knopf veraendern. Nachbau der frueheren Inline-Konfigs dieser Seiten.
 */
module.exports = {
  darkMode: "class",
  content: ["./agb.html", "./datenschutz.html", "./impressum.html", "./partner-apply.html"],
  theme: {
    extend: {
      colors: {
        "primary-fixed-dim": "#eac249",
        "on-surface": "#e4e1ea",
        "primary-container": "#f2ca50",
        "background": "#131319",
        "on-primary": "#3d2f00",
        "on-surface-variant": "#d0c5af",
        "surface-container": "#1f1f26",
        "surface-container-low": "#1b1b22",
        "outline": "#99907c",
        "surface-container-lowest": "#0e0e14",
        "surface-container-high": "#2a2930",
        "outline-variant": "#4d4635",
        "primary": "#ffe9b0",
        "surface": "#131319"
      },
      fontFamily: { headline: ["Noto Serif"], body: ["Inter"], label: ["Inter"] }
    }
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/container-queries")]
};
