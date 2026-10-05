import api from "./axios";

export const getQuotations = (params = {}) =>
  api.get("/quotations", { params });

export const getQuotationById = (id) =>
  api.get(`/quotations/${id}`);

export const createQuotation = (data) =>
  api.post("/quotations", data);

export const updateQuotation = (id, data) =>
  api.put(`/quotations/${id}`, data);

export const updateQuotationStatus = (id, status) =>
  api.patch(`/quotations/${id}/status`, { status });

export const deleteQuotation = (id) =>
  api.delete(`/quotations/${id}`);

export const createQuotationRevision = (id, data) =>
  api.post(`/quotations/${id}/revision`, data);