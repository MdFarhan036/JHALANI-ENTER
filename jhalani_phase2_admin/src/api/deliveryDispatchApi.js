import api from "./axios";

/*
============================================================
GET DISPATCHES FOR DELIVERY TRACKING
============================================================
*/
export const getDeliveryDispatches = (params = {}) =>
  api.get("/dispatches", {
    params,
  });


/*
============================================================
GET SINGLE DISPATCH
============================================================
*/
export const getDeliveryDispatchById = (id) =>
  api.get(`/dispatches/${id}`);


/*
============================================================
UPDATE DELIVERY / DISPATCH STATUS
============================================================
*/
export const updateDeliveryDispatchStatus = (
  id,
  status
) =>
  api.put(`/dispatches/${id}/status`, {
    status,
  });