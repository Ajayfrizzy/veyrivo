import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { RouteTitle } from "@/components/layout/route-title";

export const metadata: Metadata = {
  title: { default: "Veyrivo", template: "%s | Veyrivo" },
  description:
    "Veyrivo is a trusted work marketplace where clients discover talent, professionals find opportunities, and both sides structure milestone-based work with verifiable delivery and protected payments.",
  applicationName: "Veyrivo",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4F46E5",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <RouteTitle />
        {children}
      </body>
    </html>
  );
}
