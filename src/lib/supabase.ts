import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl || "https://placeholder.supabase.co", supabaseAnonKey || "placeholder");

export interface Obra {
  id: string;
  user_id: string;
  nome: string;
  morada: string;
  notas: string;
  criado_em: string;
}

export interface Fatura {
  id: string;
  user_id: string;
  numero: string;
  fornecedor: string;
  data: string;
  total: number;
  imagem_path: string | null;
  criado_em: string;
}

export interface ItemFatura {
  id: string;
  user_id: string;
  fatura_id: string;
  descricao: string;
  quantidade: number;
  preco_unitario: number;
  total: number;
  obra_id: string | null;
  criado_em: string;
}

export async function getUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}
