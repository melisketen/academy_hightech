import { describe, it, expect } from 'vitest';
import '../../js/utils/navigation.js';
import '../../js/components/bookCard.js';

describe('BookCard Component', () => {
  it('renders stable release card correctly with Explore book details', () => {
    const data = {
      id: 1,
      title: 'Git for Teams',
      series: 'Developer Series',
      description: 'Professional version control.',
      releaseType: 'stable',
      badgeText: 'Stable Release v1.0.1',
      specs: [{ label: 'Chapters', value: '5' }]
    };

    const html = window.bookCardComponent.createBookPreviewCardHtml(data);
    expect(html).toContain('Git for Teams');
    expect(html).toContain('Stable Release v1.0.1');
    expect(html).toContain('Explore book details');
    expect(html).toContain('data-book-id="1"');
  });

  it('renders planned release card correctly with Notify on release', () => {
    const data = {
      id: 2,
      title: 'React + TypeScript',
      series: 'Developer Series',
      description: 'Type-safe web apps.',
      releaseType: 'planned',
      badgeText: 'Planned Release · Q4 2026',
      specs: []
    };

    const html = window.bookCardComponent.createBookPreviewCardHtml(data);
    expect(html).toContain('React + TypeScript');
    expect(html).toContain('Planned Release · Q4 2026');
    expect(html).toContain('Notify on release');
  });
});
