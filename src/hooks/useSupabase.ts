"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, getUserId, type Obra, type Fatura, type ItemFatura, type Atribuicao } from "@/lib/supabase";

// ---- Dashboard ----

export function useDashboardCounts() {
  const [obras, setObras] = useState<number | undefined>(undefined);
  const [faturas, setFaturas] = useState<number | undefined>(undefined);
  const [itensAtribuidos, setItensAtribuidos] = useState<number | undefined>(undefined);
  const [itensPendentes, setItensPendentes] = useState<number | undefined>(undefined);

  const refetch = useCallback(async () => {
    const [o, f, items, atribs] = await Promise.all([
      supabase.from("obras").select("*", { count: "exact", head: true }),
      supabase.from("faturas").select("*", { count: "exact", head: true }),
      supabase.from("itens_fatura").select("id, quantidade"),
      supabase.from("atribuicoes").select("item_fatura_id, quantidade"),
    ]);

    setObras(o.count ?? 0);
    setFaturas(f.count ?? 0);

    const assignedMap = new Map<string, number>();
    for (const a of atribs.data ?? []) {
      assignedMap.set(a.item_fatura_id, (assignedMap.get(a.item_fatura_id) || 0) + Number(a.quantidade));
    }

    let fullyAssigned = 0;
    let pending = 0;
    for (const item of items.data ?? []) {
      const assigned = assignedMap.get(item.id) || 0;
      if (assigned >= Number(item.quantidade)) fullyAssigned++;
      else pending++;
    }
    setItensAtribuidos(fullyAssigned);
    setItensPendentes(pending);
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
  // atribuicoes are cascade-deleted
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

  if (imageBlob) {
    const path = `${userId}/${faturaId}.jpg`;
    await supabase.storage.from("faturas").upload(path, imageBlob, {
      contentType: "image/jpeg",
      upsert: true,
    });
    await supabase.from("faturas").update({ imagem_path: path }).eq("id", faturaId);
  }

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
  if (imagemPath) {
    await supabase.storage.from("faturas").remove([imagemPath]);
  }
  // itens_fatura cascade-deleted, atribuicoes cascade from itens
  const { error } = await supabase.from("faturas").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteItem(itemId: string) {
  // atribuicoes cascade-deleted
  const { error } = await supabase.from("itens_fatura").delete().eq("id", itemId);
  if (error) throw error;
}

// ---- Itens by fatura ----

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

// ---- Atribuicoes ----

export type AtribuicaoComObra = Atribuicao & { obra_nome: string };

export function useAtribuicoesByFatura(faturaId: string) {
  const [atribuicoes, setAtribuicoes] = useState<AtribuicaoComObra[] | undefined>(undefined);

  const refetch = useCallback(async () => {
    const { data: items } = await supabase
      .from("itens_fatura")
      .select("id")
      .eq("fatura_id", faturaId);
    if (!items || items.length === 0) { setAtribuicoes([]); return; }

    const itemIds = items.map((i) => i.id);
    const { data } = await supabase
      .from("atribuicoes")
      .select("*, obras(nome)")
      .in("item_fatura_id", itemIds);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (data ?? []).map((a: any) => ({
      ...a,
      obra_nome: a.obras?.nome ?? "?",
      obras: undefined,
    }));
    setAtribuicoes(result);
  }, [faturaId]);

  useEffect(() => { refetch(); }, [refetch]);

  return { atribuicoes, refetch };
}

export async function addAtribuicao(itemFaturaId: string, obraId: string, quantidade: number) {
  const userId = await getUserId();
  const { error } = await supabase.from("atribuicoes").insert({
    user_id: userId,
    item_fatura_id: itemFaturaId,
    obra_id: obraId,
    quantidade,
  });
  if (error) throw error;
}

export async function removeAtribuicao(atribuicaoId: string) {
  const { error } = await supabase.from("atribuicoes").delete().eq("id", atribuicaoId);
  if (error) throw error;
}

export async function assignAllPendingToObra(faturaId: string, obraId: string) {
  const userId = await getUserId();

  const { data: items } = await supabase
    .from("itens_fatura")
    .select("id, quantidade")
    .eq("fatura_id", faturaId);
  if (!items || items.length === 0) return;

  const itemIds = items.map((i) => i.id);
  const { data: existing } = await supabase
    .from("atribuicoes")
    .select("item_fatura_id, quantidade")
    .in("item_fatura_id", itemIds);

  const assignedMap = new Map<string, number>();
  for (const a of existing ?? []) {
    assignedMap.set(a.item_fatura_id, (assignedMap.get(a.item_fatura_id) || 0) + Number(a.quantidade));
  }

  const newRows = items
    .map((item) => {
      const assigned = assignedMap.get(item.id) || 0;
      const remaining = Number(item.quantidade) - assigned;
      if (remaining <= 0) return null;
      return {
        user_id: userId,
        item_fatura_id: item.id,
        obra_id: obraId,
        quantidade: remaining,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (newRows.length > 0) {
    const { error } = await supabase.from("atribuicoes").insert(newRows);
    if (error) throw error;
  }
}

// ---- Itens by obra (with atribuicao info) ----

export type ItemComAtribuicao = ItemFatura & { quantidade_atribuida: number; atribuicao_id: string };

export function useItensByObra(obraId: string) {
  const [itens, setItens] = useState<ItemComAtribuicao[] | undefined>(undefined);

  const refetch = useCallback(async () => {
    const { data } = await supabase
      .from("atribuicoes")
      .select("id, quantidade, item_fatura_id, itens_fatura(*)")
      .eq("obra_id", obraId);

    if (!data) { setItens([]); return; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: ItemComAtribuicao[] = data.map((a: any) => ({
      ...a.itens_fatura,
      quantidade_atribuida: Number(a.quantidade),
      atribuicao_id: a.id,
    }));
    setItens(result);
  }, [obraId]);

  useEffect(() => { refetch(); }, [refetch]);

  return { itens, refetch };
}

export function useFaturasByIds(ids: string[]) {
  const [faturas, setFaturas] = useState<Fatura[] | undefined>(undefined);
  const key = ids.join(",");

  const refetch = useCallback(async () => {
    if (ids.length === 0) { setFaturas([]); return; }
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

// ---- Fatura assignment status ----

export type FaturaStatus = { faturaId: string; total: number; pending: number };

export function useFaturasStatus() {
  const [statuses, setStatuses] = useState<FaturaStatus[]>([]);

  const refetch = useCallback(async () => {
    const { data: items } = await supabase
      .from("itens_fatura")
      .select("id, fatura_id, quantidade");
    if (!items) return;

    const { data: atribs } = await supabase
      .from("atribuicoes")
      .select("item_fatura_id, quantidade");

    const assignedMap = new Map<string, number>();
    for (const a of atribs ?? []) {
      assignedMap.set(a.item_fatura_id, (assignedMap.get(a.item_fatura_id) || 0) + Number(a.quantidade));
    }

    const map = new Map<string, { total: number; pending: number }>();
    for (const item of items) {
      const s = map.get(item.fatura_id) || { total: 0, pending: 0 };
      s.total++;
      const assigned = assignedMap.get(item.id) || 0;
      if (assigned < Number(item.quantidade)) s.pending++;
      map.set(item.fatura_id, s);
    }
    setStatuses(Array.from(map, ([faturaId, s]) => ({ faturaId, ...s })));
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { statuses, refetch };
}

// ---- Obra totals ----

export function useObrasTotals() {
  const [totals, setTotals] = useState<Map<string, number>>(new Map());

  const refetch = useCallback(async () => {
    const { data } = await supabase
      .from("atribuicoes")
      .select("obra_id, quantidade, itens_fatura(preco_unitario)");

    if (!data) return;
    const map = new Map<string, number>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const a of data as any[]) {
      const total = Number(a.quantidade) * (Number(a.itens_fatura?.preco_unitario) || 0);
      map.set(a.obra_id, (map.get(a.obra_id) || 0) + total);
    }
    setTotals(map);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { totals, refetch };
}

// ---- Image URL helper ----

export async function getSignedImageUrl(imagemPath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("faturas")
    .createSignedUrl(imagemPath, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}
