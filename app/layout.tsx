import type { Metadata } from "next";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import "@fontsource/dm-serif-display/latin-400.css";
import "./globals.css";
export const metadata:Metadata={title:{default:"AKIMS · Campus",template:"%s · AKIMS"},description:"The connected campus of Akbar Institute of Medical Sciences."};
export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>;
}
