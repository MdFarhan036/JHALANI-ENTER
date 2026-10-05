import axios from "./axios";

export const getCatalogue = () =>
  axios.get("/catalogue");

export const getCatalogueById = (id) =>
  axios.get(`/catalogue/${id}`);

export const createCatalogue = (payload) =>
  axios.post("/catalogue", payload);

export const updateCatalogue = (id, payload) =>
  axios.put(`/catalogue/${id}`, payload);

export const deleteCatalogue = (id) =>
  axios.delete(`/catalogue/${id}`);

/*
|--------------------------------------------------------------------------
| SPECIFICATIONS
|--------------------------------------------------------------------------
*/

export const addCatalogueSpecification = (productId, payload) =>
  axios.post(`/catalogue/${productId}/specifications`, payload);

export const updateCatalogueSpecification = (specId, payload) =>
  axios.put(`/catalogue/specifications/${specId}`, payload);

export const deleteCatalogueSpecification = (specId) =>
  axios.delete(`/catalogue/specifications/${specId}`);

/*
|--------------------------------------------------------------------------
| IMAGES
|--------------------------------------------------------------------------
*/

export const addCatalogueImage = (productId, payload) =>
  axios.post(`/catalogue/${productId}/images`, payload);

export const deleteCatalogueImage = (imageId) =>
  axios.delete(`/catalogue/images/${imageId}`);

/*
|--------------------------------------------------------------------------
| DOCUMENTS
|--------------------------------------------------------------------------
*/

export const addCatalogueDocument = (productId, payload) =>
  axios.post(`/catalogue/${productId}/documents`, payload);

export const deleteCatalogueDocument = (documentId) =>
  axios.delete(`/catalogue/documents/${documentId}`);