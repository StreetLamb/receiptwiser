"use client";

import { useState } from "react";
import { Receipt, ReceiptItem, UserBill } from "@/types";

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

    // Calculate proportional tax
    const taxRate = receipt.taxAmount / receipt.subtotal;
    const taxAmount = subtotal * taxRate;

    // Calculate total
    const total = subtotal + taxAmount;

    // Create user bill
    const bill: UserBill = {
      selectedItems: selectedItemsArray.map(({ item, quantity }) => ({
        ...item,
        selectedQuantity: quantity,
      })),
      subtotal,
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
            <tr className="bg-gray-100">
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
                      <input
                        type="number"
                        min="1"
                        max={item.quantity}
                        value={selectedQuantity}
                        onChange={(e) =>
                          updateSelectedQuantity(
                            item.id,
                            Math.min(
                              Math.max(1, parseInt(e.target.value) || 1),
                              item.quantity
                            )
                          )
                        }
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
        <div className="mt-6 border p-4 rounded-lg bg-gray-50">
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
              <span>Tax:</span>
              <span>${userBill.taxAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center font-bold text-lg mt-2 pt-2 border-t">
              <span>Total:</span>
              <span>${userBill.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
