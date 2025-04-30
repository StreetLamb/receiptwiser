"use client";

import { useState } from "react";
import { Receipt, ReceiptItem, UserBill } from "@/types";
import { FaWhatsapp } from "react-icons/fa";
import NumberInput from "./NumberInput";

interface ReceiptViewerProps {
  receipt: Receipt;
}

export default function ReceiptViewer({ receipt }: ReceiptViewerProps) {
  const [selectedItems, setSelectedItems] = useState<
    Map<string, { item: ReceiptItem; quantity: number }>
  >(new Map());

  const [userBill, setUserBill] = useState<UserBill | null>(null);

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

  // Generate WhatsApp message with bill details
  const generateWhatsAppMessage = () => {
    if (!userBill) return "";

    // Create message with bill details
    let message = "Hi, I have paid for the following items:\n\n";

    // Add items
    userBill.selectedItems.forEach((item) => {
      message += `${item.name} x ${item.selectedQuantity}: $${(
        item.unitPrice * item.selectedQuantity
      ).toFixed(2)}\n`;
    });

    // Add totals
    message += `\nSubtotal: $${userBill.subtotal.toFixed(2)}`;
    message += `\nService Charge: $${userBill.serviceChargeAmount.toFixed(2)}`;
    message += `\nTax: $${userBill.taxAmount.toFixed(2)}`;
    message += `\nTotal: $${userBill.total.toFixed(2)}`;

    return encodeURIComponent(message);
  };

  // Generate WhatsApp URL
  const getWhatsAppUrl = () => {
    if (!receipt.creatorPhone) return "";

    const message = generateWhatsAppMessage();
    return `https://wa.me/${receipt.creatorPhone}?text=${message}`;
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

    // Calculate proportional service charge
    const serviceChargeRate = receipt.serviceChargeAmount / receipt.subtotal;
    const serviceChargeAmount = subtotal * serviceChargeRate;

    // Calculate proportional tax (applied to subtotal + service charge)
    const taxBase = receipt.subtotal + receipt.serviceChargeAmount;
    const taxRate = receipt.taxAmount / taxBase;
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

            {/* WhatsApp Payment Notification Button */}
            {receipt.creatorPhone && (
              <div className="mt-4 pt-2 border-t">
                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                >
                  <FaWhatsapp className="mr-2 text-xl" />
                  <span>Notify Payment via WhatsApp</span>
                </a>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  {receipt.creatorName
                    ? `Notify ${receipt.creatorName} that you have paid`
                    : "Notify the receipt creator that you have paid"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
