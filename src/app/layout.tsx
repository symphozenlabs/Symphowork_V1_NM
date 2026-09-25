import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "SymphoWork | Workspace foundation", description: "SymphoWork enterprise people operations platform foundation" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
