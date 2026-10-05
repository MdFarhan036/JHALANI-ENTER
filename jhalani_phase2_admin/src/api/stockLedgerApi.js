import api from "./axios";

export const getStockLedger = (params = {}) =>
  api.get("/stock-ledger", { params });

export const getVariantLedger = (variantId) =>
  api.get(`/stock-ledger/variant/${variantId}`);