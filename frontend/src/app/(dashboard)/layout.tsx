import React from 'react';
import { Navbar } from '../../components/navigation/navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 pb-16">{children}</main>
      <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500">
        <div className="container mx-auto px-4">
          <p className="font-medium text-slate-700">
            Uni-Espacios — Politécnico Jaime Isaza Cadavid © {new Date().getFullYear()}
          </p>
          <p className="mt-1 text-slate-400 text-[11px]">
            Sistema Integral de Gestión de Espacios Físicos, Reservas y Custodia de Inventarios Pedagógicos y Deportivos
          </p>
        </div>
      </footer>
    </div>
  );
}
