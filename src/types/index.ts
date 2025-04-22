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
  taxPercent: number;
  taxAmount: number;
  total: number;
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
  taxAmount: number;
  total: number;
}
