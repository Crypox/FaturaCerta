import Dexie, { type EntityTable } from 'dexie';

export interface Obra {
  id: string;
  nome: string;
  morada: string;
  notas: string;
  criadoEm: string;
}

export interface Fatura {
  id: string;
  numero: string;
  fornecedor: string;
  data: string;
  total: number;
  imagemBase64?: string;
  criadoEm: string;
}

export interface ItemFatura {
  id: string;
  faturaId: string;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  total: number;
  obraId: string | null;
  criadoEm: string;
}

class FaturaCertaDB extends Dexie {
  obras!: EntityTable<Obra, 'id'>;
  faturas!: EntityTable<Fatura, 'id'>;
  itensFatura!: EntityTable<ItemFatura, 'id'>;

  constructor() {
    super('FaturaCertaDB');
    this.version(1).stores({
      obras: 'id, nome, criadoEm',
      faturas: 'id, numero, fornecedor, data, criadoEm',
      itensFatura: 'id, faturaId, obraId, criadoEm',
    });
  }
}

export const db = new FaturaCertaDB();
