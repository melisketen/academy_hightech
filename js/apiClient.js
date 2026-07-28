/* Centralized API Client with Sanctum HttpOnly Cookie & CSRF Handshake Support */
(function() {
  /**
   * @typedef {Object} RequestOptions
   * @property {string} [method='GET'] - HTTP method
   * @property {Object<string, string>} [headers] - Request headers
   * @property {Object|FormData|string} [body] - Request payload body
   */

  /**
   * @typedef {Object} User
   * @property {number} id - User ID
   * @property {string} name - User full name
   * @property {string} email - User email address
   * @property {string} subscription_status - Subscription tier ('free' | 'standard' | 'premium')
   * @property {boolean} is_admin - Admin privileges flag
   * @property {Object} [profile_info] - Profile extra settings
   */

  /**
   * @typedef {Object} ApiClient
   * @property {function(string, RequestOptions=): Promise<any>} request - Core HTTP request executor
   * @property {function(string, RequestOptions=): Promise<any>} get - HTTP GET request
   * @property {function(string, Object=, RequestOptions=): Promise<any>} post - HTTP POST request
   * @property {function(string, Object=, RequestOptions=): Promise<any>} put - HTTP PUT request
   * @property {function(string, Object=, RequestOptions=): Promise<any>} patch - HTTP PATCH request
   * @property {function(string, RequestOptions=): Promise<any>} delete - HTTP DELETE request
   * @property {function(): Promise<void>} ensureCsrfToken - Fetches Sanctum CSRF cookie
   * @property {function(string, string=): void} showToast - Displays an on-screen toast notification
   */

  /**
   * Retrieves the base URL for API requests.
   * @returns {string} The API base URL
   */
  const getApiBaseUrl = () => {
    return window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL 
      ? window.APP_CONFIG.API_BASE_URL 
      : 'http://127.0.0.1:8000/api';
  };

  /**
   * Helper to retrieve a cookie value by name.
   * @param {string} name - Cookie name
   * @returns {string|null} Cookie value
   */
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  /**
   * Fetches the Sanctum CSRF cookie handshake.
   * @returns {Promise<void>}
   */
  async function ensureCsrfToken() {
    const baseUrl = getApiBaseUrl();
    const host = baseUrl.replace(/\/api\/?$/, '');
    try {
      await fetch(`${host}/sanctum/csrf-cookie`, {
        credentials: 'include',
        method: 'GET'
      });
    } catch (e) {
      console.error('Failed to fetch CSRF cookie:', e);
    }
  }

  /**
   * Displays a floating toast notification message on screen.
   * @param {string} message - Message text to display
   * @param {'error'|'success'} [type='error'] - Toast type styling
   */
  function showToast(message, type = 'error') {
    const existing = document.getElementById('global-api-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'global-api-toast';
    const bgColor = type === 'error' ? '#EF4444' : '#14B8A6';
    
    toast.style.cssText = `
      position: fixed;
      bottom: 25px;
      right: 25px;
      background: ${bgColor};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 0.9rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 100000;
      display: flex;
      align-items: center;
      gap: 12px;
      animation: toastIn 0.3s ease;
    `;

    toast.innerHTML = `
      <span>${message}</span>
      <button style="background:none; border:none; color:white; font-size:1.2rem; cursor:pointer; padding:0; line-height:1;" onclick="this.parentElement.remove()">&times;</button>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, 4500);
  }

  /**
   * Executes an HTTP request against the API backend using HttpOnly cookies and CSRF protection.
   * @param {string} endpoint - API endpoint path (e.g. '/books/new')
   * @param {RequestOptions} [options={}] - Fetch configuration options
   * @returns {Promise<any>} Parsed JSON response data or text string
   */
  async function request(endpoint, options = {}) {
    const baseUrl = getApiBaseUrl();
    const url = endpoint.startsWith('http://') || endpoint.startsWith('https://') 
      ? endpoint 
      : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const headers = options.headers || {};
    
    // Add Content-Type if body is provided and not FormData
    if (options.body && !(options.body instanceof FormData)) {
      if (!headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/json';
      }
      if (typeof options.body === 'object' && !(options.body instanceof URLSearchParams)) {
        options.body = JSON.stringify(options.body);
      }
    }

    if (!headers['Accept'] && !headers['accept']) {
      headers['Accept'] = 'application/json';
    }

    // Always include credentials (HttpOnly cookies)
    options.credentials = 'include';

    // For stateful mutating requests, ensure we have a valid XSRF-TOKEN cookie
    const method = (options.method || 'GET').toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      let xsrfToken = getCookie('XSRF-TOKEN');
      if (!xsrfToken) {
        await ensureCsrfToken();
        xsrfToken = getCookie('XSRF-TOKEN');
      }
      if (xsrfToken && !headers['X-XSRF-TOKEN'] && !headers['x-xsrf-token']) {
        headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
      }
    }

    options.headers = headers;

    let response;
    try {
      response = await fetch(url, options);
    } catch (networkError) {
      showToast('Ağ bağlantı hatası veya sunucuya erişilemiyor.', 'error');
      throw networkError;
    }

    // Handle 401 Unauthorized
    if (response.status === 401) {
      localStorage.removeItem('user');
      showToast('Oturum süresi doldu. Giriş sayfasına yönlendiriliyorsunuz.', 'error');
      
      const isSubdirectory = window.location.pathname.includes('/books/') || window.location.pathname.includes('/series/');
      const prefix = isSubdirectory ? '../' : '';
      
      setTimeout(() => {
        window.location.href = `${prefix}auth.html?redirect=${encodeURIComponent(window.location.pathname)}`;
      }, 1000);
      
      const err = new Error('Unauthorized');
      err.status = 401;
      throw err;
    }

    // Parse response
    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (e) {
        data = null;
      }
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      let errorMessage = 'Bir hata oluştu.';
      if (data) {
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.errors) {
          // Laravel validation errors
          const firstKey = Object.keys(data.errors)[0];
          if (firstKey && data.errors[firstKey][0]) {
            errorMessage = data.errors[firstKey][0];
          }
        }
      }
      showToast(errorMessage, 'error');
      
      const err = new Error(errorMessage);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  }

  /** @type {ApiClient} */
  window.apiClient = {
    request,
    get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
    post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),
    put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body }),
    patch: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PATCH', body }),
    delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
    ensureCsrfToken,
    showToast
  };
})();
