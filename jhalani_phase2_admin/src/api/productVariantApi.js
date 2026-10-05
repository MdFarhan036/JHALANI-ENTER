import api from "./axios";

export const getVariants = () =>
  api.get("/product-variants");

export const getVariantById = (id) =>
  api.get(`/product-variants/${id}`);

export const createVariant = (data) =>
  api.post("/product-variants", data);

export const updateVariant = (id, data) =>
  api.put(
    `/product-variants/${id}`,
    data
  );

export const updateVariantStatus = (
  id,
  status
) =>
  api.patch(
    `/product-variants/${id}/status`,
    { status }
);