/* The one editable content source. Empty link URLs become disabled controls. */
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
    intro: 'A future home for personal photographs. These blue studies are placeholders, not claimed memories.',
    items: [
      { title: 'Window light', caption: 'Future photograph · placeholder', image: 'assets/photo-placeholder-01.svg', alt: 'Abstract blue window-light placeholder', placeholder: true },
      { title: 'A walk outside', caption: 'Future photograph · placeholder', image: 'assets/photo-placeholder-02.svg', alt: 'Abstract landscape placeholder in blue and ivory', placeholder: true },
      { title: 'Notes from here', caption: 'Future photograph · placeholder', image: 'assets/photo-placeholder-03.svg', alt: 'Abstract paper and handwriting placeholder', placeholder: true }
    ]
  },
  achievements: [
    {
      id: 'first-steps', title: 'First steps, carefully made', category: 'Learning note', date: '2026-09-18', year: '2026',
      summary: 'A sample card showing where a meaningful learning milestone can live.',
      story: 'This is demonstration copy, not a factual credential. Replace it with the story behind a real milestone: what changed, what was difficult, and what you carried forward.',
      facts: ['Demo entry — not a real credential', 'Designed for short or long stories', 'Safe to replace in content.js'], links: [],
      image: 'assets/achievement-placeholder-01.svg', imageAlt: 'Abstract blue ribbons and paper shapes', placeholder: true
    },
    {
      id: 'patient-practice', title: 'Patient practice', category: 'Process note', date: '2026-08-03', year: '2026',
      summary: 'A sample space for documenting consistency, iteration, and quiet progress.',
      story: 'Use this page for more than a title. A useful achievement story can explain the starting point, the work, the result, and the lesson without exaggeration.',
      facts: ['Demo entry — not a real credential', 'Supports facts and related links', 'Direct URL remains shareable'],
      links: [{ label: 'GitHub profile', url: 'https://github.com/AnNT-k7' }],
      image: 'assets/achievement-placeholder-02.svg', imageAlt: 'Abstract staircase in washed navy', placeholder: true
    },
    {
      id: 'room-to-grow', title: 'Room to grow', category: 'Archive note', date: '2026-06-21', year: '2026',
      summary: 'A sample closing card, ready for the next honest accomplishment.',
      story: 'This intentionally unfinished entry keeps the archive open. Add or remove objects in the achievements array and both views update together.',
      facts: ['Demo entry — not a real credential', 'Additional entries are supported', 'Common image ratios are accepted'], links: [],
      image: 'assets/achievement-placeholder-03.svg', imageAlt: 'Abstract open doorway and a small star', placeholder: true
    },
    {
      id: 'small-systems', title: 'Small systems, tended well', category: 'Build note', date: '2026-04-12', year: '2026',
      summary: 'Placeholder copy for a future project or technical milestone.',
      story: 'Replace this demonstration story with a concise account of a real project, the choices behind it, and what it made possible.',
      facts: ['Demo entry — not a real credential', 'Fourth item in the dated sample archive'], links: [],
      image: 'assets/achievement-placeholder-01.svg', imageAlt: 'Abstract blue ribbons and paper shapes', placeholder: true
    },
    {
      id: 'useful-details', title: 'The useful details', category: 'Craft note', date: '2026-02-08', year: '2026',
      summary: 'Placeholder copy for a future reflection on thoughtful craft.',
      story: 'This demonstration entry shows how the same reusable detail template supports another dated archive record.',
      facts: ['Demo entry — not a real credential', 'Fifth item in the dated sample archive'], links: [],
      image: 'assets/achievement-placeholder-02.svg', imageAlt: 'Abstract staircase in washed navy', placeholder: true
    },
    {
      id: 'earlier-note', title: 'An earlier note', category: 'Field note', date: '2025-11-16', year: '2025',
      summary: 'An older placeholder that demonstrates the complete archive view.',
      story: 'This older demonstration entry stays outside the newest-five contact sheet until the complete archive is opened.',
      facts: ['Demo entry — not a real credential', 'Visible through View all'], links: [],
      image: 'assets/achievement-placeholder-03.svg', imageAlt: 'Abstract open doorway and a small star', placeholder: true
    }
  ]
};
