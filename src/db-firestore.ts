/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  writeBatch,
  query,
  where
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

let dbInstance: any = null;

// Lazy initialization of Firebase Firestore
export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('firebase-applet-config.json not found in root. Run set_up_firebase first.');
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to parse firebase-applet-config.json: ${(error as Error).message}`);
  }

  if (!config.projectId || !config.apiKey) {
    throw new Error('Invalid firebase-applet-config.json configuration. Missing project ID or API key.');
  }

  const firebaseConfig = {
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId
  };

  const app = initializeApp(firebaseConfig);
  
  // Connect to custom Firestore database ID specified in config
  dbInstance = initializeFirestore(app, {}, config.firestoreDatabaseId || '(default)');

  return dbInstance;
}

// Low-level helper to fetch all documents in a collection
export async function getCollectionData(collectionName: string): Promise<any[]> {
  try {
    const db = getDb();
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    const list: any[] = [];
    snap.forEach((docSnapshot) => {
      list.push({
        ...docSnapshot.data(),
        _docId: docSnapshot.id
      });
    });
    return list;
  } catch (error) {
    console.error(`Firestore getCollectionData error on collection ${collectionName}:`, error);
    throw error;
  }
}

// Low-level helper to save a specific document
export async function saveDocument(collectionName: string, docId: string, data: any): Promise<void> {
  try {
    const db = getDb();
    let finalDocId = docId;
    // Auto-scope document ID by orgCode prefix for clean multi-tenant isolation
    if (data && data.orgCode && !docId.startsWith(`${data.orgCode}_`)) {
      finalDocId = `${data.orgCode}_${docId}`;
    }
    const docRef = doc(db, collectionName, finalDocId);
    await setDoc(docRef, data);
  } catch (error) {
    console.error(`Firestore saveDocument error on collection ${collectionName}, ID ${docId}:`, error);
    throw error;
  }
}

// Low-level helper to delete a specific document
export async function deleteDocument(collectionName: string, docId: string, orgCode?: string): Promise<void> {
  try {
    const db = getDb();
    let finalDocId = docId;
    if (orgCode && !docId.startsWith(`${orgCode}_`)) {
      finalDocId = `${orgCode}_${docId}`;
    }
    const docRef = doc(db, collectionName, finalDocId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Firestore deleteDocument error on collection ${collectionName}, ID ${docId}:`, error);
    throw error;
  }
}

// Seed all screens and tables for any organization
export async function seedOrganisation(orgCode: string): Promise<void> {
  const uppercaseOrg = orgCode.trim().toUpperCase();
  if (!uppercaseOrg) return;

  try {
    const db = getDb();
    const data = loadTemplateDb();

    console.log(`--- SEEDING ORGANISATION: ${uppercaseOrg} ---`);

    // 1. Seed Menu Items
    const menuRef = collection(db, 'menuItems');
    for (const m of data.menuItems) {
      const docId = `${uppercaseOrg}_${m.id}`;
      await setDoc(doc(menuRef, docId), { ...m, orgCode: uppercaseOrg });
    }

    // 2. Seed Tables
    const tablesRef = collection(db, 'tables');
    for (const t of data.tables) {
      const docId = `${uppercaseOrg}_${t.id}`;
      await setDoc(doc(tablesRef, docId), { ...t, orgCode: uppercaseOrg });
    }

    // 3. Seed Materials (Inventory)
    const materialsRef = collection(db, 'materials');
    for (const mat of data.materials) {
      const docId = `${uppercaseOrg}_${mat.id}`;
      await setDoc(doc(materialsRef, docId), { ...mat, orgCode: uppercaseOrg });
    }

    // 4. Seed Promo Discounts
    const promosRef = collection(db, 'promoDiscounts');
    for (const p of data.promoDiscounts) {
      const docId = `${uppercaseOrg}_${p.id}`;
      await setDoc(doc(promosRef, docId), { ...p, orgCode: uppercaseOrg });
    }

    // 5. Seed Categories
    const categoriesRef = collection(db, 'categories');
    const categoryList = data.categories || ['Starters', 'Mains', 'Desserts', 'Drinks', 'Bakery'];
    for (const c of categoryList) {
      const catId = c.replace(/[^a-zA-Z0-9]/g, '_');
      const docId = `${uppercaseOrg}_${catId}`;
      await setDoc(doc(categoriesRef, docId), { name: c, orgCode: uppercaseOrg });
    }

    // 6. Seed Orders (Analytical Dashboard / POS History)
    const ordersRef = collection(db, 'orders');
    for (const o of data.orders) {
      const docId = `${uppercaseOrg}_${o.id}`;
      await setDoc(doc(ordersRef, docId), { ...o, id: docId, orgCode: uppercaseOrg });
    }

    // 7. Seed Customers (Client profiles and contacts)
    const customersRef = collection(db, 'customers');
    if (data.customers) {
      for (const cust of data.customers) {
        const docId = `${uppercaseOrg}_${cust.id}`;
        await setDoc(doc(customersRef, docId), { ...cust, orgCode: uppercaseOrg });
      }
    }

    // 8. Seed team personnel profiles
    const userRef = collection(db, 'users');
    for (const u of data.users) {
      const docId = `${uppercaseOrg}_${u.id}`;
      const username = `${uppercaseOrg.toLowerCase()}.${u.username}`;
      const email = u.email ? `${uppercaseOrg.toLowerCase()}.${u.email}` : '';
      await setDoc(doc(userRef, docId), { 
        ...u, 
        id: docId, 
        username, 
        email, 
        orgCode: uppercaseOrg 
      });
    }

    console.log(`--- SEEDING ORGANISATION: ${uppercaseOrg} COMPLETED SUCCESSFULLY ---`);
  } catch (error) {
    console.error(`Error in seedOrganisation for ${uppercaseOrg}:`, error);
  }
}

// Load current local json db as a template
function loadTemplateDb() {
  const templatePath = path.join(process.cwd(), 'src', 'db.json');
  if (fs.existsSync(templatePath)) {
    try {
      const data = fs.readFileSync(templatePath, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Error reading src/db.json template:', err);
    }
  }
  return { users: [], menuItems: [], tables: [], materials: [], promoDiscounts: [], categories: [], orders: [] };
}

// Self-healing database check & seed on boot
export async function seedDatabaseIfEmpty(): Promise<void> {
  try {
    const db = getDb();
    
    // Check if menuItems already exist
    const menuRef = collection(db, 'menuItems');
    const menuSnap = await getDocs(menuRef);
    
    if (menuSnap.empty) {
      console.log('--- FIRESTORE SEED TRIGGERED: DATABASE IS EMPTY ---');
      const data = loadTemplateDb();
      
      // Batch-seed Organisations
      const orgRef = collection(db, 'organisations');
      await setDoc(doc(orgRef, 'AHARBY'), {
        id: 'AHARBY',
        code: 'AHARBY',
        name: 'Aahar Byte Headquarters',
        ownerName: 'Michelle Vance',
        ownerEmail: 'michelle.v@restaurant.com',
        createdAt: new Date().toISOString()
      });

      // Batch-seed Users
      const userRef = collection(db, 'users');
      for (const u of data.users) {
        await setDoc(doc(userRef, u.id), { ...u, orgCode: u.orgCode || 'AHARBY' });
      }
      
      // Batch-seed MenuItems
      for (const m of data.menuItems) {
        await setDoc(doc(menuRef, m.id), { ...m, orgCode: 'AHARBY' });
      }
      
      // Batch-seed Tables
      const tablesRef = collection(db, 'tables');
      for (const t of data.tables) {
        await setDoc(doc(tablesRef, t.id), { ...t, orgCode: 'AHARBY' });
      }
      
      // Batch-seed Materials
      const materialsRef = collection(db, 'materials');
      for (const mat of data.materials) {
        await setDoc(doc(materialsRef, mat.id), { ...mat, orgCode: 'AHARBY' });
      }
      
      // Batch-seed PromoDiscounts
      const promosRef = collection(db, 'promoDiscounts');
      for (const p of data.promoDiscounts) {
        await setDoc(doc(promosRef, p.id), { ...p, orgCode: 'AHARBY' });
      }
      
      // Batch-seed Categories
      const categoriesRef = collection(db, 'categories');
      const categoryList = data.categories || ['Starters', 'Mains', 'Desserts', 'Drinks', 'Bakery'];
      for (const c of categoryList) {
        // ID clean
        const id = c.replace(/[^a-zA-Z0-9]/g, '_');
        await setDoc(doc(categoriesRef, id), { name: c, orgCode: 'AHARBY' });
      }
      
      // Batch-seed Orders
      const ordersRef = collection(db, 'orders');
      for (const o of data.orders) {
        await setDoc(doc(ordersRef, o.id), { ...o, orgCode: 'AHARBY' });
      }
      
      console.log('--- FIRESTORE SEED HAS FINISHED SUCCESSFULLY ---');
    } else {
      console.log('--- FIRESTORE DATA PRESENT: SEED BYPASSED ---');
    }

    // --- SUPPLEMENTAL HEALING: Ensure AHARBY Organization & Standard Users exist ---
    const orgRef = collection(db, 'organisations');
    const orgDoc = await getDoc(doc(orgRef, 'AHARBY'));
    if (!orgDoc.exists()) {
      console.log('--- Supplemental Seeding: seeding AHARBY organization ---');
      await setDoc(doc(orgRef, 'AHARBY'), {
        id: 'AHARBY',
        code: 'AHARBY',
        name: 'Aahar Byte Headquarters',
        ownerName: 'Michelle Vance',
        ownerEmail: 'michelle.v@restaurant.com',
        createdAt: new Date().toISOString()
      });
    }

    const userRef = collection(db, 'users');
    const data = loadTemplateDb();
    for (const u of data.users) {
      const uDoc = await getDoc(doc(userRef, u.id));
      if (!uDoc.exists()) {
        console.log(`--- Supplemental Seeding: seeding user ID ${u.id} (${u.name}) ---`);
        await setDoc(doc(userRef, u.id), { ...u, orgCode: u.orgCode || 'AHARBY' });
      }
    }
  } catch (error) {
    console.error('Firestore seeding encountered an error:', error);
  }
}

// Internal helper to deduplicate documents, favoring properly prefixed scoped document records 
function deduplicateScope(items: any[], orgCode: string) {
  const map = new Map<string, any>();
  const prefix = orgCode ? `${orgCode.toUpperCase()}_` : '';
  for (const item of items) {
    const key = item.id;
    if (!key) continue;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, item);
    } else {
      const currentIsPrefixed = item._docId && item._docId.startsWith(prefix);
      const existingIsPrefixed = existing._docId && existing._docId.startsWith(prefix);
      if (currentIsPrefixed && !existingIsPrefixed) {
        map.set(key, item);
      }
    }
  }
  return Array.from(map.values());
}

// Assemble full state resembling db.json
export async function getFullState(orgCode?: string) {
  try {
    const [
      users,
      menuItems,
      tables,
      materials,
      promoDiscounts,
      categoriesData,
      orders,
      customers
    ] = await Promise.all([
      getCollectionData('users'),
      getCollectionData('menuItems'),
      getCollectionData('tables'),
      getCollectionData('materials'),
      getCollectionData('promoDiscounts'),
      getCollectionData('categories'),
      getCollectionData('orders'),
      getCollectionData('customers').catch(() => [])
    ]);

    const uppercaseOrg = orgCode ? orgCode.trim().toUpperCase() : '';

    const filteredUsers = uppercaseOrg ? users.filter(u => u.orgCode && u.orgCode.toUpperCase() === uppercaseOrg) : users;
    const filteredMenuItems = uppercaseOrg ? menuItems.filter(m => m.orgCode && m.orgCode.toUpperCase() === uppercaseOrg) : menuItems;
    const filteredTables = uppercaseOrg ? tables.filter(t => t.orgCode && t.orgCode.toUpperCase() === uppercaseOrg) : tables;
    const filteredMaterials = uppercaseOrg ? materials.filter(m => m.orgCode && m.orgCode.toUpperCase() === uppercaseOrg) : materials;
    const filteredPromos = uppercaseOrg ? promoDiscounts.filter(p => p.orgCode && p.orgCode.toUpperCase() === uppercaseOrg) : promoDiscounts;
    const filteredCategories = uppercaseOrg ? categoriesData.filter(c => c.orgCode && c.orgCode.toUpperCase() === uppercaseOrg) : categoriesData;
    const filteredOrders = uppercaseOrg ? orders.filter(o => o.orgCode && o.orgCode.toUpperCase() === uppercaseOrg) : orders;
    const filteredCustomers = uppercaseOrg ? customers.filter(c => c.orgCode && c.orgCode.toUpperCase() === uppercaseOrg) : customers;

    // Format categories to string list as expected by front-end
    const categoriesList = deduplicateScope(filteredCategories, uppercaseOrg).map(c => c.name);

    return {
      users: deduplicateScope(filteredUsers, uppercaseOrg),
      menuItems: deduplicateScope(filteredMenuItems, uppercaseOrg),
      tables: deduplicateScope(filteredTables, uppercaseOrg),
      materials: deduplicateScope(filteredMaterials, uppercaseOrg),
      promoDiscounts: deduplicateScope(filteredPromos, uppercaseOrg),
      categories: categoriesList.length > 0 ? categoriesList : ['Starters', 'Mains', 'Desserts', 'Drinks', 'Bakery'],
      orders: deduplicateScope(filteredOrders, uppercaseOrg),
      customers: deduplicateScope(filteredCustomers, uppercaseOrg)
    };
  } catch (error) {
    console.error('Failed to crawl Firestore entire state:', error);
    // Return fallback draft
    return loadTemplateDb();
  }
}
