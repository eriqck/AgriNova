import { Space_Grotesk, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading"
});

const bodyFont = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body"
});

export const metadata = {
  title: "AgriNova",
  description: "Smart agriculture platform for farmers, buyers, and logistics."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${headingFont.variable} ${bodyFont.variable}`}>{children}</body>
    </html>
  );
}
