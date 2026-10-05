import api from "./axios";

/*
============================================================
GET ALL STOCK ADJUSTMENTS
============================================================
*/

export const getStockAdjustments = (params = {}) =>
  api.get("/stock-adjustments", { params });


/*
============================================================
GET SINGLE STOCK ADJUSTMENT
============================================================
*/

export const getStockAdjustmentById = (id) =>
  api.get(`/stock-adjustments/${id}`);


/*
============================================================
CREATE STOCK ADJUSTMENT
============================================================
*/

export const createStockAdjustment = (data) =>
  api.post("/stock-adjustments", data);