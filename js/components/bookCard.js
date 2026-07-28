/* Reusable Book Preview Card Component with JSDoc */
(function() {
  /**
   * @typedef {Object} BookSpec
   * @property {string} label - Specification label (e.g. 'Chapters', 'Focus')
   * @property {string} value - Specification value description
   */

  /**
   * @typedef {Object} MockupConfig
   * @property {string} [bg] - Background style
   * @property {string} [borderColor] - Border color style
   * @property {string} [color] - Text color style
   * @property {string} [lineBg] - Divider/line background style
   * @property {string} [subColor] - Subtitle text color
   * @property {string} [footerColor] - Footer text color
   * @property {string} [titleSize] - Font size for mockup title
   * @property {string} [subText] - Subtitle text description
   */

  /**
   * @typedef {Object} BookPreview
   * @property {number|string} id - Unique book identifier
   * @property {string} title - Book title
   * @property {string} series - Series name (e.g. 'Developer Series')
   * @property {string} description - Summary paragraph
   * @property {'stable'|'alpha'|'planned'} releaseType - Release lifecycle stage
   * @property {string} badgeText - Badge display text
   * @property {BookSpec[]} specs - Key specification list
   * @property {string} [coverImage] - Path to cover image asset
   * @property {MockupConfig} [mockupConfig] - Mockup styling for unpublished drafts
   * @property {string} [detailUrl] - URL for book details page
   */

  /**
   * Generates HTML string for a book preview card.
   * @param {BookPreview} data - Book preview data object
   * @returns {string} Rendered HTML string
   */
  function createBookPreviewCardHtml(data) {
    const prefix = window.navUtils ? window.navUtils.getPathPrefix() : '';
    const isStable = data.releaseType === 'stable';
    const isAlpha = data.releaseType === 'alpha';

    // Badge styling
    let badgeBg = 'rgba(100, 116, 139, 0.1)';
    let badgeColor = 'var(--slate)';
    if (isStable) {
      badgeBg = 'var(--teal-glow)';
      badgeColor = 'var(--teal-deep)';
    } else if (isAlpha) {
      badgeBg = 'rgba(217, 119, 6, 0.1)';
      badgeColor = '#d97706';
    }

    // Action button / link markup per standard rules
    let actionHtml = '';
    if (isStable) {
      actionHtml = `
        <a href="${data.detailUrl || `${prefix}books/git-for-teams.html`}" class="btn-primary">
          Explore book details
          <span class="arrow">→</span>
        </a>
      `;
    } else if (isAlpha) {
      actionHtml = `
        <a href="#newsletter" class="btn-secondary book-cta-notify" data-book-title="${encodeURIComponent(data.title)}">Get early access</a>
      `;
    } else {
      actionHtml = `
        <a href="#newsletter" class="btn-secondary book-cta-notify" data-book-title="${encodeURIComponent(data.title)}">Notify on release</a>
      `;
    }

    // Cover or Mockup rendering
    let visualHtml = '';
    if (data.coverImage) {
      visualHtml = `
        <div class="book-cover-container">
          <div class="book-cover" style="background-image: url('${data.coverImage}');"></div>
        </div>
      `;
    } else if (data.mockupConfig) {
      const mc = data.mockupConfig;
      visualHtml = `
        <div>
          <div class="book-mock" style="${mc.bg ? `background: ${mc.bg};` : ''} ${mc.borderColor ? `border-color: ${mc.borderColor};` : ''} ${mc.color ? `color: ${mc.color};` : ''}">
            <div class="book-mock-logo" ${mc.color ? `style="color: ${mc.color};"` : ''}>academy<span class="slash">/</span>hightech</div>
            <div class="book-mock-line" ${mc.lineBg ? `style="background: ${mc.lineBg};"` : ''}></div>
            <div class="book-mock-title" style="font-size: ${mc.titleSize || '2rem'}; ${mc.color ? `color: ${mc.color};` : ''}">${data.title.replace(' + ', ' +<br>').replace(' & ', ' &amp;<br>').replace(' for ', ' for<br>').replace(' in ', ' in<br>')}</div>
            <div class="book-mock-divider" ${mc.lineBg ? `style="background: ${mc.lineBg};"` : ''}></div>
            <div class="book-mock-sub" ${mc.subColor ? `style="color: ${mc.subColor};"` : ''}>${mc.subText || ''}</div>
            <div class="book-mock-footer" ${mc.footerColor ? `style="color: ${mc.footerColor};"` : ''}>
              <div>${data.series}</div>
              <div class="book-mock-author" ${mc.color ? `style="color: ${mc.color};"` : ''}>Prof. Dr. İsmail KIRBAŞ</div>
              <div>${data.badgeText}</div>
            </div>
          </div>
        </div>
      `;
    }

    // Specs list
    let specsHtml = '';
    if (data.specs && data.specs.length > 0) {
      specsHtml = `
        <ul class="featured-specs" style="margin-bottom: 2rem;">
          ${data.specs.map(spec => `<li><span>${spec.label}</span><span>${spec.value}</span></li>`).join('')}
        </ul>
      `;
    }

    return `
      <section class="featured-grid" style="border-bottom: 1px solid var(--slate-200); padding-bottom: 4rem; ${!isStable ? 'opacity: 0.85;' : ''}">
        ${visualHtml}
        <div>
          <span class="aside-label" style="background: ${badgeBg}; color: ${badgeColor}; padding: 0.2rem 0.5rem; border-radius: 3px; font-size: 0.7rem; font-weight: 600; display: inline-block; margin-bottom: 1rem;">
            ${data.badgeText}
          </span>
          <h2 style="font-family: var(--display); font-size: 2.2rem; font-weight: 400; margin-bottom: 1rem; color: var(--navy);">
            ${data.title}
          </h2>
          <p style="color: var(--slate); font-size: 1.05rem; line-height: 1.7; margin-bottom: 1.5rem;">
            ${data.description}
          </p>
          ${specsHtml}
          <div style="display: flex; gap: 1rem; align-items: center; margin-top: 1rem; flex-wrap: wrap;">
            ${actionHtml}
            <div class="shelf-tracker-wrap" data-book-id="${data.id}"></div>
          </div>
        </div>
      </section>
    `;
  }

  window.bookCardComponent = {
    createBookPreviewCardHtml
  };
})();
