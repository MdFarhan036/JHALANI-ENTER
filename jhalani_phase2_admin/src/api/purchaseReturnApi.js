import api from "./axios";

export const getPurchaseReturns = (params = {}) =>
  api.get("/purchase-returns", { params });

export const getPurchasesForReturn = () =>
  api.get("/purchase-returns/purchases");

export const getPurchaseItemsForReturn = (purchaseId) =>
  api.get(`/purchase-returns/purchases/${purchaseId}/items`);

export const createPurchaseReturn = (data) =>
  api.post("/purchase-returns", data);

export const completePurchaseReturn = (id) =>
  api.put(`/purchase-returns/${id}/complete`);