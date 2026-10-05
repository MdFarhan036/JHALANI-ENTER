import api from "./axios";

export const getVehicles = (params = {}) =>
  api.get("/vehicles", { params });

export const getVehicleById = (id) =>
  api.get(`/vehicles/${id}`);

export const createVehicle = (data) =>
  api.post("/vehicles", data);

export const updateVehicle = (id, data) =>
  api.put(`/vehicles/${id}`, data);

export const updateVehicleStatus = (id, status) =>
  api.patch(`/vehicles/${id}/status`, { status });

export const deleteVehicle = (id) =>
  api.delete(`/vehicles/${id}`);