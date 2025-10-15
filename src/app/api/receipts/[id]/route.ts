import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: {
            orderIndex: "asc",
          },
        },
        payments: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!receipt) {
      return NextResponse.json(
        { error: "Receipt not found" },
        { status: 404 }
      );
    }

    // Convert Prisma Decimal to number for JSON serialization
    const formattedReceipt = {
      items: receipt.items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
      subtotal: Number(receipt.subtotal),
      serviceChargePercent: Number(receipt.serviceChargePercent),
      serviceChargeAmount: Number(receipt.serviceChargeAmount),
      taxPercent: Number(receipt.taxPercent),
      taxAmount: Number(receipt.taxAmount),
      total: Number(receipt.total),
      ...(receipt.creatorName && { creatorName: receipt.creatorName }),
      ...(receipt.creatorPhone && { creatorPhone: receipt.creatorPhone }),
      ...(receipt.imageUrl && { imageUrl: receipt.imageUrl }),
      payments: receipt.payments.map((payment) => ({
        id: payment.id,
        receiptId: payment.receiptId,
        payerName: payment.payerName,
        items: payment.items,
        subtotal: Number(payment.subtotal),
        serviceChargeAmount: Number(payment.serviceChargeAmount),
        taxAmount: Number(payment.taxAmount),
        total: Number(payment.total),
        createdAt: payment.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(formattedReceipt);
  } catch (error) {
    console.error("Error fetching receipt:", error);
    return NextResponse.json(
      { error: "Failed to fetch receipt" },
      { status: 500 }
    );
  }
}
