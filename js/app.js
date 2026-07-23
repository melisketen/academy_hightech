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

  // Dynamic Authentication Navbar Updater
  const navLinksContainer = document.getElementById('nav') ? document.querySelector('.nav-links') : null;
  if (navLinksContainer) {
    const token = localStorage.getItem('auth_token');
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    
    // Determine path prefixes
    const isSubdirectory = window.location.pathname.includes('/books/') || window.location.pathname.includes('/series/');
    const prefix = isSubdirectory ? '../' : '';

    let linksHtml = `
      <li><a href="${prefix}manifesto.html">Manifesto</a></li>
      <li><a href="${prefix}index.html#series">Series</a></li>
    `;

    if (token && user) {
      const subBadge = (user.subscription_status || 'free').toUpperCase();
      const adminLink = user.is_admin ? `<li><a href="${prefix}admin.html">Admin</a></li>` : '';
      linksHtml += `
        <li><a href="${prefix}library.html">Library</a></li>
        <li><a href="${prefix}profile.html">Profile</a></li>
        <li><a href="${prefix}subscription.html">Subscription</a></li>
        ${adminLink}
        <li><a href="#" id="nav-logout-btn">Sign Out</a></li>
        <li><span class="nav-user-badge" style="color: var(--teal); font-family: var(--mono); font-size: 0.8rem; border: 1px solid var(--teal); padding: 2px 6px; border-radius: 4px; vertical-align: middle;">${subBadge}</span></li>
      `;
    } else {
      linksHtml += `
        <li><a href="${prefix}books/git-for-teams.html">First title</a></li>
        <li><a href="${prefix}author.html">Author</a></li>
        <li><a href="${prefix}auth.html" class="btn-signin" style="background: var(--navy); color: white; padding: 0.4rem 0.8rem; border-radius: 4px; font-weight: 500; text-decoration: none;">Sign In</a></li>
      `;
    }

    linksHtml += `<li><a href="https://academyhightech.com.tr" class="lang-switch">TR ↗</a></li>`;
    navLinksContainer.innerHTML = linksHtml;

    // Logout listener
    const logoutBtn = document.getElementById('nav-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = prefix + 'index.html';
      });
    }

    // Mobile menu toggle — the nav-links list has no room to lay out
    // horizontally below the responsive breakpoint, so collapse it behind
    // a hamburger button instead.
    let navToggle = nav.querySelector('.nav-toggle');
    if (!navToggle) {
      navToggle = document.createElement('button');
      navToggle.className = 'nav-toggle';
      navToggle.type = 'button';
      navToggle.setAttribute('aria-label', 'Toggle navigation menu');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.innerHTML = '<span class="nav-toggle-bars"><span></span><span></span><span></span></span>';
      nav.appendChild(navToggle);
    }

    navToggle.addEventListener('click', () => {
      const isOpen = navLinksContainer.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close the mobile menu after choosing a link, or on outside click
    navLinksContainer.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        navLinksContainer.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('click', (e) => {
      if (navLinksContainer.classList.contains('open') && !nav.contains(e.target)) {
        navLinksContainer.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
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
        const response = await fetch(`${API_BASE_URL}/books/my-shelf`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        if (response.ok) {
          const list = await response.json();
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
            const prefix = window.location.pathname.includes('/series/') ? '../' : '';
            window.location.href = `${prefix}auth.html?redirect=${encodeURIComponent(window.location.pathname)}`;
            return;
          }

          const action = itemBtn.getAttribute('data-action');
          if (action === 'remove') {
            if (!confirm('Remove this book from your shelf?')) return;
            try {
              const res = await fetch(`${API_BASE_URL}/books/${bookId}/track`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/json'
                }
              });
              if (res.ok) {
                delete trackedIds[bookId];
                renderTracker(wrapper, bookId, null);
              }
            } catch (err) {
              console.error(err);
            }
          } else {
            const method = trackedIds[bookId] ? 'PATCH' : 'POST';
            try {
              const res = await fetch(`${API_BASE_URL}/books/${bookId}/track`, {
                method,
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/json'
                },
                body: JSON.stringify({ status: action })
              });
              if (res.ok) {
                trackedIds[bookId] = action;
                renderTracker(wrapper, bookId, action);
              }
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
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (!response.ok) return;
      const notifications = await response.json();
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
    const isSubdirectory = window.location.pathname.includes('/books/') || window.location.pathname.includes('/series/');
    const prefix = isSubdirectory ? '../' : '';

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

window.readBook = function(bookId) {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    const isSubdirectory = window.location.pathname.includes('/books/') || window.location.pathname.includes('/series/');
    const prefix = isSubdirectory ? '../' : '';
    window.location.href = prefix + 'auth.html?redirect=' + encodeURIComponent(window.location.pathname);
    return;
  }

  const isSubdirectory = window.location.pathname.includes('/books/') || window.location.pathname.includes('/series/');
  const prefix = isSubdirectory ? '../' : '';
  window.open(prefix + 'books/pdf-viewer.html?bookId=' + bookId, '_blank');
};

window.updateReadingProgress = async function(bookId, page, percentage, syncImmediately = false) {
  const token = localStorage.getItem('auth_token');
  if (!token) return;

  try {
    const response = await fetch(`${API_BASE_URL}/books/${bookId}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        last_read_page: page,
        progress_percentage: percentage,
        sync_immediately: syncImmediately
      })
    });

    const data = await response.json();
    console.log('Reading progress synced:', data);
  } catch (error) {
    console.error('Failed to sync progress:', error);
  }
};

