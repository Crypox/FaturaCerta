"use client";

import { use } from "react";
import Link from "next/link";
import { useObra, useItensByObra, useFaturasByIds } from "@/hooks/useSupabase";

export default function ObraDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { obra } = useObra(id);
  const { itens } = useItensByObra(id);
  const faturaIds = [...new Set(itens?.map((i) => i.fatura_id) ?? [])];
  const { faturas } = useFaturasByIds(faturaIds);

  function exportCSV() {
    if (!itens || !obra) return;
    const faturaMap = new Map(faturas?.map((f) => [f.id, f]) ?? []);
    const header = "Descricao;Quantidade;Preco Unitario;Total;Fatura;Fornecedor;Data\n";
    const rows = itens.map((item) => {
      const f = faturaMap.get(item.fatura_id);
      return [
        item.descricao,
        item.quantidade,
        item.preco_unitario.toFixed(2),
        item.total.toFixed(2),
        f?.numero ?? "",
        f?.fornecedor ?? "",
        f?.data ?? "",
      ].join(";");
    });
    const csv = header + rows.join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${obra.nome.replace(/\s+/g, "_")}_itens.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (obra === undefined) return <p className="text-center py-8 text-muted">A carregar...</p>;
  if (!obra) return <p className="text-center py-8 text-muted">Obra nao encontrada</p>;

  const totalObra = itens?.reduce((sum, i) => sum + i.total, 0) ?? 0;

  return (
    <div className="px-4 pt-6">
      <Link href="/obras" className="text-primary text-sm font-medium mb-3 inline-block">
        &larr; Voltar
      </Link>

      <div className="mb-4">
        <h1 className="text-xl font-bold">{obra.nome}</h1>
        {obra.morada && <p className="text-sm text-muted mt-0.5">{obra.morada}</p>}
        {obra.notas && <p className="text-sm text-muted mt-1">{obra.notas}</p>}
      </div>

      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted">Total da obra</p>
            <p className="text-2xl font-bold">{totalObra.toFixed(2)} &euro;</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted">{itens?.length ?? 0} itens</p>
            <p className="text-sm text-muted">{faturaIds.length} faturas</p>
          </div>
        </div>
      </div>

      {itens && itens.length > 0 && (
        <button
          onClick={exportCSV}
          className="w-full mb-4 bg-success text-white rounded-xl py-3 font-medium active:opacity-80 transition-opacity"
        >
          Exportar CSV
        </button>
      )}

      {itens === undefined ? (
        <p className="text-center text-muted py-4">A carregar itens...</p>
      ) : itens.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted">Nenhum item atribuido a esta obra</p>
          <Link href="/faturas" className="text-primary text-sm font-medium mt-2 inline-block">
            Ir para Faturas
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {itens.map((item) => {
            const fatura = faturas?.find((f) => f.id === item.fatura_id);
            return (
              <div key={item.id} className="bg-card border border-border rounded-xl p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.descricao}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {item.quantidade} x {item.preco_unitario.toFixed(2)} &euro;
                    </p>
                    {fatura && (
                      <p className="text-xs text-muted mt-0.5">
                        Fatura: {fatura.numero} ({fatura.fornecedor})
                      </p>
                    )}
                  </div>
                  <p className="font-semibold text-sm ml-2">{item.total.toFixed(2)} &euro;</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
