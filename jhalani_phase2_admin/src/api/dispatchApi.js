import api from "./axios";

/*
============================================================
GET ALL DISPATCHES
============================================================
*/
export const getDispatches = (params = {}) =>
  api.get("/dispatches", { params });


/*
============================================================
GET SINGLE DISPATCH
============================================================
*/
export const getDispatchById = (id) =>
  api.get(`/dispatches/${id}`);


/*
============================================================
GET ORDERS WITH PENDING QUANTITY
============================================================
*/
export const getPendingOrders = () =>
  api.get("/dispatches/pending-orders");


/*
============================================================
GET PENDING ITEMS FOR ORDER
============================================================
*/
export const getPendingOrderItems = (orderId) =>
  api.get(`/dispatches/order/${orderId}/pending`);


/*
============================================================
CREATE DISPATCH
============================================================
*/
export const createDispatch = (data) =>
  api.post("/dispatches", data);


/*
============================================================
UPDATE DISPATCH STATUS
============================================================
*/
export const updateDispatchStatus = (id, status) =>
  api.put(`/dispatches/${id}/status`, {
    status,
  });
  export const getTransporters = () => {
  return api.get("/transporters");
};
export const getVehicles = () => {
  return api.get("/vehicles");
};