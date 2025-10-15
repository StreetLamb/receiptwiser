import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentItem } from "@/types";
import { v4 as uuidv4 } from "uuid";

// GET /api/receipts/[id]/payments - Get all payments for a receipt
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const payments = await prisma.payment.findMany({
      where: { receiptId: id },
      orderBy: { createdAt: "desc" },
    });

    // Convert Prisma types to JSON-friendly types
    const formattedPayments = payments.map((payment) => ({
      id: payment.id,
      receiptId: payment.receiptId,
      payerName: payment.payerName,
      items: payment.items as unknown as PaymentItem[],
      subtotal: Number(payment.subtotal),
      serviceChargeAmount: Number(payment.serviceChargeAmount),
      taxAmount: Number(payment.taxAmount),
      total: Number(payment.total),
      createdAt: payment.createdAt.toISOString(),
    }));

    return NextResponse.json(formattedPayments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

// POST /api/receipts/[id]/payments - Record a new payment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify receipt exists
    const receipt = await prisma.receipt.findUnique({
      where: { id },
    });

    if (!receipt) {
      return NextResponse.json(
        { error: "Receipt not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { payerName, items, subtotal, serviceChargeAmount, taxAmount, total } = body;

    // Validate required fields
    if (!payerName || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Payer name and items are required" },
        { status: 400 }
      );
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        id: uuidv4(),
        receiptId: id,
        payerName,
        items: items,
        subtotal,
        serviceChargeAmount,
        taxAmount,
        total,
      },
    });

    return NextResponse.json(
      {
        id: payment.id,
        receiptId: payment.receiptId,
        payerName: payment.payerName,
        items: payment.items as unknown as PaymentItem[],
        subtotal: Number(payment.subtotal),
        serviceChargeAmount: Number(payment.serviceChargeAmount),
        taxAmount: Number(payment.taxAmount),
        total: Number(payment.total),
        createdAt: payment.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
