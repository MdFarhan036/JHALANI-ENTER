import api from "./axios";

export const getStockTransactions = (params = {}) =>
  api.get("/stock/history", { params });

export const getStockTransactionById = (id) =>
  api.get(`/stock/transaction/${id}`);

export const createStockTransaction = (data) =>
  api.post("/stock/transaction", data);