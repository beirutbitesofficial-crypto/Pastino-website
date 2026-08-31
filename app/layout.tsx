import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pastino | Fresh Pasta",
  description: "Build your Pastino pasta online and order for delivery or takeaway.",
};

export const viewport: Viewport = { themeColor: "#921414" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
