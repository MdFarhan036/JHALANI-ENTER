import axios from "./axios";

/* ============================================================
   DELIVERY LIST
============================================================ */

export const getDeliveries = () => {
  return axios.get("/deliveries");
};


/* ============================================================
   READY FOR DELIVERY
============================================================ */

export const getReadyDeliveries = () => {
  return axios.get("/deliveries/ready");
};


/* ============================================================
   DELIVERY DETAILS
============================================================ */

export const getDeliveryById = (id) => {
  return axios.get(`/deliveries/${id}`);
};


/* ============================================================
   ASSIGN DELIVERY
============================================================ */

export const assignDelivery = (payload) => {
  return axios.post("/deliveries/assign", payload);
};


/* ============================================================
   UPDATE DELIVERY STATUS
============================================================ */

export const updateDeliveryStatus = (
  id,
  payload
) => {
  return axios.put(
    `/deliveries/${id}/status`,
    payload
  );
};


/* ============================================================
   GENERATE OTP
============================================================ */

export const generateDeliveryOTP = (id) => {
  return axios.post(
    `/deliveries/${id}/generate-otp`
  );
};


/* ============================================================
   VERIFY OTP
============================================================ */

export const verifyDeliveryOTP = (
  id,
  otp
) => {
  return axios.post(
    `/deliveries/${id}/verify-otp`,
    {
      otp,
    }
  );
};


/* ============================================================
   TRACKING
============================================================ */

export const getDeliveryTracking = (id) => {
  return axios.get(
    `/deliveries/${id}/tracking`
  );
};


/* ============================================================
   ADD TRACKING
============================================================ */

export const addDeliveryTracking = (
  id,
  payload
) => {
  return axios.post(
    `/deliveries/${id}/tracking`,
    payload
  );
};