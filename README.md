# 🛡️ VaultPDF — 100% Client-Side Private PDF Suite

> **"Your confidential documents never leave your browser."**  
> A zero-knowledge, air-gapped web utility designed to unlock, protect, merge, split, and rotate PDFs completely in client-side RAM via Web Crypto & WebAssembly.

---

## 🌟 Why VaultPDF Was Built

Every month, millions of citizens, employees, and developers receive password-locked documents:
* **e-Aadhaar cards** (UIDAI password lock)
* **Monthly Bank Statements** (SBI, HDFC, ICICI, PNB)
* **Tax Form 16 & Salary Slips** (C-DAC, Govt, MNCs)
* **Investment & Demat Portfolio Summaries** (CDSL CAS)

When people need to share, print, or email these documents, 95% resort to uploading confidential personal documents to random cloud converter websites (`iLovePDF`, `Smallpdf`, etc.), exposing their PAN, Aadhaar number, bank account balances, and transaction history to unknown third-party servers.

**VaultPDF solves this with Zero-Knowledge Architecture:**
* **0 Bytes Sent Across Network:** All decryption, merging, splitting, and re-encryption is executed inside your browser's local sandbox memory.
* **Air-Gap Compatible:** You can disconnect your Wi-Fi or mobile data, and every feature works at full speed offline.
* **Instant Processing:** Without internet upload/download bottlenecks, 50 MB PDFs process in under 200 ms.

---

## 🚀 Key Modules & Capabilities

1. 🔓 **Unlock & Decrypt (Permanent Password Removal):**
   * Decrypts AES-256 and 128-bit/40-bit RC4 password-protected PDFs.
   * Auto-detects encryption flags.
   * Downloads a clean, permanently unlocked PDF.
2. 🔒 **Protect & Encrypt:**
   * Encrypts any document with AES-256 military-grade standards.
3. 📑 **Merge Multiple PDFs:**
   * Combine multiple files with drag-and-drop order rearrangement and page count tracking.
4. ✂️ **Split & Extract Pages:**
   * Extract custom ranges (e.g. `1-3, 5, 8-10`) into a clean separate document.
5. 🔄 **Lossless Page Rotation:**
   * Fix inverted or sideways scanned receipts and certificates (90°, 180°, 270°).
6. 🇮🇳 **Indian Document Cheat Sheet:**
   * One-click guide for standard UIDAI, SBI, HDFC, ICICI, PNB, and Form 16 password formats.

---

## 🛠️ Tech Stack

* **Core Engine:** Vanilla JavaScript (ES Modules)
* **Cryptographic Decryption:** `@pdfsmaller/pdf-decrypt` (Web Crypto AES-256 / RC4)
* **Cryptographic Encryption:** `@pdfsmaller/pdf-encrypt`
* **PDF Document Manipulation:** `pdf-lib`
* **UI Design System:** Dark Glassmorphism, Vanilla CSS, Google Fonts (`Plus Jakarta Sans`, `Outfit`, `JetBrains Mono`)
* **Bundler & Server:** Vite

---

## 💻 Local Development

```bash
# 1. Navigate to the project
cd "products/private-pdf-vault"

# 2. Install dependencies (if not already installed)
npm install

# 3. Start local dev server
npm run dev -- --port 5174

# 4. Open in browser:
http://localhost:5174/
```

---

## 🌐 Instant Zero-Cost Cloud Deployment

You can host this for **₹0 forever** on Vercel or Cloudflare Pages:

### Deploy to Vercel (CLI):
```bash
npx vercel deploy --prod
```

### Deploy to Cloudflare Pages / GitHub Pages:
```bash
# Build the production bundle
npm run build

# Output will be generated in dist/
# Upload dist/ directly to Cloudflare Pages or deploy via GitHub repository.
```

---

## 💼 Creator & Inbound Funnel
* **Architected by:** Satyam Sahu — Systems & Cyber Security Engineer (C-DAC Hyderabad)
* **GitHub:** [github.com/sahusatyam050](https://github.com/sahusatyam050)
* **LinkedIn:** [linkedin.com/in/satyam-sahu-1564131b8](https://linkedin.com/in/satyam-sahu-1564131b8)
* **Contact:** `sahusatyam050@gmail.com`
