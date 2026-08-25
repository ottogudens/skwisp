import portalClient from './client';

// Auth
export const portalLogin = (rut, password) =>
  portalClient.post('/auth/login/', { rut, password });

// Perfil del cliente
export const getMe = () => portalClient.get('/me/');

// Facturas
export const getInvoices = (params) => portalClient.get('/invoices/', { params });
export const createPayment = (invoiceId) =>
  portalClient.post(`/invoices/${invoiceId}/pay/`);

// Tickets
export const getTickets = (params) => portalClient.get('/tickets/', { params });
export const getTicket = (id) => portalClient.get(`/tickets/${id}/`);
export const createTicket = (data) => portalClient.post('/tickets/', data);
