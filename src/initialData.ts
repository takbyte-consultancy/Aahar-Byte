/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MenuItem, TableInfo, RawMaterial, Order, PromoDiscount } from './types';

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: 'avocadoSalmonSalad',
    name: 'Avocado Salmon Salad',
    category: 'Starters',
    price: 18.50,
    stock: 50,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBYBL2_ElonCpdxrzwuArpCUJRla4GKTqgAFzI9eoFIcdL4o1T563PSZMJTTNo-ptyYOZ2S3MC9uLf_EJacgHrSCJkuZCcB4rV0P3MnkaXLcBdSRcNTVnlsyufAZyA-YCDVZXLsoVBCizcP40eAPfczhLAokytu79dFZ0ctYIHlKcGzs72GQzLxIrv1uK581wd0ouBOplGv7PVV2-rQX3-z0nTMy_lwxyQ5N52XWFWT7eLwtDE1CTnNVHZQCHHHBOJIIOFUrqfxNhPL',
    description: 'Fresh salmon greens featuring sliced avocados and grilled salmon on a soft balsamic reduction.',
    tags: ['Popular', 'Chef\'s Choice'],
    isAvailable: true,
    discountPercentage: 10
  },
  {
    id: 'truffleArancini',
    name: 'Truffle Arancini',
    category: 'Starters',
    price: 16.00,
    stock: 35,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmtummpRoR9-fqDFh3reybJvIInAyHwGnGQAL3RXHyApkhMD-Nm5rr4T9eBEOqvcBg7WbsLnUa4GN4Dj398ACW3VECZZt-BzpzGZlRYJfhqEK2rbQbZpXjStJVtw3kvV4zPHE4GY3HmJEHFMu8vadJyggA_ZybWPspTG5A3FgbTB51vwBK8mFLsJud_ja8xl013Rplkhp7SfN5ipLrh7rXLffkc0ezH8K2iDGC5MeRyTsvPLUR0S-X4UArk29ZNew0ioPP1jGVP5uA',
    description: 'Crispy risotto balls, wild forest mushrooms, creamy truffle aioli infusion.',
    tags: ['Chef\'s Choice'],
    isAvailable: true,
    discountPercentage: 15
  },
  {
    id: 'seasonalGardenGreens',
    name: 'Seasonal Garden Greens',
    category: 'Starters',
    price: 14.00,
    stock: 45,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDk3DG6dCQzIwSvvTP74g4cJzxCBgAGlQWiSQJbxQBm6hhB9ngOWqn2m1TaoLpg9NJScxRI18TPWOUGsfHfM52id3iSKJ42DJLNxkqlN3UcWF5BELv9iUj-Xo7NkW5rS-M-qDrjA7_0c9Desxph0-QE0MJVtA8qild7R-GRdx_wrFU5THo--bP66INgFmBcKdHptG1Po2az1ET7j2EGBObZyt6RhDch9y8CfIl9aSQVXb7kOm9I1HtXK7roNIgegN11xrYzYCkWDdC1',
    description: 'Organic field leaves, heirloom radishes, local orange citrus vinaigrette drizzle.',
    tags: ['Organic', 'Vegan'],
    isAvailable: true
  },
  {
    id: 'crispyVegSamosas',
    name: 'Crispy Vegetable Samosas',
    category: 'Starters',
    price: 12.50,
    stock: 60,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJcYQDuik_sS7F7aBH79z0V4mNfwXauegQ_yp25E4PVJVTdn1kgTmZIImejLVsYQrVH81wp-hvJel0txbB_v9kYXR_him-K_Tj2pYKJdVxmfx8twXASgEM_v1ZSyDdcl4oP4uqHRNi2Oy62uINS_sRJglFXRSxrnXQFjQ5Tcu-VYSeAgO0T5pf4BZWHBAF0kCC09c7XOE4IlR576H894g1yF5AFTU798LuepEGat5fi2tmLWYOf_lofU2JZ6aKaSuvwoF7GmFLqztO',
    description: 'Traditional hand-folded golden pastry filled with spiced potatoes, green peas and fresh herbs.',
    tags: ['Vegan', 'Chef\'s Choice'],
    isAvailable: true
  },
  {
    id: 'honeyGlazedTenders',
    name: 'Honey Glazed Tenders',
    category: 'Starters',
    price: 14.00,
    stock: 28,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNMPvtBtVEBSf8QdD1LC5cGkMxq-iadvNOf3tG9y3vfhzoY0ncbrH0PdCMkoE76lJpn0ZIOCTdJw7LMJuizZ2-m-mKegGDxNybc1RNHWIYbGWrJkMbsA2jv8hqOInM6yqdcOkWEQ2PCIRWidiUNHVwWOUAskVzRm9WgkF-IeI9Gn_EBRCEyjzPN70t8Hng3EBA9OvqV6rokunGx5sfJZf0r4e2pCxM2CWkuJYvSRn4KG-DCs1a3aDKf8fTgD2OmBAsauR2ihOFUA05',
    description: 'Twice-fried golden chicken tossed supreme in organic raw honey and sesame seed mixture.',
    tags: ['Popular'],
    isAvailable: true
  },
  {
    id: 'signatureBuddhaBowl',
    name: 'Signature Buddha Bowl',
    category: 'Mains',
    price: 18.95,
    stock: 30,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCC0AIb1jrAzgKM3PrabeyLM6S_VqjbCm6DHAroPhl2ed6-AlisTpGuEUQ2WXD0guttWxmhcLnhhSSpwW_KzeXTAXRbR9JXbqwdGFlNmQk_GNaYhUOra3dvN8QUeplH_62pmFZqfp1Y4_blFI2Qr3PGKcCJPvzki2E89A4L_Wm49IKYZg9P8L-nbFp4PL0afVmNnbI9CiSZXxThKlQ3XpursVe4EfL9QOMxV5Ok1s3ZHjTRAQE50EBxgKxBtBI65S_87-0lbIXMfptt',
    description: 'Nutrient-rich power bowl with quinoa, sliced avocado, organic edamame and sesame glaze.',
    tags: ['Healthy', 'Vegan'],
    isAvailable: true
  },
  {
    id: 'signatureWagyuBurger',
    name: 'Signature Wagyu Burger',
    category: 'Mains',
    price: 24.00,
    stock: 24,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDi97JIldammxwIRED1jpv8rgDZ_mz0BbDIznEFekxypskMJZNkZ1enasKielzEdsyFiRO_N-Wzlm5EAvyNymnrUiphWK3MZ8ZKOgbSPVeWGBa8VAGZ97d-aPRWXwWiay1yC8garzU4DIGiRAJ97OFeeQ2q8wQZC_NTti73E9d89lOebxmHzxXSt5cPjkFKYvewWNI9ulk8q3qzFy0NlSMhVMS67NddHu2X7-_Nn0aosEZgOxJa_ylM0-BMcvSvvksRWHE3e7UZ-Zo_',
    description: 'Gourmet wagyu beef burger served on toasted brioche with melting aged cheddar cheese.',
    tags: ['Popular', 'Chef\'s Choice'],
    isAvailable: true
  },
  {
    id: 'balsamicGlazedRibs',
    name: 'Balsamic Glazed Ribs',
    category: 'Mains',
    price: 28.00,
    stock: 18,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATbRs2Cr7WJjHhiJytkeB574Cnir3vaIKnrReEcO3_b30JsAwUw3FPmnVoVsIaLx389np-LEEPHXtN1E-u8bT1aIXCTxQVyrMbxeOtRZSSoAmJvlwEHWYY8OzQQsaKcBZcjBPC6gU5F0In--fyd79gkLxWlJkNDaV6BKNPLyZlcSgYLMkhVvdqgSJpvumHD9TSzwc3exglerc1l-BIx506vjpTfmugSbuzD_WRYumsi7G9wfpd3g6rwtlVhI1xi9Uvs_ecdA_ZD13a',
    description: 'Tender bbq rack of ribs finished with a rich glossy balsamic reduction glaze, served with rustic skin-on fries.',
    tags: ['Popular'],
    isAvailable: true
  },
  {
    id: 'braisedRibs48h',
    name: '48-Hour Braised Ribs',
    category: 'Mains',
    price: 38.00,
    stock: 15,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC2pUiltPUvjMj1C5IHNFzBFrDXeb1z_YYTg9DhmM-iTQl7Ey5wGEfSvjLBiAPAt4vi0t33YgBj2cpPy8DbFFPog2R04hVH99RNJwhYxity4txu0iacJ0p_xGgJRSktlMQ4OAaeA_WuQ3nQrqi7RXiH4ajIsbtHQRuPBmMgb-2LZrXKggmgXHJyOZX1DJPjrnMgauu0I_0x6EipRu5Q-TEeYZCdhbXn18A-E8af3-AS3EEj-V6JxirZBKaipJ79SEDpcfBZOiG9vfzl',
    description: '48-Hour slow cooked short ribs with black garlic reduction, parsnip purée and crispy leeks.',
    tags: ['Chef\'s Choice'],
    isAvailable: true
  },
  {
    id: 'pizzaMargherita',
    name: 'Margherita Pizza',
    category: 'Mains',
    price: 21.00,
    stock: 40,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYhsWMeKE7wdDTjgOdMxEDA05VUmEzB_tvhTM_LlenVtDGCIH9H8qx-b6sh9zdTM-3SlxRG4RzlWNNENoRDl_IQe203K2ch_djwxTTG5tYCR6JEwVccb7SpP3NHTr9KpEcPSrYClVANdPPuCr7bSBXHn0fuOD8PxYO6uIgNA5cTTC9vvC47-DtfV5HJ2XHFpzq7iC9iOv3y5cI6b4w-Z-ed-xr23EkmUzgcw0Q4bwy-uVOKpRdmsjdfPmjNcgJhztt5b11pfUywuI4',
    description: 'Gourmet hand-stretched sourdough pizza base, fresh buffalo mozzarella, aromatic basil leaf and rich rustic tomato jam.',
    tags: ['Classic'],
    isAvailable: true
  },
  {
    id: 'moltenLavaCake',
    name: 'Molten Lava Cake',
    category: 'Desserts',
    price: 12.00,
    stock: 12,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQ72jnPLX3GnexYh7CbYiupw2soo99q6BP_9ETIAP_rQCBGmArSeYMIWdc2k__hVmZqr58yj7VrqZPrh-1A0IpoNGpGAx3AzXadoXYwaCYSqONnyJtoYg4XDVFDxr4na2Qbfeco2-u99UStb7Hq4sDhzJgRcCwkAxez2JVWJsnaXA34CfvUJSZ9oZrKhrc1Jid-4eDJMgPlOCEpuO1HFzVBefFy73yZyVf_On2N8iDeGFfRhRNuVYqrxPKNWGXn_KYVCiCsC2e4H1g',
    description: 'Decadent dark chocolate sponge cake with a rich molten center, dusted in sugar snow, finished with a fresh raspberry.',
    tags: ['Classic', 'Popular'],
    isAvailable: true
  },
  {
    id: 'aaharSignatureSour',
    name: 'Aahar Signature Sour',
    category: 'Drinks',
    price: 15.00,
    stock: 99,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCghkUP6vnbiEPiMx4K-Wz6e4S_3QlTpW3H35HBFsVxUkcXwGKzzjDV48SgTj_XtfO39mS9GSRYuUDNoW2kz2tfapWT6T4TjXisZfWNc_i59tc4FX_6Vu4uofOm-0G-4i8ITsDWWm4HZZLEqCP_KxVDDDCnxtV9ouFR89ve25LY8buYMLKL1z2GqKNTmIOPIYDbL0ND9M7S1vNgfn5w4sQeKvsK4LyCvmiNdY6ghIVSVT-c6vgXV3-C_1wclc-EtMYiqoefWpAmCU0F',
    description: 'Sophisticated handcrafted mocktail featuring sunset citrus blend, rosemary aromatic cloud and dried orange disc.',
    tags: ['Signature'],
    isAvailable: true
  }
];

export const INITIAL_TABLES: TableInfo[] = [
  { id: '01', capacity: 4, zone: 'Main Floor', status: 'Available', floor: 'Ground Floor' },
  { id: '02', capacity: 2, zone: 'Window', status: 'Occupied', floor: 'Ground Floor' },
  { id: '03', capacity: 6, zone: 'Booth', status: 'Available', floor: 'Ground Floor' },
  { id: '04', capacity: 4, zone: 'Main Floor', status: 'Reserved', floor: 'Ground Floor' },
  { id: '05', capacity: 8, zone: 'VIP Area', status: 'Available', floor: '1st Floor' },
  { id: '06', capacity: 2, zone: 'Bar', status: 'Occupied', floor: 'Ground Floor' },
  { id: '07', capacity: 4, zone: 'Patio', status: 'Available', floor: 'Outdoor Garden' },
  { id: '08', capacity: 4, zone: 'Patio', status: 'Available', floor: 'Outdoor Garden' },
];

export const INITIAL_RAW_MATERIALS: RawMaterial[] = [
  { id: 'raw01', name: 'Brioche Buns', unit: 'pcs', currentStock: 420, status: 'HEALTHY', icon: 'bakery_dining' },
  { id: 'raw02', name: 'Arabica Beans', unit: 'kg', currentStock: 4.2, status: 'LOW STOCK', icon: 'local_cafe' },
  { id: 'raw03', name: 'Whole Milk', unit: 'liters', currentStock: 85, status: 'HEALTHY', icon: 'opacity' },
  { id: 'raw04', name: 'Organic Eggs', unit: 'pcs', currentStock: 0, status: 'OUT OF STOCK', icon: 'egg' }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: '8429',
    tableRef: 'Table 12',
    timestamp: new Date(Date.now() - 12 * 60000), // 12 mins ago
    status: 'Pending',
    dineIn: true,
    waitstaff: 'Sarah M.',
    items: [
      {
        id: 'av_1',
        menuItem: INITIAL_MENU_ITEMS[0], // Avocado Salmon Salad
        quantity: 1,
        customization: 'Extra Balsamic'
      },
      {
        id: 'tr_2',
        menuItem: {
          id: 'truffleRisottoStub',
          name: 'Truffle Risotto',
          category: 'Mains',
          price: 26.00,
          stock: 12,
          image: '',
          description: '',
          tags: [],
          isAvailable: true
        },
        quantity: 2,
        customization: 'Gluten Free'
      },
      {
        id: 'sc_1',
        menuItem: {
          id: 'scallopsStub',
          name: 'Pan Seared Scallops',
          category: 'Mains',
          price: 34.00,
          stock: 8,
          image: '',
          description: '',
          tags: [],
          isAvailable: true
        },
        quantity: 1,
      },
      {
        id: 'pin_1',
        menuItem: {
          id: 'pinotNoirStub',
          name: 'Pinot Noir (Glass)',
          category: 'Drinks',
          price: 12.00,
          stock: 200,
          image: '',
          description: '',
          tags: [],
          isAvailable: true
        },
        quantity: 2,
      }
    ],
    subtotal: 128.00,
    discountRate: 0.10, // 10% VIP
    taxRate: 0.075, // 7.5%
    total: 124.50
  },
  {
    id: '8428',
    tableRef: 'Table 05',
    timestamp: new Date(Date.now() - 24 * 60000), // 24 mins ago
    status: 'Action Required',
    dineIn: true,
    waitstaff: 'James K.',
    items: [
      {
        id: 'sal_1',
        menuItem: {
          id: 'salmonGrillStub',
          name: 'Salmon Grill',
          category: 'Mains',
          price: 28.00,
          stock: 10,
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARCv7PuNWMOEsMfnuSbSdrsgpja8PtKO7RQp-qfW19v5rwgKJ38EZKREfn8zMZQKSCx7itJZ_rhjySvP4kWZ3gkSYyE_SXRm9qPosZx5V-e-CyDo3VweVo3gaaOETN7cEsIDvWUTzX3bR_e_qS_vbyXYpDT8Vimm-KIkLkLxTSYG9wMn2LkjmarMEHGejhGNloHEiHTlOgsgtpIVSmkQvHUejsACS7bIrZm6TJBuojViQ2ozGfZfz9uYrRbbk90fcKX67FPWPYOn0n',
          description: 'Premium grilled salmon.',
          tags: [],
          isAvailable: true
        },
        quantity: 2,
        customization: 'Medium Rare'
      }
    ],
    subtotal: 96.00,
    discountRate: 0.10,
    taxRate: 0.075,
    total: 89.20
  },
  {
    id: '8430',
    tableRef: 'Table 21',
    timestamp: new Date(Date.now() - 4 * 60000), // 4 mins ago
    status: 'Ready',
    dineIn: true,
    waitstaff: 'Sarah M.',
    items: [
      {
        id: 'piz_1',
        menuItem: {
          id: 'margheritaStub',
          name: 'Margherita Pizza',
          price: 26.00,
          category: 'Mains',
          stock: 30, image: '', description: '', tags: [], isAvailable: true
        },
        quantity: 5,
        customization: 'Extra Cheese'
      }
    ],
    subtotal: 160.00,
    discountRate: 0.05,
    taxRate: 0.075,
    total: 156.00
  },
  {
    id: '8425',
    tableRef: 'Bar 02',
    timestamp: new Date(Date.now() - 45 * 60000), // 45 mins ago
    status: 'Delayed',
    dineIn: true,
    waitstaff: 'James K.',
    items: [
      {
        id: 'cock_1',
        menuItem: {
          id: 'cocktailSet',
          name: 'Cocktail Set',
          price: 16.00,
          category: 'Drinks',
          stock: 60, image: '', description: '', tags: [], isAvailable: true
        },
        quantity: 4,
      }
    ],
    subtotal: 64.00,
    discountRate: 0.0,
    taxRate: 0.0,
    total: 64.00
  }
];

export const INITIAL_PROMO_DISCOUNTS: PromoDiscount[] = [
  { id: '1', code: 'WELCOME10', type: 'Percentage', value: 10, isActive: true },
  { id: '2', code: 'DINEVIP20', type: 'Percentage', value: 20, isActive: true, minSpend: 50 },
  { id: '3', code: 'FLAT15', type: 'Fixed', value: 15, isActive: true, minSpend: 40 }
];

