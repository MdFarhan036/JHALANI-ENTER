import api from "./axios";

export const getCategories = () =>
  api.get("/categories");

export const getCategoryById = (id) =>
  api.get(`/categories/${id}`);

export const createCategory = (data) =>
  api.post("/categories", data);

export const updateCategory = (
  id,
  data
) =>
  api.put(
    `/categories/${id}`,
    data
  );

export const updateCategoryStatus = (
  id,
  status
) =>
  api.patch(
    `/categories/${id}/status`,
    { status }
  );