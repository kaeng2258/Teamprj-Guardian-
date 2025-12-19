// app/layout.tsx
import "@mantine/core/styles.css";
import "./globals.css";
import React from "react";
import { MantineProvider, ColorSchemeScript } from "@mantine/core";
import AuthHydrator from "../components/AuthHydrator";
import { theme } from "../theme";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guardian Front",
  description: "Chat & e약은요",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <AuthHydrator />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
