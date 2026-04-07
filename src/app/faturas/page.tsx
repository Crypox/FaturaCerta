"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { v4 as uuid } from "uuid";
import { db, type ItemFatura } from "@/lib/db";

export default function FaturasPage() {
  return (
    <Suspense fallback={<p className="text-center py-8 text-muted">A carregar...</p>}>
      <FaturasContent />
    </Suspense>
  );
}

function FaturasContent() {
  const searchParams = useSearchParams();
  const faturas = useLiveQuery(() => db.faturas.orderBy("criadoEm").reverse().toArray());
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchParams.get("scan") === "1") {
      setScanning(true);
    }
  }, [searchParams]);

  async function handleFile(file: File) {
    setProcessing(true);
    setError("");

    try {
      const base64 = await fileToBase64(file);
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileData: base64,
          fileType: file.type,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao processar fatura");
      }

      const data = await res.json();
      const faturaId = uuid();

      await db.faturas.add({
        id: faturaId,
        numero: data.invoiceNumber || "S/N",
        fornecedor: data.vendor || "Desconhecido",
        data: data.date || new Date().toISOString().slice(0, 10),
        total: data.total || 0,
        imagemBase64: base64,
        criadoEm: new Date().toISOString(),
      });

      const itens: ItemFatura[] = (data.lineItems || []).map(
        (item: { description: string; quantity: number; unitPrice: number; total: number }) => ({
          id: uuid(),
          faturaId,
          descricao: item.description || "Item",
          quantidade: item.quantity || 1,
          precoUnitario: item.unitPrice || 0,
          total: item.total || 0,
          obraId: null,
          criadoEm: new Date().toISOString(),
        })
      );

      if (itens.length > 0) {
        await db.itensFatura.bulkAdd(itens);
      }

      setScanning(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setProcessing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Faturas</h1>
        <button
          onClick={() => setScanning(!scanning)}
          className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium active:bg-primary-dark transition-colors"
        >
          {scanning ? "Cancelar" : "+ Escanear"}
        </button>
      </div>

      {scanning && (
        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          {processing ? (
            <div className="text-center py-6">
              <div className="inline-block w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-muted">A processar fatura...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-center text-muted">Escolha como adicionar a fatura</p>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col items-center gap-2 bg-blue-50 border-2 border-dashed border-blue-200 rounded-xl p-4 cursor-pointer active:bg-blue-100 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-primary">
                    <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
                    <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3H4.5a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM6.75 12.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-primary">Tirar Foto</span>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <label className="flex flex-col items-center gap-2 bg-green-50 border-2 border-dashed border-green-200 rounded-xl p-4 cursor-pointer active:bg-green-100 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-green-600">
                    <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 0 1 3.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 0 1 3.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 0 1-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875Zm5.845 17.03a.75.75 0 0 0 1.06 0l3-3a.75.75 0 1 0-1.06-1.06l-1.72 1.72V12a.75.75 0 0 0-1.5 0v4.19l-1.72-1.72a.75.75 0 0 0-1.06 1.06l3 3Z" clipRule="evenodd" />
                    <path d="M14.25 5.25a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963A5.23 5.23 0 0 0 16.5 7.5h-1.875a.375.375 0 0 1-.375-.375V5.25Z" />
                  </svg>
                  <span className="text-sm font-medium text-green-700">Ficheiro / Foto</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
          {error && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}
        </div>
      )}

      {faturas === undefined ? (
        <p className="text-muted text-center py-8">A carregar...</p>
      ) : faturas.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted mb-2">Nenhuma fatura adicionada</p>
          <p className="text-sm text-muted">Clique em &quot;+ Escanear&quot; para comecar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {faturas.map((f) => (
            <Link
              key={f.id}
              href={`/faturas/${f.id}`}
              className="block bg-card border border-border rounded-xl p-4 active:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{f.fornecedor}</p>
                  <p className="text-sm text-muted">Fatura: {f.numero}</p>
                  <p className="text-xs text-muted mt-0.5">{f.data}</p>
                </div>
                <p className="font-semibold">{f.total.toFixed(2)} &euro;</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
