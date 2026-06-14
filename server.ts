import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { 
  getFullState, 
  saveDocument, 
  deleteDocument, 
  seedDatabaseIfEmpty,
  getCollectionData,
  seedOrganisation
} from './src/db-firestore';

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper: Log raw materials stock updates
async function logInventoryEvent(
  materialId: string,
  materialName: string,
  actionType: 'CREATE' | 'RESTOCK' | 'ADJUST' | 'USE' | 'DELETE',
  amount: number,
  unit: string,
  previousStock: number,
  newStock: number,
  operator: string = 'Staff Member',
  notes?: string,
  orgCode: string = 'AHARBY'
) {
  try {
    const logId = 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const logData = {
      id: logId,
      materialId,
      materialName,
      actionType,
      amount,
      unit,
      previousStock,
      newStock,
      operator,
      timestamp: new Date().toISOString(),
      notes: notes || '',
      orgCode
    };
    await saveDocument('inventoryLogs', logId, logData);
  } catch (err) {
    console.error('Failed to save inventory log:', err);
  }
}

// Initial API route to check health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// API endpoint to retrieve full state
app.get('/api/state', async (req, res) => {
  try {
    const orgCode = req.headers['x-organisation-code'] as string;
    let db = await getFullState(orgCode);

    // Auto-heal/seed ANY organization if it behaves as a blank workspace
    if (orgCode && (!db.menuItems || db.menuItems.length === 0)) {
      console.log(`Auto-seeding empty multi-tenant organization: ${orgCode}`);
      await seedOrganisation(orgCode);
      db = await getFullState(orgCode);
    }

    res.json(db);
  } catch (err) {
    console.error('Error fetching state:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Endpoint to check for duplicate order status
app.post('/api/orders/check-duplicate', async (req, res) => {
  try {
    const { tableRef, total, items } = req.body;
    const orgCode = req.headers['x-organisation-code'] as string;
    const db = await getFullState(orgCode);
    const thirtySecondsAgo = Date.now() - 30000;

    // Let's check if there is an order placed for the same table and total within the last 30s
    const duplicate = db.orders.find((order: any) => {
      const orderTime = new Date(order.timestamp).getTime();
      return order.tableRef === tableRef &&
        Math.abs(order.total - total) < 0.05 &&
        orderTime > thirtySecondsAgo;
    });

    if (duplicate) {
      return res.json({ isDuplicate: true, orderId: duplicate.id });
    }
    res.json({ isDuplicate: false });
  } catch (err) {
    console.error('Error checking duplicate:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// API endpoint to place a new order
app.post('/api/orders', async (req, res) => {
  try {
    const orderData = req.body;
    const orgCode = (req.headers['x-organisation-code'] as string || 'AHARBY').toUpperCase().trim();
    const db = await getFullState(orgCode);

    // 1. Generate unique sequential orderId date-wise count starting from 1
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const dateKey = `${dd}${mm}${yy}`; // e.g. "080626"

    // Count orders placed today to find token/sequence number
    const todayOrders = db.orders.filter((o: any) => {
      if (o.date === dateKey) return true;
      if (o.timestamp) {
        try {
          const d = new Date(o.timestamp);
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const yy = String(d.getFullYear()).slice(-2);
          return `${dd}${mm}${yy}` === dateKey;
        } catch (e) {
          return false;
        }
      }
      return false;
    });

    const maxToken = todayOrders.reduce((max: number, o: any) => {
      const tNum = Number(o.tokenNo);
      return !isNaN(tNum) && tNum > max ? tNum : max;
    }, 0);
    const tokenNo = maxToken + 1;
    const orderSeqId = tokenNo; // Count starts at 1 per date

    // 2. Generate unique Bill ID in the exact requested format: <date: ddmmyy>_<order_id>_<customer_name>
    let rawCustomerName = orderData.customerName ? orderData.customerName.trim() : 'Guest';
    const cleanCustomerName = rawCustomerName.replace(/[^a-zA-Z0-9]/g, '-');
    const billNo = `${dateKey}_${orderSeqId}_${cleanCustomerName}`;

    // Format ordertime string (e.g. "12:35 PM")
    const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    const orderedTime = now.toLocaleTimeString('en-US', options);

    // Apply order count to unique id in db
    const absoluteOrderId = `${orgCode}_${dateKey}_${orderSeqId}`;

    const subtotal = Number(orderData.subtotal) || 0;
    const discountAmount = Number(orderData.discount) || 0;
    const serviceTaxValue = Number(orderData.serviceTax) || 0;

    const discountRate = orderData.discountRate !== undefined ? Number(orderData.discountRate) : (subtotal > 0 ? Number((discountAmount / subtotal).toFixed(4)) : 0);
    const taxRate = orderData.taxRate !== undefined ? Number(orderData.taxRate) : ((subtotal - discountAmount) > 0 ? Number((serviceTaxValue / (subtotal - discountAmount)).toFixed(4)) : 0.10);
    const dineIn = orderData.dineIn !== undefined ? Boolean(orderData.dineIn) : (orderData.tableRef ? !/takeaway/i.test(orderData.tableRef) : true);
    const waitstaff = orderData.operatorName || orderData.waitstaff || 'Sarah Jenkins';

    const newOrder = {
      ...orderData,
      id: absoluteOrderId,
      orgCode,
      date: dateKey,
      timestamp: now.toISOString(),
      tokenNo,
      billNo,
      orderedTime,
      subtotal,
      discountRate,
      taxRate,
      dineIn,
      waitstaff,
      items: orderData.items || []
    };

    // Save order to Firestore
    await saveDocument('orders', absoluteOrderId, newOrder);

    // Save customer details for auto-fill in future
    if (orderData.customerPhone || orderData.customerEmail) {
      // Create a unique clean ID out of phone or email
      const customerContact = (orderData.customerPhone || orderData.customerEmail).trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
      if (customerContact) {
        const customerDoc = {
          id: customerContact,
          name: rawCustomerName,
          phone: orderData.customerPhone || '',
          email: orderData.customerEmail || '',
          orgCode
        };
        await saveDocument('customers', `${orgCode}_${customerContact}`, customerDoc);
      }
    }

    // Update table occupancy status if tableRef matches an active table ID
    const tableIdMatch = (orderData.tableRef || '').match(/\d+/);
    if (tableIdMatch && orderData.dineIn) {
      const tableId = tableIdMatch[0].padStart(2, '0');
      const table = db.tables.find((t: any) => t.id === tableId);
      if (table) {
        table.status = 'Occupied';
        await saveDocument('tables', tableId, table);
      }
    }

    // Deduct ingredient raw materials stock if mapped
    for (const item of newOrder.items) {
      if (item.menuItem.id === 'signatureWagyuBurger') {
        const mat = db.materials.find((m: any) => m.id === 'raw01');
        if (mat) {
          const prev = mat.currentStock;
          mat.currentStock = Math.max(0, mat.currentStock - item.quantity);
          if (mat.currentStock === 0) mat.status = 'OUT OF STOCK';
          else if (mat.currentStock < 10) mat.status = 'LOW STOCK';
          else mat.status = 'HEALTHY';
          await saveDocument('materials', 'raw01', mat);

          await logInventoryEvent(
            'raw01',
            mat.name,
            'USE',
            item.quantity,
            mat.unit,
            prev,
            mat.currentStock,
            'POS System',
            `Used in checkout of Order #${newOrder.id}`,
            orgCode
          );
        }
      }
      if (item.menuItem.id === 'aaharSignatureSour') {
        const mat = db.materials.find((m: any) => m.id === 'raw03');
        if (mat) {
          const prev = mat.currentStock;
          const usage = parseFloat((item.quantity * 0.2).toFixed(2));
          mat.currentStock = Math.max(0, parseFloat((mat.currentStock - usage).toFixed(2)));
          if (mat.currentStock === 0) mat.status = 'OUT OF STOCK';
          else if (mat.currentStock < 5) mat.status = 'LOW STOCK';
          else mat.status = 'HEALTHY';
          await saveDocument('materials', 'raw03', mat);

          await logInventoryEvent(
            'raw03',
            mat.name,
            'USE',
            usage,
            mat.unit,
            prev,
            mat.currentStock,
            'POS System',
            `Used in checkout of Order #${newOrder.id}`,
            orgCode
          );
        }
      }
    }

    res.status(201).json({ success: true, order: newOrder });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Update order status (Pending -> Completed etc)
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const db = await getFullState();

    const order = db.orders.find((o: any) => o.id === id);
    if (order) {
      order.status = status;
      await saveDocument('orders', id, order);
      return res.json({ success: true, order });
    }
    res.status(404).json({ error: 'Order not found' });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Update the full order document (edit / change items, customer details)
app.put('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { items, tableRef, subtotal, discount, serviceTax, total, customerName, customerPhone, customerEmail, discountRate, status } = req.body;
    const db = await getFullState();

    const order = db.orders.find((o: any) => o.id === id);
    if (order) {
      if (items !== undefined) order.items = items;
      if (tableRef !== undefined) order.tableRef = tableRef;
      if (subtotal !== undefined) order.subtotal = Number(subtotal);
      if (discount !== undefined) order.discount = Number(discount);
      if (serviceTax !== undefined) order.serviceTax = Number(serviceTax);
      if (total !== undefined) order.total = Number(total);
      if (customerName !== undefined) order.customerName = customerName;
      if (customerPhone !== undefined) order.customerPhone = customerPhone;
      if (customerEmail !== undefined) order.customerEmail = customerEmail;
      if (discountRate !== undefined) order.discountRate = Number(discountRate);
      if (status !== undefined) order.status = status;

      await saveDocument('orders', id, order);
      return res.json({ success: true, order });
    }
    res.status(404).json({ error: 'Order not found' });
  } catch (err) {
    console.error('Error modifying order:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Delete or cancel order
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getFullState();

    const order = db.orders.find((o: any) => o.id === id);
    if (order) {
      await deleteDocument('orders', id);
      return res.json({ success: true });
    }
    res.status(404).json({ error: 'Order not found' });
  } catch (err) {
    console.error('Error deleting/cancelling order:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// User sign-up (stores in 'Pending' state)
app.post('/api/users/signup', async (req, res) => {
  try {
    const { name, username, email, role, pin, orgCode } = req.body;
    const db = await getFullState();

    const trimmedUsername = username.trim().toLowerCase();
    const targetedOrg = orgCode ? orgCode.trim().toUpperCase() : 'AHARBY';
    
    if (db.users.some((u: any) => u.username.toLowerCase() === trimmedUsername)) {
      return res.status(400).json({ error: 'Username already registered.' });
    }

    if (pin && pin.length !== 6) {
      return res.status(400).json({ error: 'POS access PIN must be exactly 6 digits.' });
    }

    const newUser = {
      id: String(Date.now()), // Unique ID to avoid custom key collision
      name: name.trim(),
      username: trimmedUsername,
      email: email.trim(),
      role,
      pin: pin || '000000',
      avatar: role === 'Manager' ? 'manage_accounts' : (role === 'Kitchen' ? 'restaurant' : 'person'),
      status: 'Pending', // Requires admin approval
      orgCode: targetedOrg
    };

    await saveDocument('users', newUser.id, newUser);
    res.status(201).json({ success: true, user: newUser });
  } catch (err) {
    console.error('Error in signup:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Manager directly creates an APPROVED staff user/PIN
app.post('/api/users/add', async (req, res) => {
  try {
    const { name, username, email, role, pin, orgCode } = req.body;
    const db = await getFullState();

    const trimmedUsername = username.trim().toLowerCase();
    const targetedOrg = orgCode ? orgCode.trim().toUpperCase() : 'AHARBY';

    if (db.users.some((u: any) => u.username.toLowerCase() === trimmedUsername)) {
      return res.status(400).json({ error: 'Username already exists.' });
    }

    if (pin && pin.length !== 6) {
      return res.status(400).json({ error: 'POS access PIN must be exactly 6 digits.' });
    }

    const newUser = {
      id: String(Date.now()),
      name: name.trim(),
      username: trimmedUsername,
      email: email.trim(),
      role,
      pin: pin || '123456',
      avatar: role === 'Manager' ? 'manage_accounts' : (role === 'Kitchen' ? 'restaurant' : 'person'),
      status: 'Approved', // Directly approved
      orgCode: targetedOrg
    };

    await saveDocument('users', newUser.id, newUser);
    res.status(201).json({ success: true, user: newUser });
  } catch (err) {
    console.error('Error in adding user:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Approve user (sets status to 'Approved')
app.put('/api/users/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getFullState();

    const user = db.users.find((u: any) => u.id === id);
    if (user) {
      user.status = 'Approved';
      await saveDocument('users', id, user);
      return res.json({ success: true, user });
    }
    res.status(404).json({ error: 'User not found' });
  } catch (err) {
    console.error('Error in approving user:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Manager edits/creates PIN for existing Waitstaff/Kitchen staff
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, pin } = req.body;
    const db = await getFullState();

    const user = db.users.find((u: any) => u.id === id);
    if (user) {
      if (name) user.name = name.trim();
      if (email) user.email = email.trim();
      if (role) user.role = role;
      if (pin) {
        if (pin.length !== 6) {
          return res.status(400).json({ error: 'PIN must be exactly 6 digits.' });
        }
        user.pin = pin;
      }
      await saveDocument('users', id, user);
      return res.json({ success: true, user });
    }
    res.status(404).json({ error: 'User not found' });
  } catch (err) {
    console.error('Error in updating user:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Manager edits/creates PIN for existing Waitstaff/Kitchen staff
app.put('/api/users/:id/pin', async (req, res) => {
  try {
    const { id } = req.params;
    const { pin } = req.body;
    const db = await getFullState();

    const user = db.users.find((u: any) => u.id === id);
    if (user) {
      user.pin = pin;
      await saveDocument('users', id, user);
      return res.json({ success: true, user });
    }
    res.status(404).json({ error: 'User not found' });
  } catch (err) {
    console.error('Error in setting PIN:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Manager deletes a staff user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const orgCode = (req.headers['x-organisation-code'] as string || 'AHARBY').toUpperCase().trim();
    await deleteDocument('users', id, orgCode);
    res.json({ success: true });
  } catch (err) {
    console.error('Error in deleting user:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Update tables data (status etc)
app.put('/api/tables/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const db = await getFullState();

    const table = db.tables.find((t: any) => t.id === id);
    if (table) {
      table.status = status;
      await saveDocument('tables', id, table);
      return res.json({ success: true, table });
    }
    res.status(404).json({ error: 'Table not found' });
  } catch (err) {
    console.error('Error in table status:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/tables', async (req, res) => {
  try {
    const table = req.body;
    const orgCode = (req.headers['x-organisation-code'] as string || 'AHARBY').toUpperCase().trim();
    table.orgCode = orgCode;
    await saveDocument('tables', table.id, table);
    res.status(201).json({ success: true, table });
  } catch (err) {
    console.error('Error creating table:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Update Menu Dish properties
app.put('/api/menu/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const db = await getFullState();

    const item = db.menuItems.find((m: any) => m.id === id);
    if (item) {
      const updatedItem = { ...item, ...updateData };
      await saveDocument('menuItems', id, updatedItem);
      return res.json({ success: true, item: updatedItem });
    }
    res.status(404).json({ error: 'Menu item not found' });
  } catch (err) {
    console.error('Error updating menu:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Add Menu Item
app.post('/api/menu', async (req, res) => {
  try {
    const item = req.body;
    const orgCode = (req.headers['x-organisation-code'] as string || 'AHARBY').toUpperCase().trim();
    item.orgCode = orgCode;
    await saveDocument('menuItems', item.id, item);
    res.status(201).json({ success: true, item });
  } catch (err) {
    console.error('Error adding menu item:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Add/Delete category
app.post('/api/categories', async (req, res) => {
  try {
    const { name } = req.body;
    const orgCode = (req.headers['x-organisation-code'] as string || 'AHARBY').toUpperCase().trim();
    const id = name.replace(/[^a-zA-Z0-9]/g, '_');
    await saveDocument('categories', id, { name, orgCode });
    const db = await getFullState(orgCode);
    res.json({ success: true, categories: db.categories });
  } catch (err) {
    console.error('Error adding category:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.delete('/api/categories/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const orgCode = (req.headers['x-organisation-code'] as string || 'AHARBY').toUpperCase().trim();
    const id = name.replace(/[^a-zA-Z0-9]/g, '_');
    await deleteDocument('categories', id, orgCode);
    const db = await getFullState(orgCode);
    res.json({ success: true, categories: db.categories });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Update Raw materials stock
app.put('/api/materials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentStock, status, category, label } = req.body;
    const db = await getFullState();

    const mat = db.materials.find((m: any) => m.id === id);
    if (mat) {
      const prevStock = mat.currentStock;
      if (currentStock !== undefined) mat.currentStock = currentStock;
      if (status !== undefined) mat.status = status;
      if (category !== undefined) mat.category = category;
      if (label !== undefined) mat.label = label;
      
      await saveDocument('materials', id, mat);
      
      if (currentStock !== undefined && currentStock !== prevStock) {
        await logInventoryEvent(
          id,
          mat.name,
          currentStock < prevStock ? 'ADJUST' : 'RESTOCK',
          Math.abs(currentStock - prevStock),
          mat.unit,
          prevStock,
          currentStock,
          'Manager',
          'Modified via Direct Stock controls'
        );
      }
      return res.json({ success: true, material: mat });
    }
    res.status(404).json({ error: 'Material not found' });
  } catch (err) {
    console.error('Error updating material:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Update Seating Area / Zone, Floor / Level Designation, capacity chair
app.put('/api/tables/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { capacity, zone, floor } = req.body;
    const db = await getFullState();

    const table = db.tables.find((t: any) => t.id === id);
    if (table) {
      if (capacity !== undefined) table.capacity = parseInt(capacity);
      if (zone !== undefined) table.zone = zone;
      if (floor !== undefined) table.floor = floor;
      await saveDocument('tables', id, table);
      return res.json({ success: true, table });
    }
    res.status(404).json({ error: 'Table not found' });
  } catch (err) {
    console.error('Error updating table structure:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Create a new raw material record (with initial history and average price computation)
app.post('/api/materials', async (req, res) => {
  try {
    const material = req.body;
    const orgCode = (req.headers['x-organisation-code'] as string || 'AHARBY').toUpperCase().trim();
    material.orgCode = orgCode;
    if (!material.id) {
      material.id = 'raw_' + Date.now().toString().slice(-6);
    }
    if (!material.priceHistories) {
      material.priceHistories = [];
    }
    if (!material.category) {
      material.category = 'General';
    }
    if (!material.label) {
      material.label = 'Regular';
    }
    await saveDocument('materials', material.id, material);

    // Log the created event
    await logInventoryEvent(
      material.id,
      material.name,
      'CREATE',
      material.currentStock,
      material.unit,
      0,
      material.currentStock,
      'Manager',
      `Registered new raw material item with initial stock of ${material.currentStock} ${material.unit}`,
      orgCode
    );

    res.status(201).json({ success: true, material });
  } catch (err) {
    console.error('Error creating raw material:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Adjust stock level positive or negative manually
app.post('/api/materials/adjust', async (req, res) => {
  try {
    const { id, amount, operator, notes } = req.body;
    if (amount === undefined) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    const db = await getFullState();
    const mat = db.materials.find((m: any) => m.id === id);
    if (!mat) {
      return res.status(404).json({ error: 'Material not found' });
    }

    const prevStock = mat.currentStock;
    const newStock = Math.max(0, prevStock + amount);
    mat.currentStock = newStock;
    
    if (mat.currentStock === 0) mat.status = 'OUT OF STOCK';
    else if (mat.currentStock < 10) mat.status = 'LOW STOCK';
    else mat.status = 'HEALTHY';

    await saveDocument('materials', id, mat);

    const action = amount < 0 ? 'ADJUST' : 'RESTOCK';
    await logInventoryEvent(
      id,
      mat.name,
      action,
      Math.abs(amount),
      mat.unit,
      prevStock,
      newStock,
      operator || 'Staff Member',
      notes || `Stock adjusted by ${amount > 0 ? '+' : ''}${amount} ${mat.unit}`
    );

    res.json({ success: true, material: mat });
  } catch (err) {
    console.error('Error adjusting stock:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Auto restock materials that are low
app.post('/api/materials/restock', async (req, res) => {
  try {
    const db = await getFullState();
    let restockedCount = 0;
    for (const mat of db.materials) {
      if (mat.currentStock < 10) {
        const prevStock = mat.currentStock;
        const addStock = 50 - prevStock;
        if (addStock > 0) {
          mat.currentStock = 50;
          mat.status = 'HEALTHY';
          if (!mat.priceHistories) mat.priceHistories = [];
          
          mat.priceHistories.push({
            date: new Date().toISOString().split('T')[0],
            price: mat.avgPrice || 4.25,
            quantity: addStock
          });
          
          await saveDocument('materials', mat.id, mat);
          await logInventoryEvent(
            mat.id,
            mat.name,
            'RESTOCK',
            addStock,
            mat.unit,
            prevStock,
            50,
            'Auto Restock Bot',
            'Sourced restoration back to healthy base level (50 units)'
          );
          restockedCount++;
        }
      }
    }
    res.json({ success: true, restockedCount });
  } catch (err) {
    console.error('Error restocking:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Get all inventory logs
app.get('/api/materials/logs', async (req, res) => {
  try {
    const orgCode = (req.headers['x-organisation-code'] as string || 'AHARBY').toUpperCase().trim();
    const logs = await getCollectionData('inventoryLogs');
    const filteredLogs = logs.filter((log: any) => log.orgCode && log.orgCode.toUpperCase() === orgCode);
    filteredLogs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(filteredLogs);
  } catch (err) {
    console.error('Error fetching logs:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Delete a raw material altogether instead of decrementing
app.delete('/api/materials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const orgCode = (req.headers['x-organisation-code'] as string || 'AHARBY').toUpperCase().trim();
    const db = await getFullState(orgCode);
    const mat = db.materials.find((m: any) => m.id === id);

    await deleteDocument('materials', id, orgCode);

    if (mat) {
      await logInventoryEvent(
        id,
        mat.name,
        'DELETE',
        0,
        mat.unit,
        mat.currentStock,
        0,
        'Manager',
        `Deleted raw material "${mat.name}" permanently`
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting material:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Promos API
app.post('/api/promos', async (req, res) => {
  try {
    const promo = req.body;
    const orgCode = (req.headers['x-organisation-code'] as string || 'AHARBY').toUpperCase().trim();
    promo.orgCode = orgCode;
    await saveDocument('promoDiscounts', promo.id, promo);
    res.status(201).json({ success: true, promo });
  } catch (err) {
    console.error('Error creating promo:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.put('/api/promos/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getFullState();
    const promo = db.promoDiscounts.find((p: any) => p.id === id);
    if (promo) {
      promo.isActive = !promo.isActive;
      await saveDocument('promoDiscounts', id, promo);
      return res.json({ success: true, promo });
    }
    res.status(404).json({ error: 'Promo not found' });
  } catch (err) {
    console.error('Error toggling promo:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.delete('/api/promos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const orgCode = (req.headers['x-organisation-code'] as string || 'AHARBY').toUpperCase().trim();
    await deleteDocument('promoDiscounts', id, orgCode);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting promo:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Validate organization code & fetch its generic metadata
app.post('/api/organisations/validate', async (req, res) => {
  try {
    const { orgCode } = req.body;
    if (!orgCode) {
      return res.status(400).json({ error: 'Organisation Code is required.' });
    }
    
    const uppercaseCode = orgCode.trim().toUpperCase();
    const organisations = await getCollectionData('organisations');
    
    const matched = organisations.find((org: any) => org.code === uppercaseCode);
    if (matched) {
      return res.json({ exists: true, name: matched.name });
    }
    
    res.json({ exists: false });
  } catch (err) {
    console.error('Error validating organization:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Fetch approved operators for a specific organization code
app.post('/api/organisations/users', async (req, res) => {
  try {
    const { orgCode } = req.body;
    if (!orgCode) {
      return res.status(400).json({ error: 'Organisation Code is required.' });
    }
    
    const uppercaseCode = orgCode.trim().toUpperCase();
    const db = await getFullState();
    
    // Filter APPROVED users assigned to this Specific Tenant Organization
    const matchedUsers = db.users.filter((u: any) => 
      u.orgCode && u.orgCode.toUpperCase() === uppercaseCode && u.status === 'Approved'
    );
    
    res.json({ users: matchedUsers });
  } catch (err) {
    console.error('Error fetching organization users:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Client Onboarding / Register a brand new restaurant organization
app.post('/api/organisations/register', async (req, res) => {
  try {
    // Disabled reqAdminEmail restriction so anyone can register via the new onboarding link
    const { orgCode, name, ownerName, ownerEmail, pin } = req.body;
    
    if (!orgCode || !name || !ownerName || !ownerEmail || !pin) {
      return res.status(400).json({ error: 'All fields are strictly required for onboarding.' });
    }

    if (String(pin).length !== 6) {
      return res.status(400).json({ error: 'POS access PIN must be exactly 6 digits.' });
    }

    const uppercaseCode = orgCode.trim().toUpperCase();
    const organisations = await getCollectionData('organisations');
    
    if (organisations.some((org: any) => org.code === uppercaseCode)) {
      return res.status(450).json({ error: `Organisation Code '${uppercaseCode}' is already registered.` });
    }

    const db = await getFullState();
    const username = ownerName.trim().toLowerCase().replace(/\s+/g, '.');
    if (db.users.some((u: any) => u.orgCode === uppercaseCode && u.username.toLowerCase() === username)) {
      return res.status(400).json({ error: `The supervisor username '${username}' already exists in this organisation. Please choose a different Owner Name.` });
    }

    // Save Organization
    const newOrg = {
      id: uppercaseCode,
      code: uppercaseCode,
      name: name.trim(),
      ownerName: ownerName.trim(),
      ownerEmail: ownerEmail.trim(),
      createdAt: new Date().toISOString()
    };
    await saveDocument('organisations', uppercaseCode, newOrg);

    // Save initial approved Manager user linked to this Organization
    const managerUser = {
      id: String(Date.now()),
      name: ownerName.trim(),
      username,
      email: ownerEmail.trim(),
      role: 'Manager',
      pin: String(pin),
      avatar: 'manage_accounts',
      status: 'Approved',
      orgCode: uppercaseCode
    };
    await saveDocument('users', managerUser.id, managerUser);

    // Automagically register Arpit Tripathi as administrative supporting Manager for this new restaurant 
    const arpitUser = {
      id: `arpit_${uppercaseCode}`,
      name: "Arpit Tripathi (Admin)",
      username: "arpit.tripathi",
      email: "arpittripathi2007@gmail.com",
      role: 'Manager',
      pin: "999999",
      avatar: 'manage_accounts',
      status: 'Approved',
      orgCode: uppercaseCode
    };
    await saveDocument('users', arpitUser.id, arpitUser);

    res.status(201).json({ 
      success: true, 
      organisation: newOrg,
      user: managerUser
    });
  } catch (err) {
    console.error('Organization onboarding error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET list of all onboarded organizations and their managers
app.get('/api/organisations-list', async (req, res) => {
  try {
    const organisations = await getCollectionData('organisations');
    const db = await getFullState();
    
    const orgsList = organisations.map((org: any) => {
      const orgUsers = db.users.filter((u: any) => u.orgCode && u.orgCode.toUpperCase() === org.code.toUpperCase());
      return {
        ...org,
        users: orgUsers
      };
    });
    
    res.json({ success: true, organisations: orgsList });
  } catch (err) {
    console.error('Error fetching organisations list:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST to update any tenant user pin
app.post('/api/organisations/update-user-pin', async (req, res) => {
  try {
    const { userId, newPin } = req.body;
    if (!userId || !newPin || String(newPin).length !== 6) {
      return res.status(400).json({ error: 'User ID and a 6-digit PIN are required.' });
    }
    
    const db = await getFullState();
    const user = db.users.find((u: any) => u.id === userId || u._docId === userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    user.pin = String(newPin);
    
    const docId = user._docId || user.id;
    let cleanDocId = docId;
    if (user.orgCode && docId.startsWith(`${user.orgCode}_`)) {
      cleanDocId = docId.substring(user.orgCode.length + 1);
    }
    
    await saveDocument('users', cleanDocId, {
      ...user,
      id: cleanDocId
    });
    
    res.json({ success: true, message: 'User PIN updated successfully!' });
  } catch (err) {
    console.error('Error updating member PIN:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Assemble Vite dev middleware or static bundles
async function startServer() {
  // Bootstrap & Seed database if is completely empty on startup
  try {
    await seedDatabaseIfEmpty();
  } catch (err) {
    console.error('Failed to auto-seed database on start:', err);
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aahar Fullstack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
