"use client";

import { useState } from "react";
import Link from "next/link";
import { useObras, addObra, deleteObra } from "@/hooks/useSupabase";

export default function ObrasPage() {
  const { obras, refetch } = useObras();
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState("");
  const [morada, setMorada] = useState("");
  const [notas, setNotas] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    await addObra({
      nome: nome.trim(),
      morada: morada.trim(),
      notas: notas.trim(),
    });
    setNome("");
    setMorada("");
    setNotas("");
    setShowForm(false);
    refetch();
  }

  async function handleDelete(id: string) {
    if (!confirm("Apagar esta obra?")) return;
    await deleteObra(id);
    refetch();
  }

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Obras</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium active:bg-primary-dark transition-colors"
        >
          {showForm ? "Cancelar" : "+ Nova Obra"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-muted mb-1">Nome *</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Moradia Sr. Silva"
              className="w-full border border-border rounded-lg px-3 py-2.5 bg-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-1">Morada</label>
            <input
              type="text"
              value={morada}
              onChange={(e) => setMorada(e.target.value)}
              placeholder="Ex: Rua das Flores, 123, Lisboa"
              className="w-full border border-border rounded-lg px-3 py-2.5 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-1">Notas</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas adicionais..."
              rows={2}
              className="w-full border border-border rounded-lg px-3 py-2.5 bg-white resize-none"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-white rounded-lg py-2.5 font-medium active:bg-primary-dark transition-colors"
          >
            Criar Obra
          </button>
        </form>
      )}

      {obras === undefined ? (
        <p className="text-muted text-center py-8">A carregar...</p>
      ) : obras.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted mb-2">Nenhuma obra criada</p>
          <p className="text-sm text-muted">Clique em &quot;+ Nova Obra&quot; para comecar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {obras.map((obra) => (
            <div key={obra.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between">
                <Link href={`/obras/${obra.id}`} className="flex-1">
                  <h3 className="font-semibold text-foreground">{obra.nome}</h3>
                  {obra.morada && (
                    <p className="text-sm text-muted mt-0.5">{obra.morada}</p>
                  )}
                </Link>
                <button
                  onClick={() => handleDelete(obra.id)}
                  className="text-danger text-sm ml-2 p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.519.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 1 .7.8l-.5 6a.75.75 0 0 1-1.499-.126l.5-6a.75.75 0 0 1 .8-.7Zm3.34.8a.75.75 0 0 0-1.5-.126l-.5 6a.75.75 0 1 0 1.5.126l.5-6Z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
