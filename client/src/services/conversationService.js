const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const request = async (path, options = {}) => {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch (error) {
    throw new Error(
      `Cannot reach the backend at ${API_BASE_URL}. Start the server with npm run server.`
    );
  }

  const payload = await response.json();

  if (!response.ok || payload.success === false) {
    const message =
      payload?.error?.message || 'The request could not be completed.';
    throw new Error(message);
  }

  return payload.data;
};

export const createConversation = async (payload = {}) => {
  return request('/conversations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const getConversation = async (conversationId) => {
  return request(`/conversations/${conversationId}`);
};

export const sendMessage = async (conversationId, message) => {
  return request(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
};

export const updateCustomer = async (conversationId, customerData) => {
  return request(`/conversations/${conversationId}/customer`, {
    method: 'PATCH',
    body: JSON.stringify(customerData),
  });
};

export const updateVehicle = async (conversationId, vehicleData) => {
  return request(`/conversations/${conversationId}/vehicle`, {
    method: 'PATCH',
    body: JSON.stringify(vehicleData),
  });
};
