import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReceiptWiser",
  description: "Upload a receipt, edit the details, and share with friends",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
