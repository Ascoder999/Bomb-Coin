import { Anton, Instrument_Sans } from "next/font/google";
import "./globals.css";

const display = Anton({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const body = Instrument_Sans({ subsets: ["latin"], variable: "--font-body" });

export const metadata = {
  title: "BOMB — a satirical meme coin on Solana",
  description:
    "BOMB is a satirical meme coin on Solana. One headline away from chaos. No utility, no promises, high risk.",
  openGraph: { images: ["/logo.png"] },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
