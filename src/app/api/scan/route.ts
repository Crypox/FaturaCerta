import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const clientId = process.env.VERYFI_CLIENT_ID || "";
    const apiKey = process.env.VERYFI_API_KEY || "";
    const username = process.env.VERYFI_USERNAME || "";

    if (!clientId || !apiKey || !username) {
      return NextResponse.json(
        {
          error: "Veryfi API nao configurada.",
          debug: {
            hasClientId: !!clientId,
            hasApiKey: !!apiKey,
            hasUsername: !!username,
          },
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { fileName, fileData } = body;

    if (!fileData) {
      return NextResponse.json({ error: "Ficheiro em falta" }, { status: 400 });
    }

    const veryfiResponse = await fetch(
      "https://api.veryfi.com/api/v8/partner/documents",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CLIENT-ID": clientId,
          AUTHORIZATION: `apikey ${username}:${apiKey}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          file_data: fileData,
          file_name: fileName || "fatura.jpg",
          categories: ["Construction", "Materials"],
          auto_delete: true,
        }),
      }
    );

    if (!veryfiResponse.ok) {
      const errText = await veryfiResponse.text();
      return NextResponse.json(
        { error: `Erro Veryfi (${veryfiResponse.status}): ${errText}` },
        { status: 502 }
      );
    }

    const doc = await veryfiResponse.json();

    const result = {
      invoiceNumber: doc.invoice_number || doc.reference_number || "",
      vendor: doc.vendor?.name || "",
      date: doc.date ? doc.date.slice(0, 10) : "",
      total: doc.total || 0,
      tax: doc.tax || 0,
      subtotal: doc.subtotal || 0,
      lineItems: (doc.line_items || []).map(
        (item: {
          description?: string;
          quantity?: number;
          price?: number;
          total?: number;
        }) => ({
          description: item.description || "Item",
          quantity: item.quantity || 1,
          unitPrice: item.price || 0,
          total: item.total || 0,
        })
      ),
    };

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Erro interno: ${message}` },
      { status: 500 }
    );
  }
}
