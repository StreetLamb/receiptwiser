"use client";

import { useState } from "react";
import { Receipt, ReceiptItem, UserBill, Payment, PaymentItem } from "@/types";
import NumberInput from "./NumberInput";

interface ReceiptViewerProps {
  receipt: Receipt;
}

export default function ReceiptViewer({ receipt }: ReceiptViewerProps) {
  const [selectedItems, setSelectedItems] = useState<
    Map<string, { item: ReceiptItem; quantity: number }>
  >(new Map());

  const [userBill, setUserBill] = useState<UserBill | null>(null);
  const [payments, setPayments] = useState<Payment[]>(receipt.payments || []);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payerName, setPayerName] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Toggle item selection
  const toggleItemSelection = (item: ReceiptItem) => {
    const newSelectedItems = new Map(selectedItems);

    if (newSelectedItems.has(item.id)) {
      newSelectedItems.delete(item.id);
    } else {
      newSelectedItems.set(item.id, { item, quantity: 1 });
    }

    setSelectedItems(newSelectedItems);
    calculateBill(newSelectedItems);
  };

  // Update selected item quantity
  const updateSelectedQuantity = (itemId: string, quantity: number) => {
    const newSelectedItems = new Map(selectedItems);
    const selection = newSelectedItems.get(itemId);

    if (selection) {
      newSelectedItems.set(itemId, { ...selection, quantity });
    }

    setSelectedItems(newSelectedItems);
    calculateBill(newSelectedItems);
  };

  // Handle payment recording
  const handleRecordPayment = async () => {
    if (!payerName.trim()) {
      alert("Please enter your name");
      return;
    }

    if (!userBill || userBill.selectedItems.length === 0) {
      alert("Please select items to pay for");
      return;
    }

    setIsSubmittingPayment(true);

    try {
      // Extract receipt ID from URL
      const receiptId = window.location.pathname.split("/").pop();

      // Prepare payment items
      const paymentItems: PaymentItem[] = userBill.selectedItems.map((item) => ({
        itemId: item.id,
        itemName: item.name,
        quantity: item.selectedQuantity,
        amount: item.unitPrice * item.selectedQuantity,
      }));

      // Submit payment
      const response = await fetch(`/api/receipts/${receiptId}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payerName: payerName.trim(),
          items: paymentItems,
          subtotal: userBill.subtotal,
          serviceChargeAmount: userBill.serviceChargeAmount,
          taxAmount: userBill.taxAmount,
          total: userBill.total,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to record payment");
      }

      const newPayment: Payment = await response.json();

      // Update local payments list
      setPayments([newPayment, ...payments]);

      // Reset form
      setPayerName("");
      setSelectedItems(new Map());
      setUserBill(null);
      setShowPaymentModal(false);

      alert("Payment recorded successfully!");
    } catch (error) {
      console.error("Error recording payment:", error);
      alert("Failed to record payment. Please try again.");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Calculate the user's bill based on selected items
  const calculateBill = (
    items: Map<string, { item: ReceiptItem; quantity: number }>
  ) => {
    // Convert Map to array for easier processing
    const selectedItemsArray = Array.from(items.values());

    // Calculate subtotal
    const subtotal = selectedItemsArray.reduce(
      (sum, { item, quantity }) => sum + item.unitPrice * quantity,
      0
    );

    // Calculate proportional service charge based on percentage
    const serviceChargeRate = receipt.serviceChargePercent / 100;
    const serviceChargeAmount = subtotal * serviceChargeRate;

    // Calculate proportional tax (applied to subtotal + service charge)
    const taxRate = receipt.taxPercent / 100;
    const taxAmount = (subtotal + serviceChargeAmount) * taxRate;

    // Calculate total
    const total = subtotal + serviceChargeAmount + taxAmount;

    // Create user bill
    const bill: UserBill = {
      selectedItems: selectedItemsArray.map(({ item, quantity }) => ({
        ...item,
        selectedQuantity: quantity,
      })),
      subtotal,
      serviceChargeAmount,
      taxAmount,
      total,
    };

    setUserBill(bill);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Shared Receipt</h2>

      {/* Items Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-center">Select</th>
              <th className="p-2 text-left">Item</th>
              <th className="p-2 text-right">Unit Price</th>
              <th className="p-2 text-center">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {receipt.items.map((item) => {
              const isSelected = selectedItems.has(item.id);
              const selectedQuantity = isSelected
                ? selectedItems.get(item.id)?.quantity || 0
                : 0;

              return (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleItemSelection(item)}
                      className="h-4 w-4"
                    />
                  </td>
                  <td className="p-2">{item.name}</td>
                  <td className="p-2 text-right">
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td className="p-2 text-center">
                    {isSelected ? (
                      <NumberInput
                        value={selectedQuantity}
                        onChange={(value) => {
                          // During typing, don't apply max constraints to allow fraction input
                          // The NumberInput component will handle constraints on blur
                          updateSelectedQuantity(item.id, value);
                        }}
                        min={0}
                        max={item.quantity}
                        defaultValue={1}
                        allowDecimals={true}
                        allowFractions={true}
                        className="w-16 p-1 border rounded text-center"
                      />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* User Bill Summary */}
      {userBill && userBill.selectedItems.length > 0 && (
        <div className="mt-6 border p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Your Bill</h3>

          <div className="space-y-2">
            {userBill.selectedItems.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>
                  {item.name} x {item.selectedQuantity}
                </span>
                <span>
                  ${(item.unitPrice * item.selectedQuantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-2 border-t">
            <div className="flex justify-between items-center mb-1">
              <span>Subtotal:</span>
              <span>${userBill.subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center mb-1">
              <span>Service Charge:</span>
              <span>${userBill.serviceChargeAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center mb-1">
              <span>Tax:</span>
              <span>${userBill.taxAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center font-bold text-lg mt-2 pt-2 border-t">
              <span>
                {receipt.creatorName
                  ? `Pay to ${receipt.creatorName}:`
                  : "Total:"}
              </span>
              <span>${userBill.total.toFixed(2)}</span>
            </div>

            {/* Record Payment Button */}
            <div className="mt-4 pt-2 border-t">
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
              >
                Record Payment
              </button>
              <p className="text-xs text-gray-500 mt-1 text-center">
                {receipt.creatorName
                  ? `Record that you've paid ${receipt.creatorName}`
                  : "Record your payment for these items"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="text-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Record Your Payment</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full p-2 border rounded"
                disabled={isSubmittingPayment}
              />
            </div>

            {userBill && (
              <div className="mb-4 p-3 rounded">
                <p className="text-sm font-medium mb-2">Payment Summary:</p>
                <div className="text-sm space-y-1">
                  {userBill.selectedItems.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.name} x {item.selectedQuantity}</span>
                      <span>${(item.unitPrice * item.selectedQuantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t font-bold flex justify-between">
                    <span>Total:</span>
                    <span>${userBill.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPayerName("");
                }}
                className="flex-1 py-2 px-4 bg-gray-500 hover:bg-gray-600 rounded transition-colors"
                disabled={isSubmittingPayment}
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                className="flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 rounded transition-colors disabled:bg-blue-300"
                disabled={isSubmittingPayment}
              >
                {isSubmittingPayment ? "Recording..." : "Record Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Payment History</h3>
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{payment.payerName}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(payment.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="font-bold text-lg">${payment.total.toFixed(2)}</p>
                </div>

                <div className="mt-2 text-sm">
                  <p className="font-medium mb-1">Items paid:</p>
                  <ul className="space-y-1">
                    {payment.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between text-gray-700">
                        <span>{item.itemName} x {item.quantity}</span>
                        <span>${item.amount.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
