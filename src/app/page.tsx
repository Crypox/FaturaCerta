"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

export default function Home() {
  const obras = useLiveQuery(() => db.obras.count());
  const faturas = useLiveQuery(() => db.faturas.count());
  const itensAtribuidos = useLiveQuery(() =>
    db.itensFatura.where("obraId").notEqual("").count()
  );
  const itensPendentes = useLiveQuery(() =>
    db.itensFatura.filter((i) => !i.obraId).count()
  );

  return (
    <div className="px-4 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">FaturaCerta</h1>
        <p className="text-muted text-sm mt-1">Gestao de faturas de obras</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Obras" value={obras ?? 0} color="bg-blue-500" />
        <StatCard label="Faturas" value={faturas ?? 0} color="bg-green-500" />
        <StatCard label="Itens atribuidos" value={itensAtribuidos ?? 0} color="bg-purple-500" />
        <StatCard label="Itens pendentes" value={itensPendentes ?? 0} color="bg-orange-500" />
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/faturas?scan=1"
          className="flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-4 px-6 font-semibold text-lg shadow-sm active:bg-primary-dark transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
            <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3H4.5a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM6.75 12.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Z" clipRule="evenodd" />
          </svg>
          Escanear Fatura
        </Link>

        <Link
          href="/obras"
          className="flex items-center justify-center gap-2 bg-card text-foreground border border-border rounded-xl py-4 px-6 font-semibold text-lg shadow-sm active:bg-gray-50 transition-colors"
        >
          Ver Obras
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
      <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center text-white text-sm font-bold mb-2`}>
        {value}
      </div>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
