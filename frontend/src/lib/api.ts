import axios from 'axios';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getExportPdfUrl = (invoiceId: string) => {
  return `${API_BASE_URL}/delivery/export-pdf/${invoiceId}`;
};
