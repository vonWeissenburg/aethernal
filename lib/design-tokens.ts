// Design tokens for programmatic use (matching globals.css @theme)
export const colors = {
  bg: {
    primary: "#0B0D17",
    secondary: "#141627",
    card: "#1C1F33",
    cardHover: "#252840",
    input: "#1C1F33",
  },
  gold: {
    DEFAULT: "#D4AF37",
    light: "#F2CA50",
    dim: "#E9C349",
    dark: "#C5A028",
    glow: "rgba(242, 202, 80, 0.15)",
  },
  text: {
    primary: "#E1E1F0",
    secondary: "#D0C5AF",
    muted: "#99907C",
    faint: "#4D4635",
  },
  surface: {
    DEFAULT: "#11131D",
    container: "#1D1F2A",
    containerLow: "#191B26",
    containerHigh: "#282934",
    containerHighest: "#32343F",
    bright: "#373844",
  },
  status: {
    success: "#4CAF7D",
    error: "#CF6679",
    errorLight: "#FFB4AB",
    warning: "#EAC249",
  },
  outline: {
    DEFAULT: "#99907C",
    variant: "#4D4635",
  },
  border: {
    card: "#2A2D45",
  },
} as const;
