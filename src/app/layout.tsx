import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "任務看板",
  description: "MUJI 風格任務管理看板",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body>
        {children}
      </body>
    </html>
  );
}
