"use client";

import { useState, useMemo } from "react";
import { Receipt, ReceiptItem, UserBill, Payment, PaymentItem } from "@/types";
import NumberInput from "./NumberInput";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { QRCodeSVG } from "qrcode.react";
import { paynowGenerator } from "paynow-generator";

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
  const [recordPaymentError, setRecordPaymentError] = useState("");

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
    // Clear previous errors
    setRecordPaymentError("");

    if (!payerName.trim()) {
      setRecordPaymentError("Please enter your name");
      return;
    }

    if (!userBill || userBill.selectedItems.length === 0) {
      setRecordPaymentError("Please select items to pay for");
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
      setRecordPaymentError("");
      setSelectedItems(new Map());
      setUserBill(null);
      setShowPaymentModal(false);
    } catch (error) {
      console.error("Error recording payment:", error);
      setRecordPaymentError("Failed to record payment. Please try again.");
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

  // Generate PayNow QR code string if applicable
  const payNowString = useMemo(() => {
    // Only generate if:
    // 1. Creator phone exists and starts with "65" (Singapore)
    // 2. User has selected items with a total
    if (!receipt.creatorPhone || !receipt.creatorPhone.startsWith("65")) {
      return null;
    }

    if (!userBill || userBill.total <= 0) {
      return null;
    }

    // Extract phone number without country code
    const phoneNumber = receipt.creatorPhone.slice(2);

    // Generate PayNow string
    // proxyType: 'mobile', proxyValue: phone number, edit: 'no', price: total amount
    // merchantName left empty and additionalComments set as 'NA'
    try {
      const paynowstring = paynowGenerator(
        "mobile",
        phoneNumber,
        "no",
        Number.parseFloat(userBill.total.toFixed(2)),
        "",
        "ReceiptWiser"
      );
      console.log("Generated PayNow string:", paynowstring);
      return paynowstring;
    } catch (error) {
      console.error("Error generating PayNow QR code:", error);
      return null;
    }
  }, [receipt.creatorPhone, userBill]);

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
                        className="w-16 text-center"
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

            {/* PayNow QR Code */}
            {payNowString && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex flex-col items-center space-y-2">
                  <p className="text-sm font-medium">Pay with PayNow</p>
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                    <QRCodeSVG value={payNowString} size={200} level="H" />
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Scan this QR code with your banking app to pay via PayNow
                  </p>
                </div>
              </div>
            )}

            {/* Record Payment Button */}
            <div className="mt-4 pt-2 border-t">
              <Button
                onClick={() => setShowPaymentModal(true)}
                className="w-full"
              >
                Record Payment
              </Button>
              <p className="text-xs text-gray-500 mt-1 text-center">
                {receipt.creatorName
                  ? `Record that you've paid ${receipt.creatorName}`
                  : "Record your payment for these items"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Your Payment</DialogTitle>
            <DialogDescription>
              Enter your name to record the payment for the selected items.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Your Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={payerName}
                onChange={(e) => {
                  setPayerName(e.target.value);
                  if (recordPaymentError) setRecordPaymentError("");
                }}
                placeholder="Enter your name"
                className="w-full"
                disabled={isSubmittingPayment}
              />
              {recordPaymentError && (
                <p className="text-sm text-red-500">{recordPaymentError}</p>
              )}
            </div>

            {userBill && (
              <div className="p-4 border rounded-md bg-muted">
                <p className="text-sm font-medium mb-3">Payment Summary:</p>
                <div className="space-y-2 text-sm">
                  {userBill.selectedItems.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.name} x {item.selectedQuantity}</span>
                      <span>${(item.unitPrice * item.selectedQuantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="pt-2 mt-2 border-t space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${userBill.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service Charge:</span>
                      <span>${userBill.serviceChargeAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>${userBill.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="pt-1 border-t font-bold flex justify-between">
                      <span>Total:</span>
                      <span>${userBill.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="sm:space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowPaymentModal(false);
                setPayerName("");
                setRecordPaymentError("");
              }}
              disabled={isSubmittingPayment}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleRecordPayment}
              disabled={isSubmittingPayment}
            >
              {isSubmittingPayment ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="mt-8 border-t pt-6">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="payment-history" className="border-none">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <h3 className="text-lg font-semibold">Payment History</h3>
                  <span className="text-sm font-normal text-gray-600">
                    ${payments.reduce((sum, p) => sum + p.total, 0).toFixed(2)} out of ${receipt.total.toFixed(2)} paid ({payments.length} payment{payments.length !== 1 ? 's' : ''})
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
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
                        <ul className="space-y-1 mb-3">
                          {payment.items.map((item, idx) => (
                            <li key={idx} className="flex justify-between text-gray-700">
                              <span>{item.itemName} x {item.quantity}</span>
                              <span>${item.amount.toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="pt-2 border-t space-y-1">
                          <div className="flex justify-between text-gray-700">
                            <span>Subtotal:</span>
                            <span>${payment.subtotal.toFixed(2)}</span>
                          </div>
                          {payment.serviceChargeAmount > 0 && (
                            <div className="flex justify-between text-gray-700">
                              <span>Service Charge:</span>
                              <span>${payment.serviceChargeAmount.toFixed(2)}</span>
                            </div>
                          )}
                          {payment.taxAmount > 0 && (
                            <div className="flex justify-between text-gray-700">
                              <span>Tax:</span>
                              <span>${payment.taxAmount.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-semibold pt-1 border-t">
                            <span>Total:</span>
                            <span>${payment.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </div>
  );
}
