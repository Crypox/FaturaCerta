"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, getUserId, type Obra, type Fatura, type ItemFatura } from "@/lib/supabase";

// ---- Dashboard ----

export function useDashboardCounts() {
  const [obras, setObras] = useState<number | undefined>(undefined);
  const [faturas, setFaturas] = useState<number | undefined>(undefined);
  const [itensAtribuidos, setItensAtribuidos] = useState<number | undefined>(undefined);
  const [itensPendentes, setItensPendentes] = useState<number | undefined>(undefined);

  const refetch = useCallback(async () => {
    const [o, f, a, p] = await Promise.all([
      supabase.from("obras").select("*", { count: "exact", head: true }),
      supabase.from("faturas").select("*", { count: "exact", head: true }),
      supabase.from("itens_fatura").select("*", { count: "exact", head: true }).not("obra_id", "is", null),
      supabase.from("itens_fatura").select("*", { count: "exact", head: true }).is("obra_id", null),
    ]);
    setObras(o.count ?? 0);
    setFaturas(f.count ?? 0);
    setItensAtribuidos(a.count ?? 0);
    setItensPendentes(p.count ?? 0);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { obras, faturas, itensAtribuidos, itensPendentes, refetch };
}

// ---- Obras ----

export function useObras() {
  const [obras, setObras] = useState<Obra[] | undefined>(undefined);

  const refetch = useCallback(async () => {
    const { data } = await supabase
      .from("obras")
      .select("*")
      .order("criado_em", { ascending: false });
    setObras(data ?? []);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { obras, refetch };
}

export function useObra(id: string) {
  const [obra, setObra] = useState<Obra | null | undefined>(undefined);

  const refetch = useCallback(async () => {
    const { data } = await supabase
      .from("obras")
      .select("*")
      .eq("id", id)
      .single();
    setObra(data);
  }, [id]);

  useEffect(() => { refetch(); }, [refetch]);

  return { obra, refetch };
}

export async function addObra(obra: { nome: string; morada: string; notas: string }) {
  const userId = await getUserId();
  const { error } = await supabase.from("obras").insert({
    user_id: userId,
    nome: obra.nome,
    morada: obra.morada,
    notas: obra.notas,
  });
  if (error) throw error;
}

export async function deleteObra(id: string) {
  await supabase.from("itens_fatura").update({ obra_id: null }).eq("obra_id", id);
  const { error } = await supabase.from("obras").delete().eq("id", id);
  if (error) throw error;
}

// ---- Faturas ----

export function useFaturas() {
  const [faturas, setFaturas] = useState<Fatura[] | undefined>(undefined);

  const refetch = useCallback(async () => {
    const { data } = await supabase
      .from("faturas")
      .select("*")
      .order("criado_em", { ascending: false });
    setFaturas(data ?? []);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { faturas, refetch };
}

export function useFatura(id: string) {
  const [fatura, setFatura] = useState<Fatura | null | undefined>(undefined);

  const refetch = useCallback(async () => {
    const { data } = await supabase
      .from("faturas")
      .select("*")
      .eq("id", id)
      .single();
    setFatura(data);
  }, [id]);

  useEffect(() => { refetch(); }, [refetch]);

  return { fatura, refetch };
}

export async function addFaturaWithItems(
  fatura: { numero: string; fornecedor: string; data: string; total: number },
  items: { description: string; quantity: number; unitPrice: number; total: number }[],
  imageBlob?: Blob
): Promise<string> {
  const userId = await getUserId();

  // Insert fatura
  const { data: faturaRow, error: faturaError } = await supabase
    .from("faturas")
    .insert({
      user_id: userId,
      numero: fatura.numero,
      fornecedor: fatura.fornecedor,
      data: fatura.data,
      total: fatura.total,
    })
    .select("id")
    .single();

  if (faturaError || !faturaRow) throw faturaError || new Error("Failed to create fatura");

  const faturaId = faturaRow.id;

  // Upload image to Storage
  if (imageBlob) {
    const path = `${userId}/${faturaId}.jpg`;
    await supabase.storage.from("faturas").upload(path, imageBlob, {
      contentType: "image/jpeg",
      upsert: true,
    });
    await supabase.from("faturas").update({ imagem_path: path }).eq("id", faturaId);
  }

  // Insert items
  if (items.length > 0) {
    const rows = items.map((item) => ({
      user_id: userId,
      fatura_id: faturaId,
      descricao: item.description || "Item",
      quantidade: item.quantity || 1,
      preco_unitario: item.unitPrice || 0,
      total: item.total || 0,
    }));
    const { error: itemsError } = await supabase.from("itens_fatura").insert(rows);
    if (itemsError) throw itemsError;
  }

  return faturaId;
}

export async function deleteFatura(id: string, imagemPath?: string | null) {
  // Delete image from Storage
  if (imagemPath) {
    await supabase.storage.from("faturas").remove([imagemPath]);
  }
  // Items are cascade-deleted by the database
  const { error } = await supabase.from("faturas").delete().eq("id", id);
  if (error) throw error;
}

// ---- Itens ----

export function useItensByObra(obraId: string) {
  const [itens, setItens] = useState<ItemFatura[] | undefined>(undefined);

  const refetch = useCallback(async () => {
    const { data } = await supabase
      .from("itens_fatura")
      .select("*")
      .eq("obra_id", obraId);
    setItens(data ?? []);
  }, [obraId]);

  useEffect(() => { refetch(); }, [refetch]);

  return { itens, refetch };
}

export function useItensByFatura(faturaId: string) {
  const [itens, setItens] = useState<ItemFatura[] | undefined>(undefined);

  const refetch = useCallback(async () => {
    const { data } = await supabase
      .from("itens_fatura")
      .select("*")
      .eq("fatura_id", faturaId);
    setItens(data ?? []);
  }, [faturaId]);

  useEffect(() => { refetch(); }, [refetch]);

  return { itens, refetch };
}

export function useFaturasByIds(ids: string[]) {
  const [faturas, setFaturas] = useState<Fatura[] | undefined>(undefined);
  const key = ids.join(",");

  const refetch = useCallback(async () => {
    if (ids.length === 0) {
      setFaturas([]);
      return;
    }
    const { data } = await supabase
      .from("faturas")
      .select("*")
      .in("id", ids);
    setFaturas(data ?? []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => { refetch(); }, [refetch]);

  return { faturas, refetch };
}

export async function updateItemObra(itemId: string, obraId: string | null) {
  const { error } = await supabase
    .from("itens_fatura")
    .update({ obra_id: obraId || null })
    .eq("id", itemId);
  if (error) throw error;
}

export async function assignAllPendingToObra(faturaId: string, obraId: string) {
  const { error } = await supabase
    .from("itens_fatura")
    .update({ obra_id: obraId })
    .eq("fatura_id", faturaId)
    .is("obra_id", null);
  if (error) throw error;
}

// ---- Image URL helper ----

export function getImageUrl(imagemPath: string): string {
  const { data } = supabase.storage.from("faturas").getPublicUrl(imagemPath);
  return data.publicUrl;
}
