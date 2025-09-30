import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MÃE NA LINHA - Organização Familiar",
  description: "Aplicativo completo para organização familiar com lista de compras, tarefas, agenda e controle de despesas",
  keywords: "organização familiar, lista de compras, tarefas domésticas, agenda familiar, controle de gastos",
  authors: [{ name: "MÃE NA LINHA" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}