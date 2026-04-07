import { NextRequest, NextResponse } from "next/server";

const VERYFI_CLIENT_ID = process.env.VERYFI_CLIENT_ID || "";
const VERYFI_API_KEY = process.env.VERYFI_API_KEY || "";
const VERYFI_USERNAME = process.env.VERYFI_USERNAME || "";

export async function POST(req: NextRequest) {
  try {
    if (!VERYFI_CLIENT_ID || !VERYFI_API_KEY || !VERYFI_USERNAME) {
      return NextResponse.json(
        { error: "Veryfi API nao configurada. Defina VERYFI_CLIENT_ID, VERYFI_USERNAME e VERYFI_API_KEY." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { fileName, fileData, fileType } = body;

    if (!fileData) {
      return NextResponse.json({ error: "Ficheiro em falta" }, { status: 400 });
    }

    const veryfiResponse = await fetch(
      "https://api.veryfi.com/api/v8/partner/documents",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CLIENT-ID": VERYFI_CLIENT_ID,
          AUTHORIZATION: `apikey ${VERYFI_USERNAME}:${VERYFI_API_KEY}`,
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
      console.error("Veryfi error:", veryfiResponse.status, errText);
      return NextResponse.json(
        { error: `Erro Veryfi: ${veryfiResponse.status}` },
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
    console.error("Scan error:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar fatura" },
      { status: 500 }
    );
  }
}
