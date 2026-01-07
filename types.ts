
export type ViewState = 'landing' | 'supplier' | 'store';

export type OrderStatus = 'NEW' | 'CONFIRMED' | 'IN_PRODUCTION' | 'READY' | 'DELIVERED' | 'CANCELED';

export interface ModelCategory {
  id: string;
  name: string;
  isActive: boolean;
}

export interface ModelItem {
  id: string;
  categoryId: string;
  name: string;
  basePrice: number;
  isActive: boolean;
}

// Snapshot of a line item at the time of purchase
export interface OrderLine {
  id: string;
  categorySnapshot: string; // Name of category at time of order
  itemSnapshot: string;     // Name of item at time of order
  itemId: string;           // Reference to original item ID
  unitPriceSnapshot: number;
  quantity: number;
  lineTotal: number;
  description?: string;
  color?: string; // Added color field
}

export interface Order {
  id: string;
  storeId: string;
  storeName: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string; // Added address
  deliveryDate: string;
  orderDescription?: string; // Added general order description
  status: OrderStatus;
  lines: OrderLine[];
  totalPriceSnapshot: number;
  createdAt: string;
  timestamp: number; // Added for precise 5-minute edit window calculation
}

export interface StoreAccount {
  id: string;
  name: string;
  username: string;
  password: string;
  ownerName: string;
  ownerLastName: string;
  phone: string;
  address: string;
  isActive: boolean;
}
