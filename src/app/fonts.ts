import { Fraunces, Inter_Tight } from "next/font/google";

export const fontDisplay = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: "variable",
  axes: ["opsz"],
  preload: true,
});

export const fontSans = Inter_Tight({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: "variable",
  preload: true,
});
