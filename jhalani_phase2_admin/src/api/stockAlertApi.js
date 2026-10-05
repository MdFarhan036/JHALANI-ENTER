import api from "./axios";

export const getStockAlerts = (params = {}) =>
  api.get("/stock-alerts", { params });

export const getOutOfStock = () =>
  api.get("/stock-alerts/out-of-stock");