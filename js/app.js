document.addEventListener('DOMContentLoaded', () => {
  // Navigation scroll state
  const nav = document.getElementById('nav');
  if (nav) {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const cur = window.scrollY;
      if (cur > 30) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
      lastScroll = cur;
    }, { passive: true });
    
    // Check initial scroll state
    if (window.scrollY > 30) {
      nav.classList.add('scrolled');
    }
  }

  // Active navigation link tracking
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('#') && !href.startsWith('http')) {
      // Check absolute path containment or match
      const absoluteLinkPath = new URL(link.href).pathname;
      if (currentPath === absoluteLinkPath || currentPath.endsWith(href)) {
        link.classList.add('active');
      }
    }
  });

  // Reveal elements on scroll
  const revealElements = document.querySelectorAll('.reveal');
  if (revealElements.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });

    revealElements.forEach(el => observer.observe(el));
  }

  // Global Newsletter form logic
  const signupForm = document.getElementById('signup-form');
  const successMessage = document.getElementById('signup-success');
  
  if (signupForm && successMessage) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = signupForm.querySelector('input[type="email"]');
      const email = emailInput.value.trim();
      
      // Basic check
      if (!email || !email.includes('@') || email.length < 5) {
        emailInput.style.borderColor = 'var(--color-error)';
        emailInput.focus();
        
        // Dynamic error message below input
        let errorMsg = signupForm.querySelector('.error-msg');
        if (!errorMsg) {
          errorMsg = document.createElement('span');
          errorMsg.className = 'error-msg';
          errorMsg.style.color = 'var(--color-error)';
          errorMsg.style.fontSize = '0.75rem';
          errorMsg.style.display = 'block';
          errorMsg.style.marginTop = '0.5rem';
          errorMsg.style.fontFamily = 'var(--mono)';
          signupForm.after(errorMsg);
        }
        errorMsg.textContent = 'Please enter a valid email address.';
        return;
      }
      
      // Simulate API submit
      const btn = signupForm.querySelector('button');
      const originalText = btn.textContent;
      btn.textContent = 'Subscribing...';
      btn.disabled = true;
      
      setTimeout(() => {
        // Hide form and show success message
        signupForm.style.display = 'none';
        const errorMsg = signupForm.parentElement.querySelector('.error-msg');
        if (errorMsg) errorMsg.remove();
        
        successMessage.classList.add('visible');
        console.log('Registered Email:', email);
      }, 1000);
    });
  }

  // Smooth scroll offsets for anchor tags
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length > 1) {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          const top = target.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }
    });
  });

  // Dynamic Authentication Navbar Updater via navUtils
  if (window.navUtils && window.navUtils.setupNavbar) {
    window.navUtils.setupNavbar();
  }

  // Dynamic Shelf Tracker Initializer for Series and Book Details Pages
  window.initializeShelfTrackers = initializeShelfTrackers;
  initializeShelfTrackers();

  async function initializeShelfTrackers() {
    const wrappers = document.querySelectorAll('.shelf-tracker-wrap');
    if (wrappers.length === 0) return;

    const token = localStorage.getItem('auth_token');
    let trackedIds = {};

    if (token) {
      try {
        const list = await apiClient.get('/books/my-shelf');
        if (list && Array.isArray(list)) {
          list.forEach(item => {
            trackedIds[item.book_id] = item.status;
          });
        }
      } catch (error) {
        console.error('Error fetching shelf for trackers:', error);
      }
    }

    const statusLabels = {
      reading: 'Reading',
      want_to_read: 'Want to Read',
      finished: 'Finished'
    };

    wrappers.forEach(wrapper => {
      const bookId = parseInt(wrapper.getAttribute('data-book-id'));
      if (isNaN(bookId)) return;

      const currentStatus = trackedIds[bookId];
      renderTracker(wrapper, bookId, currentStatus);
    });

    // Close all tracker dropdowns on clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.shelf-tracker-wrap')) {
        document.querySelectorAll('.shelf-tracker-dropdown.open').forEach(dropdown => {
          dropdown.classList.remove('open');
        });
      }
    });

    function renderTracker(wrapper, bookId, status) {
      wrapper.innerHTML = '';
      
      const btn = document.createElement('button');
      btn.className = `shelf-tracker-btn ${status ? 'tracked' : ''}`;
      btn.innerHTML = status ? `✓ ${statusLabels[status]}` : '+ Add to Shelf';
      
      const dropdown = document.createElement('div');
      dropdown.className = 'shelf-tracker-dropdown';
      
      dropdown.innerHTML = `
        <button data-action="reading">📖 Currently Reading</button>
        <button data-action="want_to_read">🔖 Want to Read</button>
        <button data-action="finished">✅ Finished</button>
        ${status ? `<button data-action="remove" style="color:#ef4444">🗑 Remove from shelf</button>` : ''}
      `;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Close other dropdowns first
        document.querySelectorAll('.shelf-tracker-dropdown.open').forEach(d => {
          if (d !== dropdown) d.classList.remove('open');
        });
        dropdown.classList.toggle('open');
      });

      dropdown.querySelectorAll('button').forEach(itemBtn => {
        itemBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          dropdown.classList.remove('open');

          if (!token) {
            // Redirect to auth
            window.location.href = window.navUtils ? window.navUtils.getAuthRedirectUrl() : 'auth.html';
            return;
          }

          const action = itemBtn.getAttribute('data-action');
          if (action === 'remove') {
            if (!confirm('Remove this book from your shelf?')) return;
            try {
              await apiClient.delete(`/books/${bookId}/track`);
              delete trackedIds[bookId];
              renderTracker(wrapper, bookId, null);
            } catch (err) {
              console.error(err);
            }
          } else {
            const method = trackedIds[bookId] ? 'PATCH' : 'POST';
            try {
              await apiClient.request(`/books/${bookId}/track`, {
                method,
                body: { status: action }
              });
              trackedIds[bookId] = action;
              renderTracker(wrapper, bookId, action);
            } catch (err) {
              console.error(err);
            }
          }
        });
      });

      wrapper.appendChild(btn);
      wrapper.appendChild(dropdown);
    }
  }

  // Load and show notifications banner if logged in
  loadNotifications();

  async function loadNotifications() {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const notifications = await apiClient.get('/notifications');
      if (!notifications || notifications.length === 0) return;

      // Find first non-dismissed notification
      const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
      const activeNotification = notifications.find(n => !dismissed.includes(n.id));

      if (activeNotification) {
        showNotificationBanner(activeNotification);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }

  function showNotificationBanner(notif) {
    const prefix = window.navUtils ? window.navUtils.getPathPrefix() : '';

    const banner = document.createElement('div');
    banner.className = 'global-notification-banner';
    banner.style.cssText = `
      background: linear-gradient(90deg, var(--teal-deep) 0%, var(--teal) 100%);
      color: white;
      text-align: center;
      padding: 10px 20px;
      font-size: 0.9rem;
      font-family: var(--sans);
      position: relative;
      z-index: 10000;
      box-shadow: 0 4px 10px rgba(0,0,0,0.2);
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 15px;
    `;
    
    const textSpan = document.createElement('span');
    textSpan.innerHTML = `<strong>${notif.title}</strong>: ${notif.message}`;
    banner.appendChild(textSpan);

    if (notif.book_id) {
      const ctaBtn = document.createElement('button');
      ctaBtn.textContent = 'View Book';
      ctaBtn.style.cssText = `
        background: rgba(255,255,255,0.2);
        border: 1px solid white;
        color: white;
        padding: 2px 10px;
        border-radius: 4px;
        font-size: 0.75rem;
        cursor: pointer;
        font-family: var(--sans);
        transition: background 0.2s;
      `;
      ctaBtn.addEventListener('click', () => {
        if (parseInt(notif.book_id) === 1) {
          window.location.href = prefix + 'books/git-for-teams.html';
        } else {
          window.location.href = prefix + 'library.html?search=' + encodeURIComponent(notif.book_id);
        }
      });
      banner.appendChild(ctaBtn);
    }

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 1.2rem;
      cursor: pointer;
      font-weight: bold;
      padding: 0 5px;
      margin-left: auto;
    `;
    closeBtn.addEventListener('click', () => {
      const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
      dismissed.push(notif.id);
      localStorage.setItem('dismissed_notifications', JSON.stringify(dismissed));
      banner.remove();
    });
    banner.appendChild(closeBtn);

    document.body.prepend(banner);
  }
});

// Global API Helper Functions
const API_BASE_URL = window.APP_CONFIG ? window.APP_CONFIG.API_BASE_URL : 'http://127.0.0.1:8000/api';

/**
 * Opens secure PDF reader view for a specific book.
 * @param {number} bookId - Book ID
 */
window.readBook = function(bookId) {
  const token = localStorage.getItem('auth_token');
  const prefix = window.navUtils ? window.navUtils.getPathPrefix() : '';
  if (!token) {
    window.location.href = window.navUtils ? window.navUtils.getAuthRedirectUrl() : `${prefix}auth.html?redirect=${encodeURIComponent(window.location.pathname)}`;
    return;
  }

  window.open(`${prefix}books/pdf-viewer.html?bookId=${bookId}`, '_blank');
};

let progressTimeout = null;
let lastPendingProgress = null;

/**
 * Updates reading progress with debounce and page unload keepalive support.
 * @param {number} bookId - Book ID
 * @param {number} page - Current page number
 * @param {number} percentage - Reading progress percentage (0 - 100)
 * @param {boolean} [syncImmediately=false] - Whether to sync immediately without debounce
 * @returns {Promise<void>}
 */
window.updateReadingProgress = async function(bookId, page, percentage, syncImmediately = false) {
  const token = localStorage.getItem('auth_token');
  if (!token) return;

  lastPendingProgress = { bookId, page, percentage };

  if (progressTimeout) {
    clearTimeout(progressTimeout);
    progressTimeout = null;
  }

  const sendProgress = async (isKeepAlive = false) => {
    if (!lastPendingProgress) return;
    const { bookId: bId, page: p, percentage: pct } = lastPendingProgress;
    lastPendingProgress = null;

    try {
      if (isKeepAlive) {
        const baseUrl = window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL ? window.APP_CONFIG.API_BASE_URL : 'http://127.0.0.1:8000/api';
        fetch(`${baseUrl}/books/${bId}/progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            last_read_page: p,
            progress_percentage: pct,
            sync_immediately: true
          }),
          keepalive: true
        });
      } else {
        const data = await apiClient.post(`/books/${bId}/progress`, {
          last_read_page: p,
          progress_percentage: pct,
          sync_immediately: syncImmediately
        });
        console.log('Reading progress synced:', data);
      }
    } catch (error) {
      console.error('Failed to sync progress:', error);
    }
  };

  if (syncImmediately) {
    await sendProgress(false);
  } else {
    // 4 seconds debounce (3 to 5 seconds range)
    progressTimeout = setTimeout(() => {
      sendProgress(false);
    }, 4000);
  }
};

window.addEventListener('beforeunload', () => {
  if (lastPendingProgress) {
    const { bookId: bId, page: p, percentage: pct } = lastPendingProgress;
    const token = localStorage.getItem('auth_token');
    if (token) {
      const baseUrl = window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL ? window.APP_CONFIG.API_BASE_URL : 'http://127.0.0.1:8000/api';
      fetch(`${baseUrl}/books/${bId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          last_read_page: p,
          progress_percentage: pct,
          sync_immediately: true
        }),
        keepalive: true
      });
    }
  }
});

