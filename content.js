/* Single editable source for personal, gallery, and achievement content. */
window.PORTFOLIO_CONTENT = {
  profile: {
    name: 'AnNT',
    kicker: 'A quiet corner of the web',
    role: 'developer · observer · careful maker',
    bio: 'I enjoy turning complicated ideas into calm, useful digital experiences — and keeping a record of what I learn along the way.',
    note: 'Learning in public, one thoughtful project at a time.',
    github: { label: 'GitHub', url: 'https://github.com/AnNT-k7' },
    linkedin: { label: 'LinkedIn soon', url: '' },
    cv: { label: 'CV soon', url: '' }
  },
  gallery: {
    intro: 'A future home for personal photographs. These neutral frames are placeholders, not claimed memories.',
    items: [
      { title: 'Window light', caption: 'Future photograph · placeholder', image: 'assets/photo-placeholder-01.svg', alt: 'Abstract blue window-light placeholder', placeholder: true },
      { title: 'A walk outside', caption: 'Future photograph · placeholder', image: 'assets/photo-placeholder-02.svg', alt: 'Abstract landscape placeholder in blue and ivory', placeholder: true },
      { title: 'Notes from here', caption: 'Future photograph · placeholder', image: 'assets/photo-placeholder-03.svg', alt: 'Abstract paper and handwriting placeholder', placeholder: true }
    ]
  },
  achievements: [
    {
      id: 'first-steps', title: 'First steps, carefully made', category: 'Learning note', year: '2026',
      summary: 'A sample card showing where a meaningful learning milestone can live.',
      story: 'This is demonstration copy, not a factual credential. Replace it with the story behind a real milestone: what changed, what was difficult, and what you carried forward.',
      facts: ['Demo entry — not a real credential', 'Designed for short or long stories', 'Safe to replace in content.js'], links: [],
      image: 'assets/achievement-placeholder-01.svg', imageAlt: 'Abstract blue ribbons and paper shapes', placeholder: true
    },
    {
      id: 'patient-practice', title: 'Patient practice', category: 'Process note', year: '2026',
      summary: 'A sample space for documenting consistency, iteration, and quiet progress.',
      story: 'Use this page for more than a title. A useful achievement story can explain the starting point, the work, the result, and the lesson without exaggeration.',
      facts: ['Demo entry — not a real credential', 'Supports facts and related links', 'Direct URL remains shareable'],
      links: [{ label: 'GitHub profile', url: 'https://github.com/AnNT-k7' }],
      image: 'assets/achievement-placeholder-02.svg', imageAlt: 'Abstract staircase in washed navy', placeholder: true
    },
    {
      id: 'room-to-grow', title: 'Room to grow', category: 'Archive note', year: 'Next',
      summary: 'A sample closing card, ready for the next honest accomplishment.',
      story: 'This intentionally unfinished entry keeps the archive open. Add or remove objects in the achievements array and the home rail and detail page will update together.',
      facts: ['Demo entry — not a real credential', 'Additional entries are supported', 'Common image ratios are accepted'], links: [],
      image: 'assets/achievement-placeholder-03.svg', imageAlt: 'Abstract open doorway and a small star', placeholder: true
    }
  ]
};
