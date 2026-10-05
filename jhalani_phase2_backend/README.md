# Jhalani Enterprises — Phase 2 Backend

This backend adds the first API layer on top of the upgraded `stock_management_db`.

## Requirements

- Node.js 18+
- MariaDB/MySQL
- Phase 1 database migration already imported

## Setup

```bash
npm install
copy .env.example .env
```

On Linux:

```bash
cp .env.example .env
```

Update `.env` with your database credentials.

## Run

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

Health check:

```text
GET /api/health
```

## API

### Parties

```text
POST   /api/parties
GET    /api/parties
GET    /api/parties/:id
PUT    /api/parties/:id
DELETE /api/parties/:id
```

### Orders

```text
POST   /api/orders
GET    /api/orders
GET    /api/orders/:id
PUT    /api/orders/:id
DELETE /api/orders/:id
GET    /api/orders/pendency
```

## Create Party example

```json
{
  "party_code": "PTY-001",
  "name": "ABC Electricals",
  "contact_person": "Rahul",
  "mobile": "9876543210",
  "gst_no": "08XXXXXXXXXX1Z5",
  "billing_address": "Jaipur",
  "delivery_address": "Jaipur Warehouse",
  "city": "Jaipur",
  "state": "Rajasthan",
  "pincode": "302001",
  "credit_limit": 100000
}
```

## Create Order example

```json
{
  "party_id": 1,
  "po_number": "PO-1001",
  "po_date": "2026-10-02",
  "order_date": "2026-10-02",
  "delivery_address": "Jaipur Warehouse",
  "remarks": "Urgent dispatch",
  "items": [
    {
      "variant_id": 1,
      "description": "Conduit Round Box",
      "ordered_quantity": 100,
      "rate": 450
    }
  ]
}
```

## Development user

For now the API accepts:

```text
x-user-id: 1
```

This only records `created_by`; it is not a replacement for production authentication.
In the next phase, connect the project's existing JWT/login middleware.
