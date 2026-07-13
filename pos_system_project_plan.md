# Product Requirement Document (PRD) & Project Plan
## POS System Local Database for Apparel Retail (Super MVP Version)

### 1. Scope Discovery
*   **Application Type:** Desktop / Local Web-based Point of Sale (POS) System.
*   **Architecture:** Single-device configuration (1 cashier computer). Fully local operations, eliminating monthly cloud database costs (e.g., Supabase, Firebase).
*   **Target User:** Fashion/Apparel Retail Store Operators (Cashiers & Store Owners acting as System Admins).
*   **Primary Objective:** High-speed transaction processing, zero reliance on active internet connections, robust local data integrity, and cost minimization.
*   **Data Security:** Automatic scheduled backups compressed into raw SQL text dumps uploaded directly to Google Drive via API to secure data against local hardware failures without recurring database fees.

---

### 2. Feature Requirements (PRD)

#### Must-Have Features (Core MVP)
1.  **Item CRUD Management:**
    *   Create, Read, Update, and Delete capabilities for products.
    *   Attributes: Item ID, Barcode/SKU (Unique), Item Name (includes inline variations, e.g., "Flannel Shirt Red XL"), Capital Price (Cost), Selling Price, Stock Qty.
2.  **Stock Level Monitoring:**
    *   A clean, real-time inventory sheet interface listing total available items and flagging low stock warnings.
3.  **Cashier Checkout Module:**
    *   Fast lookup via hardware Barcode Scanner or text input matching.
    *   Dynamic shopping cart layout recalculating total amounts instantly.
    *   Cash tendered calculator displaying change due instantly.
    *   Direct physical receipt execution targeting the local Thermal Printer.
4.  **Local Automated Backup:**
    *   System script triggers a local SQL database dump, compresses it, and syncs to Google Drive upon app closure or at designated nightly hours.

#### Nice-to-Have Features (Post-MVP Scale-up)
*   Automated Multi-Variant Matrix (Separated Stock SKU allocation for sizes and colors natively).
*   Dynamic Daily/Monthly Gross Profit Reporting dashboards.
*   Customer Loyalty Point Systems.

---

### 3. User Flow & Architecture

#### A. User Flow Sequence
1.  **Inventory Adjustment Flow:**
    *   `Operator -> Opens 'Kelola Barang' Panel -> Selects Add/Edit -> Inputs Data -> Commits to Local SQLite Database -> Updated instantly on 'Lihat Stok' page.`
2.  **Point of Sale Transaction Flow:**
    *   `Operator -> Opens 'Transaksi Kasir' Page -> Scans Item Barcode -> System appends item to Cart -> Operator clicks 'Selesaikan Transaksi' -> Database transaction executes (Checks availability, decreases inventory stock, logs invoice headers/details) -> Thermal printer issues receipt -> Screen resets.`

#### B. Architectural Data Flow Logic
*   **Frontend UI + Backend Engine:** Packed securely into a standalone local instance running Node.js / Electron.
*   **Database Engine:** Local SQLite storage file contained within the application directory structure.
*   **ACID Transaction Layer:** Multi-step queries must resolve successfully in a single transaction cycle. If any validation fails (e.g., insufficient stock), the whole script aborts to protect data integrity.

---

### 4. Database Schema Design

#### Table A: `barang`
*   `id` : INTEGER (Primary Key, Auto Increment)
*   `barcode` : VARCHAR(50) (Unique, Indexed)
*   `nama_barang` : VARCHAR(250)
*   `harga_modal` : INTEGER
*   `harga_jual` : INTEGER
*   `stok` : INTEGER
*   `created_at` : TIMESTAMP (Default Current Time)

#### Table B: `transaksi`
*   `id` : INTEGER (Primary Key, Auto Increment)
*   `nomor_nota` : VARCHAR(50) (Unique, e.g., `INV-YYYYMMDD-0001`)
*   `total_harga` : INTEGER
*   `total_bayar` : INTEGER
*   `total_kembalian` : INTEGER
*   `tanggal_transaksi` : TIMESTAMP (Default Current Time)

#### Table C: `detail_transaksi`
*   `id` : INTEGER (Primary Key, Auto Increment)
*   `transaksi_id` : INTEGER (Foreign Key references `transaksi.id` ON DELETE CASCADE)
*   `barang_id` : INTEGER (Foreign Key references `barang.id`)
*   `harga_jual_saat_ini` : INTEGER (Snapshotted historical transaction price)
*   `qty` : INTEGER
*   `subtotal` : INTEGER

---

### 5. Task Breakdown (Backlog Sprint)

#### Sprint 1: Infrastructure & Inventory Management
*   **TASK-001: Local Environment & SQLite Setup**
    *   *Description:* Initialize local app runtime repository. Write database script schemas for `barang`, `transaksi`, and `detail_transaksi` tables.
    *   *Done Criteria:* Database file loads locally; tables successfully receive manual validation query scripts.
*   **TASK-002: Item CRUD Interface Module**
    *   *Description:* Code the admin UI and local query execution logic to safely add, read, modify, or erase item entries.
    *   *Done Criteria:* System records input parameters into database rows and displays them accurately.
*   **TASK-003: Real-Time Stock View Panel**
    *   *Description:* Build a lightweight component reading rows out of `barang` showing instant balance values.
    *   *Done Criteria:* Table columns sync perfectly to live database figures.

#### Sprint 2: Checkout Module & Local Integration
*   **TASK-004: Point of Sale Cashier Interface**
    *   *Description:* Build UI with hardware scan listeners, virtual shopping lists, and basic transaction calculations. Implement ACID checks protecting against negative stock quantities.
    *   *Done Criteria:* Click action processes database adjustments cleanly or blocks checkout when stock runs dry.
*   **TASK-005: Thermal Printer Hardware Driver Setup**
    *   *Description:* Construct the local receipt formatting pipe outputting structural text straight to the local hardware printer port.
    *   *Done Criteria:* Successful checkouts yield auto-printed physical receipts.
*   **TASK-006: Google Drive Auto-Backup Sync Utility**
    *   *Description:* Write background task scripts utilizing OAuth tokens to parse local databases into `.sql` scripts and pass them to remote Google Drive directories.
    *   *Done Criteria:* Clean `.sql` file appears in targeted Drive folder on app closure, showing a front-end connection health check icon.

---

### 6. Risk Assessment
*   **Database Corruption:** Sudden physical power failures during a write sequence could corrupt local file systems. *Mitigation:* System strictly backups data via raw plain-text `.sql` dump streams rather than cloning active `.db` files directly.
*   **Authentication Token Expiration:** Google Drive OAuth tokens could get invalidated via user account setting shifts. *Mitigation:* A visual signal light element must display connection state (Green/Red) inside the main panel to alert cashiers immediately if an auto-backup fails, alongside local USB export triggers.
*   **Operating System Level Divergence:** Interprocess drivers communicating with receipt thermal printers or local databases might act unevenly between specific Windows variations. *Mitigation:* Mandatory functional hardware validation drills must run directly on the physical retail machine midpoint through the initial build week.
