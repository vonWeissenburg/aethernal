// Design tokens for programmatic use (matching globals.css @theme)
// Full Material Design 3 palette from Stitch designs
export const colors = {
  primary: "#F2CA50",
  primaryContainer: "#D4AF37",
  onPrimary: "#3C2F00",
  onPrimaryContainer: "#554300",

  secondary: "#EAC249",
  secondaryContainer: "#B08C10",

  background: "#0B0D17",
  surface: "#11131D",
  surfaceContainerLowest: "#0C0E18",
  surfaceContainerLow: "#191B26",
  surfaceContainer: "#1D1F2A",
  surfaceContainerHigh: "#282934",
  surfaceContainerHighest: "#32343F",
  surfaceBright: "#373844",

  onSurface: "#E1E1F0",
  onSurfaceVariant: "#D0C5AF",
  onBackground: "#E1E1F0",

  error: "#FFB4AB",
  errorContainer: "#93000A",
  onError: "#690005",

  outline: "#99907C",
  outlineVariant: "#4D4635",

  success: "#4CAF7D",
  warning: "#EAC249",

  card: "#1C1F33",
  sidebar: "#0B0D17",
} as const;
