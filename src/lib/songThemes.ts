
import type { CSSProperties } from "react";

interface SongTheme {
  accent: string;
  accentHover: string;
  accentRgb: string;
  glowRgb: string;
}

const defaultTheme: SongTheme = {
  accent: "#D36F58",
  accentHover: "#E48772",
  accentRgb: "211 111 88",
  glowRgb: "96 42 34",
};

const songThemes: Record<string, SongTheme> = {
  "ich-will": {
    accent: "#D36F58",
    accentHover: "#E48772",
    accentRgb: "211 111 88",
    glowRgb: "96 42 34",
  },

  sonne: {
    accent: "#D9AF5B",
    accentHover: "#E8C577",
    accentRgb: "217 175 91",
    glowRgb: "105 79 32",
  },

  "du-hast": {
    accent: "#A4ADB5",
    accentHover: "#C3CBD1",
    accentRgb: "164 173 181",
    glowRgb: "62 75 89",
  },
};

export function getSongThemeStyles(
  slug: string
): CSSProperties {
  const theme = songThemes[slug] ?? defaultTheme;

  return {
    "--wm-accent": theme.accent,
    "--wm-accent-hover": theme.accentHover,
    "--wm-accent-rgb": theme.accentRgb,
    "--wm-glow-rgb": theme.glowRgb,
  } as CSSProperties;
}
