/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MenuCategory = string;

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  stock: number;
  image: string;
  description: string;
  tags: string[]; // e.g. ['Vegan', "Chef's Choice", 'Popular']
  isAvailable: boolean;
  discountPercentage?: number; // e.g., 10 for 10% off
}

export interface CartItem {
  id: string; // unique for cart instances if same item with different customization
  menuItem: MenuItem;
  quantity: number;
  customization?: string;
}

export type OrderStatus = 'Pending' | 'Action Required' | 'Ready' | 'Completed' | 'Delayed' | 'Cancelled';

export interface Order {
  id: string; // e.g., "8429"
  tableRef: string; // e.g., "Table 12"
  timestamp: Date;
  status: OrderStatus;
  items: CartItem[];
  subtotal: number;
  discountRate: number; // e.g., 0.1 for 10%
  taxRate: number; // e.g., 0.075 for 7.5%
  total: number;
  waitstaff: string;
  dineIn: boolean; // true = Dine-In, false = Takeaway
  
  // Custom tracking fields
  billId?: string;
  billNo?: string;
  tokenNo?: string;
  time?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}

export type TableZone = 'Main Floor' | 'Window' | 'Booth' | 'VIP Area' | 'Bar' | 'Patio' | 'Outdoor';
export type TableStatus = 'Available' | 'Occupied' | 'Reserved';

export interface TableInfo {
  id: string; // e.g., "01"
  capacity: number;
  zone: TableZone;
  status: TableStatus;
  floor?: string; // e.g. "Ground Floor", "1st Floor", etc.
}

export type RawMaterialStatus = 'HEALTHY' | 'LOW STOCK' | 'OUT OF STOCK';

export interface PriceHistoryRecord {
  date: string;
  price: number;
  quantity: number;
}

export interface RawMaterial {
  id: string;
  name: string;
  unit: string; // e.g. "pcs", "kg", "liters"
  currentStock: number;
  status: RawMaterialStatus;
  icon: string; // Material symbol icon name e.g., 'bakery_dining', 'coffee', 'opacity', 'egg'
  priceHistories?: PriceHistoryRecord[];
  avgPrice?: number;
  category?: string; // e.g. "Dairy", "Produce", etc.
  label?: string; // e.g. "Priority", "Alternative", etc.
}

export type InventoryLogAction = 'CREATE' | 'RESTOCK' | 'ADJUST' | 'USE' | 'DELETE';

export interface InventoryLog {
  id: string;
  materialId: string;
  materialName: string;
  actionType: InventoryLogAction;
  amount: number;
  unit: string;
  previousStock: number;
  newStock: number;
  operator: string;
  timestamp: string;
  notes?: string;
}

export interface PromoDiscount {
  id: string;
  code: string; // e.g. "WELCOME10", "DINEVIP"
  type: 'Percentage' | 'Fixed';
  value: number; // e.g., percentage 15 = 15%, fixed 10 = $10.00
  isActive: boolean;
  minSpend?: number; // optional minimum cart value needed to qualify
}

export type UserRole = 'Manager' | 'Waitstaff' | 'Kitchen';

export interface UserSession {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  pin: string;
  username: string;
  email?: string;
  orgCode?: string;
  _docId?: string;
}

