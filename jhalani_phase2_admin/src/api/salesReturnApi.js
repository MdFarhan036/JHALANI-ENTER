import api from "./axios";

/*
============================================================
SALES RETURNS
============================================================
*/

export const getSalesReturns = () =>
  api.get("/sales-returns");

export const getSalesReturnById = (id) =>
  api.get(`/sales-returns/${id}`);


/*
============================================================
RETURNABLE ORDERS
============================================================
*/

export const getReturnableOrders = () =>
  api.get("/sales-returns/orders/list");

export const getReturnableOrderItems = (orderId) =>
  api.get(
    `/sales-returns/orders/${orderId}/items`
  );


/*
============================================================
CREATE
============================================================
*/

export const createSalesReturn = (data) =>
  api.post(
    "/sales-returns",
    data
  );


/*
============================================================
UPDATE
============================================================
*/

export const updateSalesReturn = (
  id,
  data
) =>
  api.put(
    `/sales-returns/${id}`,
    data
  );


/*
============================================================
COMPLETE
============================================================
*/

export const completeSalesReturn = (id) =>
  api.put(
    `/sales-returns/${id}/complete`
  );


/*
============================================================
CANCEL
============================================================
*/

export const cancelSalesReturn = (id) =>
  api.put(
    `/sales-returns/${id}/cancel`
  );