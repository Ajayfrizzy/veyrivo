import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { RouteTitle } from "@/components/layout/route-title";

export const metadata: Metadata = {
  title: { default: "Veyrivo", template: "%s | Veyrivo" },
  description: "Protected milestone payments on Nervos CKB",
  applicationName: "Veyrivo",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
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
