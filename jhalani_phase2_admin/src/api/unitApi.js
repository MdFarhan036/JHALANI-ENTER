import api from "./axios";

export const getUnits = () =>
  api.get("/units");

export const getUnitById = (id) =>
  api.get(`/units/${id}`);

export const createUnit = (data) =>
  api.post("/units", data);

export const updateUnit = (id, data) =>
  api.put(`/units/${id}`, data);

export const updateUnitStatus = (
  id,
  status
) =>
  api.patch(
    `/units/${id}/status`,
    { status }
  );