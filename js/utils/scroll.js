/* Hash and Smooth Scroll Utility with JSDoc */
(function() {
  /**
   * Initializes smooth scrolling for anchor links and hash navigation (#newsletter).
   */
  function initHashScroll() {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash) {
        const target = document.querySelector(hash);
        if (target) {
          setTimeout(() => {
            const top = target.getBoundingClientRect().top + window.scrollY - 80;
            window.scrollTo({ top, behavior: 'smooth' });

            if (hash === '#newsletter') {
              const emailInput = target.querySelector('input[type="email"]');
              if (emailInput) {
                emailInput.focus();
              }
            }
          }, 100);
        }
      }
    };

    window.addEventListener('DOMContentLoaded', handleHash);
    window.addEventListener('hashchange', handleHash);

    document.addEventListener('click', (e) => {
      const cta = e.target.closest('.book-cta-notify');
      if (cta) {
        const bookTitle = decodeURIComponent(cta.getAttribute('data-book-title') || '');
        const newsletterSection = document.querySelector('#newsletter');
        if (newsletterSection && bookTitle) {
          const subtitle = newsletterSection.querySelector('p');
          if (subtitle && !subtitle.dataset.originalText) {
            subtitle.dataset.originalText = subtitle.textContent;
          }
          if (subtitle) {
            subtitle.textContent = `Get notified when "${bookTitle}" releases or compiles updates.`;
          }
        }
      }
    });
  }

  initHashScroll();

  /**
   * @typedef {Object} ScrollUtils
   * @property {function(): void} initHashScroll - Initializes hash anchor scroll listener
   */

  /** @type {ScrollUtils} */
  window.scrollUtils = {
    initHashScroll
  };
})();
