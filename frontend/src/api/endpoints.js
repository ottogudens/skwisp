import apiClient from './client';

// Clientes
export const getClients = (params) => apiClient.get('/clients/', { params });
export const getClient = (id) => apiClient.get(`/clients/${id}/`);
export const createClient = (data) => apiClient.post('/clients/', data);
export const updateClient = (id, data) => apiClient.patch(`/clients/${id}/`, data);
export const suspendClient = (id) => apiClient.post(`/clients/${id}/suspend/`);
export const reactivateClient = (id) => apiClient.post(`/clients/${id}/reactivate/`);

// Planes
export const getPlans = () => apiClient.get('/plans/');

// Facturación
export const getInvoices = (params) => apiClient.get('/invoices/', { params });
export const getInvoice = (id) => apiClient.get(`/invoices/${id}/`);
export const createPaymentPreference = (invoiceId) =>
  apiClient.post(`/invoices/${invoiceId}/create_payment/`);
export const downloadInvoicePdf = (invoiceId) => 
  apiClient.get(`/invoices/${invoiceId}/pdf/`, { responseType: 'blob' });

// Pagos
export const getPayments = (params) => apiClient.get('/payments/', { params });

// Tickets
export const getTickets = (params) => apiClient.get('/tickets/', { params });
export const getTicket = (id) => apiClient.get(`/tickets/${id}/`);
export const createTicket = (data) => apiClient.post('/tickets/', data);
export const addTicketComment = (ticketId, body) =>
  apiClient.post(`/tickets/${ticketId}/comments/`, { body });
export const updateTicketStatus = (ticketId, status) =>
  apiClient.patch(`/tickets/${ticketId}/`, { status });

// Inventario
export const getEquipment = (params) => apiClient.get('/equipment/', { params });
export const createEquipment = (data) => apiClient.post('/equipment/', data);
export const assignEquipment = (id, clientId) =>
  apiClient.post(`/equipment/${id}/assign/`, { client: clientId });

// RADIUS / sync
export const getRadiusSyncLogs = (params) => apiClient.get('/radius-sync-logs/', { params });
export const forceSyncClient = (clientId) =>
  apiClient.post(`/clients/${clientId}/force_sync/`);

// Dashboard
export const getDashboardSummary = () => apiClient.get('/dashboard/summary/');

// Auth
export const login = (username, password) =>
  apiClient.post('/auth/login/', { username, password });
