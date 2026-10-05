# Jahalani Enterprises frontend

Vite + React frontend based on the supplied requirements document.

## Run

```sh
npm install
npm run dev
```

## Production build

```sh
npm run build
npm run preview
```

Modules include overview, orders, dispatch, pendency, inventory, catalogue, quotations, employee transactions, payroll, employees, parties, notifications, reports, a reference role matrix and workspace settings.

The browser stores demo records in localStorage. Creating a dispatch validates remaining quantity and stock, updates the original order and reduces inventory. Approved deductible expenses flow into the selected month's payroll. CSV exports, quotation printing, expense approvals and payroll status transitions work locally.

This is a frontend demo. Production requires API integration, server validation, authentication, enforced permissions, database transactions, secure attachment storage and audit logging. Sample parties, contacts and business records are illustrative. Role settings are a reference matrix, not enforced access control. Quotations use master product prices and exclude tax/freight. Orders and quotations currently have one product line each; multi-line editing, attachment uploads, revision history and employee ledger balances remain backend/integration follow-up work.

Design: charcoal navigation, neutral paper surfaces, copper actions, compact operations tables and responsive navigation. Product illustrations are inline SVG. Fonts use Google Fonts with local fallbacks.
