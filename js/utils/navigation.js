/* Navigation and UI Utilities with JSDoc Type Definitions */
(function() {
  /**
   * @typedef {Object} NavUtils
   * @property {function(): string} getPathPrefix - Returns relative directory prefix ('../' or '') based on current page location
   * @property {function(): string} getAuthRedirectUrl - Returns login redirect URL containing encoded return path
   * @property {function(): void} setupNavbar - Dynamically builds and initializes the header navigation links, mobile toggler, and user auth badges
   */

  /**
   * Determines relative path prefix based on whether current page is in a subdirectory ('/books/' or '/series/').
   * @returns {string} Relative path prefix ('../' or '')
   */
  function getPathPrefix() {
    const isSubdirectory = window.location.pathname.includes('/books/') || window.location.pathname.includes('/series/');
    return isSubdirectory ? '../' : '';
  }

  /**
   * Constructs login redirect URL with current pathname as return query parameter.
   * @returns {string} Full redirect URL string (e.g. '../auth.html?redirect=...')
   */
  function getAuthRedirectUrl() {
    return getPathPrefix() + 'auth.html?redirect=' + encodeURIComponent(window.location.pathname);
  }

  /**
   * Sets up and renders the responsive navigation bar and session state.
   * @returns {void}
   */
  function setupNavbar() {
    const nav = document.getElementById('nav');
    const navLinksContainer = nav ? nav.querySelector('.nav-links') : null;
    if (!navLinksContainer) return;

    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    
    const prefix = getPathPrefix();

    let linksHtml = `
      <li><a href="${prefix}manifesto.html">Manifesto</a></li>
      <li><a href="${prefix}index.html#series">Series</a></li>
    `;

    if (user) {
      const subBadge = (user.subscription_status || 'standard').toUpperCase();
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
      logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          if (window.apiClient) {
            await window.apiClient.post('/auth/logout');
          }
        } catch (err) {}
        localStorage.removeItem('user');
        window.location.href = prefix + 'index.html';
      });
    }

    // Mobile menu toggle
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

  /** @type {NavUtils} */
  window.navUtils = {
    getPathPrefix,
    getAuthRedirectUrl,
    setupNavbar
  };
})();
