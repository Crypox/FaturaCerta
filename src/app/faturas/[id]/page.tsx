"use client";

import { use } from "react";
import Link from "next/link";
import {
  useFatura,
  useItensByFatura,
  useObras,
  updateItemObra,
  assignAllPendingToObra,
  deleteFatura,
  getImageUrl,
} from "@/hooks/useSupabase";

export default function FaturaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { fatura } = useFatura(id);
  const { itens, refetch: refetchItens } = useItensByFatura(id);
  const { obras } = useObras();

  async function assignObra(itemId: string, obraId: string) {
    await updateItemObra(itemId, obraId || null);
    refetchItens();
  }

  async function assignAllToObra(obraId: string) {
    if (!obraId) return;
    await assignAllPendingToObra(id, obraId);
    refetchItens();
  }

  async function handleDeleteFatura() {
    if (!confirm("Apagar esta fatura e todos os seus itens?")) return;
    await deleteFatura(id, fatura?.imagem_path);
    window.location.href = "/faturas";
  }

  if (fatura === undefined) return <p className="text-center py-8 text-muted">A carregar...</p>;
  if (!fatura) return <p className="text-center py-8 text-muted">Fatura nao encontrada</p>;

  const pendentes = itens?.filter((i) => !i.obra_id).length ?? 0;
  const imageUrl = fatura.imagem_path ? getImageUrl(fatura.imagem_path) : null;

  return (
    <div className="px-4 pt-6">
      <Link href="/faturas" className="text-primary text-sm font-medium mb-3 inline-block">
        &larr; Voltar
      </Link>

      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-lg font-bold">{fatura.fornecedor}</h1>
            <p className="text-sm text-muted">Fatura: {fatura.numero}</p>
            <p className="text-sm text-muted">{fatura.data}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{fatura.total.toFixed(2)} &euro;</p>
            <button onClick={handleDeleteFatura} className="text-danger text-xs mt-1">
              Apagar
            </button>
          </div>
        </div>
      </div>

      {pendentes > 0 && obras && obras.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4">
          <p className="text-sm font-medium text-orange-800 mb-2">
            {pendentes} {pendentes === 1 ? "item pendente" : "itens pendentes"} — atribuir todos a:
          </p>
          <select
            onChange={(e) => {
              if (e.target.value) assignAllToObra(e.target.value);
              e.target.value = "";
            }}
            defaultValue=""
            className="w-full border border-orange-300 rounded-lg px-3 py-2 bg-white text-sm"
          >
            <option value="" disabled>Escolher obra...</option>
            {obras.map((o) => (
              <option key={o.id} value={o.id}>{o.nome}</option>
            ))}
          </select>
        </div>
      )}

      <h2 className="text-sm font-semibold text-muted mb-2 uppercase tracking-wide">
        Itens ({itens?.length ?? 0})
      </h2>

      {!itens ? (
        <p className="text-center text-muted py-4">A carregar...</p>
      ) : itens.length === 0 ? (
        <p className="text-center text-muted py-8">Nenhum item extraido desta fatura</p>
      ) : (
        <div className="space-y-3">
          {itens.map((item) => {
            const obraAtribuida = obras?.find((o) => o.id === item.obra_id);
            return (
              <div key={item.id} className="bg-card border border-border rounded-xl p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.descricao}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {item.quantidade} x {item.preco_unitario.toFixed(2)} &euro;
                    </p>
                  </div>
                  <p className="font-semibold text-sm ml-2">{item.total.toFixed(2)} &euro;</p>
                </div>

                <div className="flex items-center gap-2">
                  {obraAtribuida ? (
                    <div className="flex items-center justify-between w-full bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                      <span className="text-xs text-green-800 font-medium">
                        {obraAtribuida.nome}
                      </span>
                      <button
                        onClick={() => assignObra(item.id, "")}
                        className="text-xs text-muted ml-2"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <select
                      onChange={(e) => assignObra(item.id, e.target.value)}
                      defaultValue=""
                      className="w-full border border-border rounded-lg px-3 py-1.5 text-sm bg-white"
                    >
                      <option value="" disabled>Atribuir a obra...</option>
                      {obras?.map((o) => (
                        <option key={o.id} value={o.id}>{o.nome}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {imageUrl && (
        <details className="mt-6">
          <summary className="text-sm text-primary font-medium cursor-pointer">
            Ver imagem da fatura
          </summary>
          <img
            src={imageUrl}
            alt="Fatura"
            className="mt-2 w-full rounded-xl border border-border"
          />
        </details>
      )}
    </div>
  );
}
