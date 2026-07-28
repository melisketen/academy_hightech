import { describe, it, expect, beforeEach } from 'vitest';
import '../../js/utils/scroll.js';

describe('Scroll and CTA Utilities', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <section id="newsletter">
        <h2>Newsletter</h2>
        <p>Original subtitle</p>
        <input type="email" />
      </section>
      <button class="book-cta-notify" data-book-title="Docker &amp; DevOps">Notify on release</button>
    `;
  });

  it('updates newsletter text when book CTA is clicked', () => {
    const cta = document.querySelector('.book-cta-notify');
    cta.click();

    const subtitle = document.querySelector('#newsletter p');
    expect(subtitle.textContent).toContain('Docker & DevOps');
  });
});
