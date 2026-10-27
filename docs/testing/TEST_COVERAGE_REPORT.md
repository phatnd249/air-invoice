# Test Coverage Report — invoice-AIR

> **Generated:** 2026-09-10  
> **Version:** 1.0  
> **Scope:** Full system — Backend (NestJS) + Frontend (Next.js) + Shared Packages

---

## 1. Executive Summary

This report provides a comprehensive test coverage analysis of the invoice-AIR system — a modern Vietnamese e-invoice management platform built with NestJS (backend) and Next.js (frontend). The system manages invoice lifecycle (create → issue → pay/cancel), customer subscriptions with expiry alerts, multi-company settings, user management with RBAC, PDF generation via Playwright, and email delivery.

**Key Metrics:**
| Metric | Value |
|--------|-------|
| Total Test Cases | 176 |
| P0 (Critical) | 67 (38%) |
| P1 (High) | 86 (49%) |
| P2 (Medium) | 23 (13%) |
| Modules Covered | 17 |
| API Endpoints Covered | 45+ |
| Frontend Pages Covered | 12 |
| Requirements Covered | 25 |

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  /login /forgot-password /invoices /invoices/new        │
│  /invoices/:id /subscriptions /templates /settings      │
│  /users /history /services /view/:token                  │
├─────────────────────────────────────────────────────────┤
│                   API Layer (Axios)                      │
│         Interceptors: JWT + Refresh Token                │
├─────────────────────────────────────────────────────────┤
│                  Backend (NestJS)                        │
│  Auth │ Users │ Invoices │ Subscriptions │ Settings      │
│  Services │ Delivery │ Document │ PDF (Playwright)       │
├─────────────────────────────────────────────────────────┤
│              Database (SQLite/Prisma)                    │
│  User │ UserToken │ Setting │ Invoice │ InvoiceItem      │
│  InvoiceHistory │ ServiceCatalog │ CustomerSubscription  │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack
- **Backend:** NestJS + Prisma ORM + SQLite + JWT + Nodemailer
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS + Axios
- **PDF:** Playwright (Chromium headless)
- **Shared:** `packages/types` (TypeScript enums/interfaces), `packages/validation` (Zod schemas)

---

## 3. Module Coverage Matrix

### 3.1 Backend Modules

| Module | Controller | Service | Guard | DTOs | Test Cases | Coverage |
|--------|-----------|---------|-------|------|------------|----------|
| **Authentication** | `auth.controller.ts` | `auth.service.ts` | `jwt-auth.guard`, `local-auth.guard` | LoginDto, RegisterDto, ForgotPasswordDto, ResetPasswordDto | 25 | 100% |
| **User Management** | `users.controller.ts` | `users.service.ts` | `roles.guard` | CreateUserDto, UpdateUserDto | 10 | 100% |
| **Invoice Management** | `invoices.controller.ts` | `invoices.service.ts` | `jwt-auth.guard` | CreateInvoiceDto, UpdateInvoiceDto | 39 | 100% |
| **Subscription Management** | `subscriptions.controller.ts` | `subscriptions.service.ts` | `jwt-auth.guard` | CreateSubscriptionDto | 20 | 100% |
| **Settings** | `settings.controller.ts` | `settings.service.ts` | `jwt-auth.guard` | UpdateRulesDto | 18 | 100% |
| **Services Catalog** | `services-catalog.controller.ts` | `services-catalog.service.ts` | `jwt-auth.guard` | CreateServiceDto | 6 | 100% |
| **Delivery** | — | `delivery.service.ts` | — | — | 5 | 100% |
| **PDF Generation** | — | `pdf.service.ts` | — | — | 7 | 100% |
| **Document** | — | `document.service.ts` | — | — | 1 | 100% |

### 3.2 Frontend Pages

| Page | Route | Components | Test Cases | Coverage |
|------|-------|------------|------------|----------|
| **Login/Register** | `/login` | AuthForm, DemoLogin | 8 | 100% |
| **Forgot Password** | `/forgot-password` | ForgotPasswordForm | 5 | 100% |
| **Invoices List** | `/invoices` | InvoiceList, StatusTabs, SearchBar | 5 | 100% |
| **New Invoice** | `/invoices/new` | InvoiceForm, ItemsTable, SellerSelect, PreviewPanel | 12 | 100% |
| **Invoice Detail** | `/invoices/:id` | InvoiceDetail, Timeline, ActionButtons | 8 | 100% |
| **Subscriptions** | `/subscriptions` | SubscriptionsList, CountdownTimer, BulkActions | 12 | 100% |
| **Templates** | `/templates` | TemplateGrid, EmailTemplateConfig | 6 | 100% |
| **Settings** | `/settings` | CompaniesTab, BanksTab, RulesTab, EmailTab | 8 | 100% |
| **Users** | `/users` | UserList, UserForm | 6 | 100% |
| **History** | `/history` | HistoryList, Filters | 4 | 100% |
| **Services** | `/services` | ServiceList, ServiceForm | 4 | 100% |
| **Public Invoice** | `/view/:token` | PublicInvoiceView | 3 | 100% |

### 3.3 Shared Packages

| Package | Exports | Test Cases | Coverage |
|---------|---------|------------|----------|
| `packages/types` | InvoiceStatus, InvoiceType, InvoiceForm, INVOICE_TYPE_CONFIG, INVOICE_FORM_CONFIG, CompanyProfile, BankAccountItem, SellerInfo, BuyerInfo, InvoiceItem, InvoiceSummary, Invoice | 5 | 100% |
| `packages/validation` | SellerInfoSchema, BuyerInfoSchema, InvoiceItemSchema, CreateInvoiceSchema, CreateInvoiceInput | 6 | 100% |

---

## 4. API Endpoint Coverage

### 4.1 Authentication (`/api/auth`)

| Method | Endpoint | Auth Required | Test Cases |
|--------|----------|---------------|------------|
| POST | `/api/auth/login` | No | AUTH-001 ~ AUTH-004 |
| POST | `/api/auth/register` | No | AUTH-005 ~ AUTH-007 |
| POST | `/api/auth/forgot-password` | No | AUTH-008 ~ AUTH-009 |
| POST | `/api/auth/reset-password` | No | AUTH-010 ~ AUTH-012 |
| POST | `/api/auth/refresh` | No | AUTH-013 ~ AUTH-014 |
| POST | `/api/auth/logout` | Yes | AUTH-015 |
| GET | `/api/auth/profile` | Yes | AUTH-016 |
| PATCH | `/api/auth/profile` | Yes | AUTH-017 |

### 4.2 Users (`/api/users`) — ADMIN Only

| Method | Endpoint | Auth Required | Role | Test Cases |
|--------|----------|---------------|------|------------|
| GET | `/api/users` | Yes | ADMIN | USER-001 ~ USER-002 |
| POST | `/api/users` | Yes | ADMIN | USER-003 ~ USER-004, USER-010 |
| PATCH | `/api/users/:id` | Yes | ADMIN | USER-005 |
| DELETE | `/api/users/:id` | Yes | ADMIN | USER-006 ~ USER-007 |
| PATCH | `/api/users/:id/change-password` | Yes | ADMIN | USER-009 |

### 4.3 Invoices (`/api/invoices`)

| Method | Endpoint | Auth Required | Test Cases |
|--------|----------|---------------|------------|
| GET | `/api/invoices` | Yes | INV-013 ~ INV-016 |
| POST | `/api/invoices` | Yes | INV-001 ~ INV-012 |
| GET | `/api/invoices/:id` | Yes | INV-017 ~ INV-018 |
| PATCH | `/api/invoices/:id` | Yes | INV-031 |
| DELETE | `/api/invoices/:id` | Yes | INV-025 ~ INV-026 |
| POST | `/api/invoices/:id/clone` | Yes | INV-023 ~ INV-024 |
| PATCH | `/api/invoices/:id/issue` | Yes | INV-019 |
| PATCH | `/api/invoices/:id/pay` | Yes | INV-020 |
| PATCH | `/api/invoices/:id/cancel` | Yes | INV-021 ~ INV-022 |
| POST | `/api/invoices/:id/send-email` | Yes | INV-027 ~ INV-028 |
| GET | `/api/invoices/:id/pdf` | Yes | INV-029 ~ INV-030, PDF-001 ~ PDF-007 |
| GET | `/api/invoices/:id/share-link` | Yes | PUB-001 |

### 4.4 Subscriptions (`/api/subscriptions`)

| Method | Endpoint | Auth Required | Test Cases |
|--------|----------|---------------|------------|
| GET | `/api/subscriptions` | Yes | SUB-001 ~ SUB-002 |
| POST | `/api/subscriptions` | Yes | SUB-006 ~ SUB-007 |
| PATCH | `/api/subscriptions/:id` | Yes | SUB-008 |
| DELETE | `/api/subscriptions/:id` | Yes | SUB-009 |
| GET | `/api/subscriptions/stats` | Yes | SUB-010 |
| POST | `/api/subscriptions/:id/send-email-alert` | Yes | SUB-011 ~ SUB-012 |
| POST | `/api/subscriptions/bulk-send-alert` | Yes | SUB-013 ~ SUB-015 |

### 4.5 Settings (`/api/settings`)

| Method | Endpoint | Auth Required | Test Cases |
|--------|----------|---------------|------------|
| GET | `/api/settings` | Yes | SET-001, SET-006, SET-010, SET-013 |
| PATCH | `/api/settings` | Yes | SET-011 |
| POST | `/api/settings/companies` | Yes | SET-002 |
| PATCH | `/api/settings/companies/:id` | Yes | SET-003 |
| DELETE | `/api/settings/companies/:id` | Yes | SET-004 ~ SET-005 |
| POST | `/api/settings/banks` | Yes | SET-007 |
| PATCH | `/api/settings/banks/:id` | Yes | SET-008 |
| DELETE | `/api/settings/banks/:id` | Yes | SET-009 |
| PATCH | `/api/settings/rules` | Yes | SET-011 ~ SET-012 |
| PATCH | `/api/settings/email-templates` | Yes | SET-014 |

### 4.6 Services Catalog (`/api/services`)

| Method | Endpoint | Auth Required | Test Cases |
|--------|----------|---------------|------------|
| GET | `/api/services` | Yes | SVC-001 |
| POST | `/api/services` | Yes | SVC-002 ~ SVC-003 |
| PATCH | `/api/services/:id` | Yes | SVC-004 |
| DELETE | `/api/services/:id` | Yes | SVC-005 ~ SVC-006 |

### 4.7 History (`/api/history`)

| Method | Endpoint | Auth Required | Test Cases |
|--------|----------|---------------|------------|
| GET | `/api/history` | Yes | HIS-001 ~ HIS-004 |

---

## 5. Database Schema Coverage

### 5.1 Tables

| Table | Fields | Relations | Test Cases |
|-------|--------|-----------|------------|
| **User** | id, name, email, password, role, createdAt, updatedAt | → UserToken (1:N) | AUTH-001 ~ AUTH-025, USER-001 ~ USER-010 |
| **UserToken** | id, userId, accessToken, refreshToken, createdAt, expiresAt | → User (N:1) | AUTH-013 ~ AUTH-014 |
| **Setting** | id, defaultInvoiceNumberPrefix, defaultVatRate, nextInvoiceNumber, companies (JSON), banks (JSON), emailTemplates (JSON) | — | SET-001 ~ SET-018 |
| **Invoice** | id, invoiceNumber, invoiceType, invoiceForm, issueDate, dueDate, currency, templateId, status, notes, terms, seller (JSON), buyer (JSON), otherFee, totalAmount, paymentMethod, paidAt, shareToken, createdBy, createdAt, updatedAt | → InvoiceItem (1:N), → InvoiceHistory (1:N) | INV-001 ~ INV-039, DB-001 ~ DB-005 |
| **InvoiceItem** | id, invoiceId, sortOrder, description, unit, quantity, unitPrice, discountRate, discountAmount, taxRate, taxAmount, amount | → Invoice (N:1) | INV-005 ~ INV-012 |
| **InvoiceHistory** | id, invoiceId, oldStatus, newStatus, changedBy, changedByName, createdAt | → Invoice (N:1) | INV-018, INV-033, HIS-001 ~ HIS-004 |
| **ServiceCatalog** | id, name, description, unitPrice, unit, category, isActive, createdAt, updatedAt | — | SVC-001 ~ SVC-006 |
| **CustomerSubscription** | id, serviceName, customerName, customerEmail, startDate, endDate, totalAmount, willRenew, notes, createdAt, updatedAt | — | SUB-001 ~ SUB-020 |

### 5.2 Key Schema Features

| Feature | Implementation | Test Coverage |
|---------|---------------|---------------|
| **Invoice Type/Form (Decree 123)** | `invoiceType` enum (GTGT/BAN_HANG/TAI_SAN_CONG/DU_TRU_QG), `invoiceForm` enum (WITH_TAX_CODE/WITHOUT_TAX_CODE/POS_CONNECTED) | INV-001 ~ INV-004, DB-002 |
| **Seller Snapshot (JSON)** | `seller` field stores snapshot at creation time | DB-003, PDF-003 |
| **Multi-Company** | `companies` JSON array in Setting | SET-001 ~ SET-005 |
| **Multi-Bank** | `banks` JSON array in Setting | SET-006 ~ SET-009 |
| **UUID PKs** | CustomerSubscription uses UUID | DB-005 |
| **Cascade Delete** | InvoiceHistory deleted when Invoice deleted | DB-004 |
| **Refresh Token Rotation** | Old token invalidated on refresh | AUTH-013 ~ AUTH-014 |

---

## 6. Security Coverage

| Security Area | Implementation | Test Cases |
|---------------|---------------|------------|
| **JWT Authentication** | Access token (15min) + Refresh token (7d) in DB | AUTH-013 ~ AUTH-014, SEC-003 |
| **Password Hashing** | bcrypt (via bcryptjs) | AUTH-001 |
| **RBAC** | `@Roles('ADMIN')` decorator + RolesGuard | AUTH-020 ~ AUTH-021, SEC-005 ~ SEC-006 |
| **Refresh Token Rotation** | Old token deleted on use | AUTH-013 |
| **OTP Expiry** | 15-minute TTL on password reset OTP | AUTH-011 |
| **SQL Injection** | Prisma ORM parameterized queries | SEC-001 |
| **XSS** | React auto-escaping + Tailwind | SEC-002 |
| **Rate Limiting** | Backend rate limit middleware | SEC-007 |
| **Token Expiry** | Access token expires, interceptor auto-refresh | AUTH-019 |
| **Resource Isolation** | Users can only access own invoices | SEC-006 |

---

## 7. Frontend Component Coverage

### 7.1 App Shell

| Component | File | Features | Test Cases |
|-----------|------|----------|------------|
| **Sidebar** | `components/Sidebar.tsx` | slate-900 bg, logo, menu items, active state, responsive | UI-001, UI-003, UI-004 |
| **TopBar** | `components/TopBar.tsx` | transparent bg, user name, avatar dropdown | UI-002 |
| **AppShell** | `components/AppShell.tsx` | layout wrapper, animate-pulse | UI-001 |
| **Providers** | `components/Providers.tsx` | AuthProvider + ToastProvider wrapper | — |

### 7.2 Toast & Confirm System

| Component | File | Features | Test Cases |
|-----------|------|----------|------------|
| **ToastContext** | `context/ToastContext.tsx` | toast stack, success/error variants, auto-dismiss | UI-005 ~ UI-007 |
| **Confirm Dialog** | `context/ToastContext.tsx` | promise-based confirm, overlay, cancel/confirm | UI-008 ~ UI-009 |

### 7.3 Design System Compliance

| Rule | Status | Test Cases |
|------|--------|------------|
| Background: `bg-slate-50/75` | ✅ Compliant | DS-001 |
| No `bg-gradient-to-*` on buttons | ✅ Compliant | DS-002 |
| No `rounded-3xl` | ✅ Compliant | DS-003 |
| No colored shadows (`shadow-emerald/blue/rose`) | ✅ Compliant | DS-004 |
| Money: `font-mono tabular-nums` | ✅ Compliant | DS-005 |
| Status dots (emerald/amber/rose/slate) | ✅ Compliant | SUB-016, SUB-018 |
| Hairline borders (`divide-slate-100`) | ✅ Compliant | INV-013 |
| `whitespace-nowrap` on badges | ✅ Compliant | SUB-018 |

---

## 8. Test Case Distribution

### 8.1 By Priority

```
P0 (Critical) ████████████████████████████████░░░░░░░░░░░░  67 (38%)
P1 (High)     ████████████████████████████████████████░░░░  86 (49%)
P2 (Medium)   ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  23 (13%)
P3 (Low)      ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0 (0%)
```

### 8.2 By Type

```
API Tests  █████████████████████████████████████████░░░░░  132 (75%)
UI Tests   ███████████████████████████████░░░░░░░░░░░░░░░  101 (57%)
```
> Note: Many test cases are API + UI (counted in both).

### 8.3 By Module

```
Invoice Management  ████████████████████████████████████████  39
Subscriptions       ██████████████████████████░░░░░░░░░░░░░░  20
Authentication      ███████████████████████████████░░░░░░░░░  25
Settings            ██████████████████████░░░░░░░░░░░░░░░░░░  18
User Management     ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░  10
PDF                 ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   7
E2E Flow            ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   7
Security            ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   7
Services Catalog    ███████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   6
Templates           ███████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   6
Delivery            ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   5
Database            ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   5
Toast               ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   5
Design System       ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   5
App Shell           █████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   4
History             █████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   4
Public Invoice View ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   3
```

---

## 9. Risk Assessment

### 9.1 High Risk Areas (P0 Focus)

| Area | Risk | Mitigation |
|------|------|------------|
| **Invoice Lifecycle** | Status transition bugs could corrupt financial data | INV-019 ~ INV-022 test all valid transitions + invalid ones |
| **JWT/Refresh Token** | Token forgery or session hijacking | AUTH-013 ~ AUTH-014, SEC-003 test rotation + expiry |
| **RBAC** | Privilege escalation (USER accessing ADMIN routes) | AUTH-020 ~ AUTH-021, SEC-005 ~ SEC-006 |
| **Invoice Numbering** | Duplicate invoice numbers | INV-032 tests auto-increment per company |
| **PDF Generation** | Incorrect invoice data in PDF | PDF-001 ~ PDF-007 test content accuracy |
| **Email Delivery** | Failed delivery without notification | DLV-001 ~ DLV-003 test success + SMTP failure |
| **Subscription Expiry** | Customers not notified before expiry | SUB-011 ~ SUB-015 test individual + bulk alerts |

### 9.2 Medium Risk Areas (P1 Focus)

| Area | Risk | Mitigation |
|------|------|------------|
| **Invoice Clone** | Data inconsistency in cloned invoices | INV-023 ~ INV-024 |
| **Settings Auto-save** | Data loss on Companies/Banks | SET-018 |
| **Search/Filter** | Incorrect results in invoice/subscription search | INV-014 ~ INV-015, SUB-002 |
| **OTP Flow** | Expired or reused OTP | AUTH-010 ~ AUTH-011 |
| **History Logging** | Missing audit trail | HIS-001 ~ HIS-004 |

### 9.3 Low Risk Areas (P2 Focus)

| Area | Risk | Mitigation |
|------|------|------------|
| **Pagination** | Off-by-one errors | INV-016 |
| **Loading States** | Poor UX during API calls | AUTH-023 |
| **Mobile Responsive** | Layout breaks on small screens | UI-004 |

---

## 10. Test Data Requirements

### 10.1 Seed Data

| Entity | Count | Purpose |
|--------|-------|---------|
| Admin User | 1 | `admin@example.com / admin123` — ADMIN role |
| Regular User | 1 | `user@example.com / user123` — USER role |
| Company Profile | 2+ | Different companies for multi-company testing |
| Bank Account | 2+ | Different banks for multi-bank testing |
| Service Catalog | 3+ | Various services with different prices |
| Invoice (various statuses) | 5+ | ISSUED, SENT, PAID, CANCELLED |
| Subscription (various expiries) | 5+ | Expired, expiring soon, active |

### 10.2 Boundary Test Data

| Data | Value | Expected |
|------|-------|----------|
| Zero quantity | `quantity: 0` | Fail (min 0.001) |
| Negative price | `unitPrice: -100` | Fail (min 0) |
| Max discount | `discountRate: 100` | Pass |
| Over max discount | `discountRate: 101` | Fail (max 100) |
| Long string | 100 chars | Truncate or validate |
| Unicode input | Vietnamese chars | Pass |

---

## 11. Coverage Gaps & Recommendations

### 11.1 Current Gaps

| Gap | Severity | Recommendation |
|-----|----------|----------------|
| No automated E2E tests | High | Add Playwright/Cypress for critical flows |
| No load/stress testing | Medium | Add k6/Artillery for API endpoints |
| No email content verification | Medium | Add email assertion in delivery tests |
| No PDF visual regression | Medium | Add screenshot comparison for PDF output |
| No WebSocket testing | Low | Not currently used (N/A) |
| Mobile responsiveness not deeply tested | Medium | Add device-specific test cases |

### 11.2 Recommended Next Steps

1. **Automated E2E Suite** — Convert P0 manual cases to Playwright scripts
2. **API Contract Testing** — Add Pact or similar for API validation
3. **Visual Regression** — Screenshot tests for PDF and UI components
4. **Performance Baseline** — Establish response time benchmarks
5. **Security Audit** — Penetration testing for auth and RBAC

---

## 12. Appendix

### 12.1 File Inventory

| Category | Files | Count |
|----------|-------|-------|
| Backend Controllers | `auth.controller.ts`, `users.controller.ts`, `invoices.controller.ts`, `subscriptions.controller.ts`, `settings.controller.ts`, `services-catalog.controller.ts` | 6 |
| Backend Services | `auth.service.ts`, `users.service.ts`, `invoices.service.ts`, `subscriptions.service.ts`, `settings.service.ts`, `services-catalog.service.ts`, `delivery.service.ts`, `pdf.service.ts`, `document.service.ts` | 9 |
| Backend Guards | `jwt-auth.guard.ts`, `local-auth.guard.ts`, `roles.guard.ts` | 3 |
| Backend Strategies | `jwt.strategy.ts`, `local.strategy.ts` | 2 |
| Backend DTOs | `login.dto.ts`, `register.dto.ts`, `forgot-password.dto.ts`, `reset-password.dto.ts`, `create-user.dto.ts`, `update-user.dto.ts`, `create-invoice.dto.ts`, `update-invoice.dto.ts`, `create-subscription.dto.ts`, `create-service.dto.ts`, `update-service.dto.ts` | 11 |
| Frontend Pages | 12 page files under `app/` | 12 |
| Frontend Components | `Sidebar.tsx`, `TopBar.tsx`, `AppShell.tsx`, `Providers.tsx`, `InvoiceTemplateRenderer.tsx` | 5 |
| Frontend Context | `AuthContext.tsx`, `ToastContext.tsx` | 2 |
| Frontend Lib | `api.ts` | 1 |
| Shared Types | `packages/types/src/index.ts` | 1 |
| Shared Validation | `packages/validation/src/index.ts` | 1 |
| **Total Source Files** | | **54** |

### 12.2 API Endpoint Summary

| Category | Count |
|----------|-------|
| Auth endpoints | 8 |
| User endpoints | 5 |
| Invoice endpoints | 12 |
| Subscription endpoints | 7 |
| Settings endpoints | 10 |
| Service endpoints | 4 |
| History endpoints | 1 |
| **Total API endpoints** | **47** |

---

*Report generated from source code analysis. All test cases are designed for manual human execution. See `MANUAL_TEST_CASES.xlsx` for detailed test steps and expected results.*
