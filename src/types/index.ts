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
  creatorName?: string; // Optional name of the payer
  creatorPhone?: string; // Optional phone number for WhatsApp contact
  imageUrl?: string; // Optional image URL for receipt reference
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
