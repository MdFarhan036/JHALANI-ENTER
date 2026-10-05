import api from "./axios";

/*
============================================================
GET SALES ORDERS
============================================================
*/

export const getOrders = (params = {}) =>
  api.get("/orders", {
    params,
  });


/*
============================================================
GET SINGLE SALES ORDER
============================================================
*/

export const getOrderById = (id) =>
  api.get(`/orders/${id}`);


/*
============================================================
CREATE SALES ORDER
============================================================
*/

export const createOrder = (data) =>
  api.post("/orders", data);


/*
============================================================
CONFIRM SALES ORDER
============================================================
*/

export const confirmOrder = (id) =>
  api.put(`/orders/${id}/confirm`);