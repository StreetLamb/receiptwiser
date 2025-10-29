import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Receipt } from "@/types";
import { v4 as uuidv4 } from "uuid";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export async function POST(request: NextRequest) {
  try {
    const receipt: Receipt = await request.json();

    // Create receipt with items in a transaction
    const createdReceipt = await prisma.receipt.create({
      data: {
        id: uuidv4(),
        creatorName: receipt.creatorName || null,
        creatorPhone: receipt.creatorPhone || null,
        subtotal: receipt.subtotal,
        taxPercent: receipt.taxPercent,
        taxAmount: receipt.taxAmount,
        serviceChargePercent: receipt.serviceChargePercent,
        serviceChargeAmount: receipt.serviceChargeAmount,
        total: receipt.total,
        imageUrl: receipt.imageUrl || null,
        items: {
          create: receipt.items.map((item, index) => ({
            id: uuidv4(),
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            orderIndex: index,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(
      { id: createdReceipt.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating receipt:", error);
    return NextResponse.json(
      { error: "Failed to create receipt" },
      { status: 500 }
    );
  }
}
