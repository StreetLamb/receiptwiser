// Receipt item interface
export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Receipt interface
export interface Receipt {
  items: ReceiptItem[];
  subtotal: number;
  serviceChargePercent: number;
  serviceChargeAmount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  creatorName?: string; // Optional name of the person who paid initially
  creatorPhone?: string; // Optional phone number to contact for payment
  imageUrl?: string; // Optional image URL for receipt reference
  payments?: Payment[]; // Optional list of recorded payments
}

// User selection interface
export interface UserSelection {
  itemId: string;
  quantity: number;
}

// User bill interface
export interface UserBill {
  selectedItems: (ReceiptItem & { selectedQuantity: number })[];
  subtotal: number;
  serviceChargeAmount: number;
  taxAmount: number;
  total: number;
}

// Payment item interface
export interface PaymentItem {
  itemId: string;
  itemName: string;
  quantity: number;
  amount: number;
}

// Payment interface
export interface Payment {
  id: string;
  receiptId: string;
  payerName: string;
  items: PaymentItem[];
  subtotal: number;
  serviceChargeAmount: number;
  taxAmount: number;
  total: number;
  createdAt: string;
}
