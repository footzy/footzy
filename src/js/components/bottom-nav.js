const NAV_ITEMS = [
  { href: '/src/pages/home.html', label: 'Accueil', icon: '🏠', key: 'home' },
  { href: '/src/pages/match.html', label: 'Matchs', icon: '⚽', key: 'match' },
  { href: '/src/pages/pronostic.html', label: 'Pronos', icon: '🎯', key: 'pronostic' },
  { href: '/src/pages/groupe.html', label: 'Groupe', icon: '👥', key: 'groupe' },
  { href: '/src/pages/profil.html', label: 'Profil', icon: '👤', key: 'profil' },
];

export function renderBottomNav(activeKey) {
  const nav = document.createElement('nav');
  nav.className = 'bottom-nav';
  nav.innerHTML = NAV_ITEMS.map(item => `
    <a href="${item.href}" class="${activeKey === item.key ? 'active' : ''}">
      <span style="font-size:22px">${item.icon}</span>
      <span>${item.label}</span>
    </a>
  `).join('');
  document.body.appendChild(nav);
}
