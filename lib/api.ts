import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:5001/api",
  headers: {
    "Cache-Control": "no-cache",
  },
});
