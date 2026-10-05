
/* ============================================================
   DESIGNATION API
   ============================================================ */

import api from "./axios";

export const getDesignations = () => {
  return api.get("/designations");
};

export const createDesignation = (data) => {
  return api.post("/designations", data);
};

export const updateDesignation = (id, data) => {
  return api.put(`/designations/${id}`, data);
};

export const deleteDesignation = (id) => {
  return api.delete(`/designations/${id}`);
};