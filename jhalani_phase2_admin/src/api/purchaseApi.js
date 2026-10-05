import api from "./axios";

/*
============================================================
GET ALL PURCHASES
============================================================
*/

export const getPurchases = (params = {}) =>
  api.get("/purchases", { params });


/*
============================================================
GET PURCHASE BY ID
============================================================
*/

export const getPurchaseById = (id) =>
  api.get(`/purchases/${id}`);


/*
============================================================
CREATE PURCHASE
============================================================
*/

export const createPurchase = (data) =>
  api.post("/purchases", data);


/*
============================================================
COMPLETE PURCHASE
============================================================
*/

export const completePurchase = (id) =>
  api.put(`/purchases/${id}/complete`);


/*
============================================================
CANCEL PURCHASE
============================================================
*/

export const cancelPurchase = (id) =>
  api.put(`/purchases/${id}/cancel`);