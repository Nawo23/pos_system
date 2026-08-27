# ⚡ Ishan Electrics — POS & Inventory Management System

A modern, full-stack **Point of Sale (POS)** and **Inventory Management System** built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS**, **Prisma ORM 7**, and **Supabase**.

---

## 🌟 Key Features

### 🛒 Point of Sale (POS) Terminal
- **Interactive Product Grid**: Visual product browser with image thumbnails, categories, search, and stock indicators.
- **Barcode Scanning**: Supports hardware USB barcode scanners as well as live camera scanning using `html5-qrcode`.
- **Live Cart & Totaling**: Instant subtotal, discount, and total calculation with quantity controls.
- **Customer Integration**: Instant phone number lookup, quick customer registration during checkout, and automatic regular customer discount calculation.
- **Multi-Method Checkout**: Cash, Card, and Bank Transfer support.

### 📦 Product & Stock Management
- **Catalog Management**: Add, edit, and soft-delete products with unit prices, cost prices, stock quantities, and low stock alert thresholds.
- **Image Uploads**: Integrated image uploading via Supabase Storage.
- **Stock Status Toggle**: Mark items as *In Stock* or *Out of Stock* with one click.
- **Barcode & SKU Generation**: Auto-generates unique CODE128 barcodes and SKUs.
- **Categories**: Dynamic product categorization.

### 🚚 Inventory & GRN (Goods Received Notes)
- **Stock Movements**: Full audit log for `STOCK_IN`, `SALE`, and `ADJUSTMENT` transactions.
- **GRN Processing**: Create Goods Received Notes attached to suppliers to restock products efficiently.
- **Low Stock Alerts**: Dedicated alert screen identifying items below minimum thresholds.

### 📊 Reports & Analytics
- **Performance Dashboards**: View revenue, profit/loss, cost of goods sold, and total order volume across Daily, Weekly, Monthly, and Yearly periods.
- **Top Products & Insights**: Analyze top-performing items and low-stock risks.
- **Transaction Logs**: Detailed order history and invoice lookup.

### 🧾 Thermal Receipt Printing
- **80mm Receipt Formatting**: Clean, thermal-printer-optimized receipt layout.
- **Barcode Integration**: Dynamic barcode rendering on receipts via `JsBarcode`.
- **Shop Branding**: Customizable shop info via `src/lib/shopInfo.ts`.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Actions)
- **UI & Styling**: React 19, Tailwind CSS v4, Lucide Icons
- **Database & ORM**: PostgreSQL, [Prisma ORM v7](https://www.prisma.io/)
- **Authentication & Storage**: [Supabase Auth](https://supabase.com/auth) & Supabase Storage
- **Barcode & Scanners**: `jsbarcode`, `html5-qrcode`

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 20+
- PostgreSQL database (e.g. Supabase Postgres)

### 2. Environment Variables
Create a `.env` file in the root directory:

```env
# Database Connections
DATABASE_URL="postgresql://user:password@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/postgres"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-supabase-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### 3. Installation & Setup

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Push database schema
npx prisma db push

# (Optional) Seed initial data
npx prisma db seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Folder Structure

```
pos-system/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed data script
├── src/
│   ├── app/
│   │   ├── actions/        # Server actions (sales, products, reports, etc.)
│   │   ├── admin/          # Admin portal routes (dashboard, pos, inventory, products, etc.)
│   │   ├── pos/            # Cashier standalone POS terminal
│   │   ├── receipt/        # Thermal receipt page & print controls
│   │   └── login/          # Auth screen
│   ├── components/         # Reusable UI components & sidebar
│   ├── lib/
│   │   ├── prisma.ts       # Prisma Client instance
│   │   ├── shopInfo.ts     # Shop header details for receipts
│   │   └── supabase/       # Supabase client & upload helpers
└── public/                 # Static assets
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
