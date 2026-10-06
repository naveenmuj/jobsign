# Privacy Policy for JobSign

**Effective Date:** October 6, 2026  
**Last Updated:** October 6, 2026  
**Developer:** Naveen / JobSign Software  
**Contact:** support@jobsign.app  

---

### 1. Introduction
JobSign ("we", "our", or "the App") is committed to protecting your privacy. This Privacy Policy explains our practices regarding data collection, local device storage, and disclosure of information when you use our mobile application.

JobSign is built on a **Local-First, Zero-Knowledge Architecture**. We do not operate remote database servers storing your customer names, client signatures, addresses, or financial invoices.

---

### 2. Information We Collect and Process

#### A. Local-Only Data (Stored on Your Device)
When you create estimates, quotes, change orders, or collect signatures in JobSign, the following data is processed and stored **exclusively in a local SQLite database on your physical device**:
- Contractor Profile (Business Name, Phone Number, Trade License Number, Payment handles)
- Client Details (Client Name, Phone Number, Job Site Address, Email)
- Itemized Scope & Dollar Amounts (Line items, quantities, pricing, sales tax rates)
- Worksite Evidence Photos (Captured via your camera to document pre-existing site damage)
- Vector Signatures & Timestamps (Captured on smartphone glass)
- Tamper-Evident SHA-256 Hashes

*None of this information is transmitted to or accessible by JobSign servers.*

#### B. Camera and Storage Permissions
- **Camera Permission (`android.permission.CAMERA`):** Required only when you explicitly choose to take a worksite damage photo to attach to an estimate. Photos are stored locally on your device.
- **Storage / Media Access:** Used strictly to export generated PDF agreements or backup the local SQLite database vault to your phone's file system or chosen cloud drive (e.g., Google Drive, iCloud).

#### C. Network State (`ACCESS_NETWORK_STATE` & `INTERNET`)
- Used exclusively to detect whether your device is currently connected to Wi-Fi or cellular service to operate the **Offline Outbox Manager** and auto-dispatch pending emails/SMS when reception is restored.
- Used to process anonymous In-App Purchase verification via Google Play Billing / RevenueCat.

---

### 3. Third-Party Services
We use limited third-party SDKs strictly to deliver store billing:
- **Google Play In-App Billing (Google LLC):** To process subscriptions and one-time lifetime purchases. All financial transactions are processed securely by Google. We never receive or store your credit card or banking numbers.
- **RevenueCat:** Used anonymously to validate purchase receipts and subscription statuses without collecting personal identity records.

---

### 4. Data Retention & Deletion
Because all your agreements and customer records reside on your device:
- You have 100% control over your data.
- Deleting an agreement in JobSign permanently deletes it from your local SQLite database.
- Uninstalling the application erases all local application data unless you created an external database backup.

---

### 5. Security
JobSign seals all approved estimates and change orders using local **SHA-256 cryptographic hashing**. Any post-signature tampering with dollar amounts invalidates the document digest, ensuring Courtroom auditability under the U.S. ESIGN Act and UETA.

---

### 6. Children's Privacy
JobSign is intended for commercial trade contractors and businesses. We do not knowingly collect personal information from children under 13.

---

### 7. Changes to this Policy
We may update this Privacy Policy from time to time. The latest version will always be published within our application and repository.

---

### 8. Contact Us
For questions regarding this policy or technical support, contact:  
**Email:** support@jobsign.app  
**GitHub Repository:** https://github.com/naveenmuj/jobsign
