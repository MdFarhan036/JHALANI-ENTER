import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const partyLedgerApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getParties = async () => {
  const response = await partyLedgerApi.get("/party-ledger/parties");
  return response.data;
};

export const getPartyLedger = async (partyId) => {
  const response = await partyLedgerApi.get(
    `/party-ledger/${partyId}`
  );

  return response.data;
};

export const getPartyLedgerSummary = async (partyId) => {
  const response = await partyLedgerApi.get(
    `/party-ledger/${partyId}/summary`
  );

  return response.data;
};

export default partyLedgerApi;