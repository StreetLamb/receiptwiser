"use client";

import { useState, useEffect } from "react";
import { Receipt, ReceiptItem } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface ReceiptEditorProps {
  receipt: Receipt;
  onChange: (updatedReceipt: Receipt) => void;
}

export default function ReceiptEditor({
  receipt,
  onChange,
}: ReceiptEditorProps) {
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [serviceChargePercent, setServiceChargePercent] = useState<number>(
    receipt.serviceChargePercent || 0
  );
  const [taxPercent, setTaxPercent] = useState<number>(receipt.taxPercent);
  const [creatorPhone, setCreatorPhone] = useState<string>(
    receipt.creatorPhone || ""
  );
  const [showImage, setShowImage] = useState<boolean>(true);

  // Initialize items with correct unit prices calculated from total prices
  useEffect(() => {
    const initializedItems = receipt.items.map((item) => ({
      ...item,
      // Calculate unit price based on total price and quantity
      unitPrice:
        item.quantity > 0 ? item.totalPrice / item.quantity : item.unitPrice,
    }));
    setItems(initializedItems);
  }, []);

  // Calculate subtotal, service charge, tax amount, and total whenever items, service charge percent, tax percent, or phone number change
  useEffect(() => {
    const subtotal = calculateSubtotal(items);
    const serviceChargeAmount = (subtotal * serviceChargePercent) / 100;
    const taxAmount = ((subtotal + serviceChargeAmount) * taxPercent) / 100;
    const total = subtotal + serviceChargeAmount + taxAmount;

    const updatedReceipt: Receipt = {
      items,
      subtotal,
      serviceChargePercent,
      serviceChargeAmount,
      taxPercent,
      taxAmount,
      total,
      creatorPhone: creatorPhone || undefined,
      imageUrl: receipt.imageUrl,
    };

    onChange(updatedReceipt);
  }, [items, serviceChargePercent, taxPercent, creatorPhone]);

  // Calculate subtotal from items
  const calculateSubtotal = (items: ReceiptItem[]): number => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  // Update an item
  const updateItem = (index: number, updatedItem: Partial<ReceiptItem>) => {
    const newItems = [...items];

    // Update the specified properties
    newItems[index] = {
      ...newItems[index],
      ...updatedItem,
    };

    // Recalculate total price if quantity or unit price changed
    if (
      updatedItem.quantity !== undefined ||
      updatedItem.unitPrice !== undefined
    ) {
      const quantity = updatedItem.quantity ?? newItems[index].quantity;
      const unitPrice = updatedItem.unitPrice ?? newItems[index].unitPrice;
      newItems[index].totalPrice = quantity * unitPrice;
    }

    // If totalPrice changed directly, recalculate unitPrice
    if (updatedItem.totalPrice !== undefined) {
      const quantity = newItems[index].quantity;
      // Avoid division by zero
      if (quantity > 0) {
        newItems[index].unitPrice = updatedItem.totalPrice / quantity;
      }
    }

    setItems(newItems);
  };

  // Add a new item
  const addItem = () => {
    const newItem: ReceiptItem = {
      id: uuidv4(),
      name: "",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    };
    setItems([...items, newItem]);
  };

  // Delete an item
  const deleteItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Receipt Details</h2>

      {/* Receipt Image Toggle */}
      {receipt.imageUrl && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setShowImage(!showImage)}
              className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
            >
              {showImage ? "Hide Receipt Image" : "Show Receipt Image"}
              <svg
                className={`ml-1 h-4 w-4 transform transition-transform ${
                  showImage ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          {showImage && (
            <div className="border rounded-lg p-2 bg-gray-50">
              <img
                src={receipt.imageUrl}
                alt="Receipt"
                className="max-h-96 mx-auto"
              />
            </div>
          )}
        </div>
      )}

      {/* Items Table */}
      <div className="mb-2 text-sm text-gray-600">
        <p>
          Edit either Unit Price or Total Price - the other will be calculated
          automatically based on quantity.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left">Qty</th>
              <th className="p-2 text-left">Item</th>
              <th className="p-2 text-right">Unit Price ($)</th>
              <th className="p-2 text-right">Total Price ($)</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="p-2">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, {
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-16 p-1 border rounded"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) =>
                      updateItem(index, { name: e.target.value })
                    }
                    className="w-full min-w-[150px] p-1 border rounded"
                    placeholder="Item name"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(index, {
                        unitPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-24 p-1 border rounded text-right"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.totalPrice}
                    onChange={(e) =>
                      updateItem(index, {
                        totalPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-24 p-1 border rounded text-right"
                  />
                </td>
                <td className="p-2 text-center">
                  <button
                    onClick={() => deleteItem(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Item Button */}
      <button
        onClick={addItem}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Add Item
      </button>

      {/* Tax and Totals */}
      <div className="mt-6 border-t pt-4">
        <div className="flex justify-between items-center mb-2">
          <span>Subtotal:</span>
          <span>${receipt.subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <span className="mr-2">Service Charge (%):</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={serviceChargePercent}
              onChange={(e) =>
                setServiceChargePercent(parseFloat(e.target.value) || 0)
              }
              className="w-16 p-1 border rounded"
            />
          </div>
          <span>${receipt.serviceChargeAmount.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <span className="mr-2">Tax (%):</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={taxPercent}
              onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
              className="w-16 p-1 border rounded"
            />
          </div>
          <span>${receipt.taxAmount.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center font-bold text-lg mt-2 pt-2 border-t">
          <span>Total:</span>
          <span>${receipt.total.toFixed(2)}</span>
        </div>

        {/* Creator Phone Number for WhatsApp */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center mb-2">
            <span className="mr-2">Your Phone Number:</span>
            <input
              type="tel"
              value={creatorPhone}
              onChange={(e) => setCreatorPhone(e.target.value)}
              placeholder="e.g. 6512345678"
              className="p-1 border rounded"
            />
          </div>
          <p className="text-xs text-gray-500">
            Enter your phone number so people can notify you of payment via
            WhatsApp
          </p>
        </div>
      </div>
    </div>
  );
}
