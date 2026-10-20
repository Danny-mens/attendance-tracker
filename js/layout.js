const NAV_LINKS = [
    { page: 'dashboard', href: 'dashboard.html', icon: '▦', label: 'Dashboard' },
    { page: 'attendance', href: 'index.html', icon: '✓', label: 'Attendance' },
    { page: 'classes', href: 'classes.html', icon: '▤', label: 'Classes' },
    { page: 'reports', href: 'reports.html', icon: '▥', label: 'Reports' }
];

(function () {
    const activePage = document.body.dataset.page || '';
    const title = document.body.dataset.title || '';

    const sidebarHTML = `
    <aside class="sidebar" id="sidebar">
        <a class="brand" href="index.html"><span class="brand-mark">A</span><span class="brand-name">AttendEase</span></a>
        <nav class="nav-list" aria-label="Main navigation">
            ${NAV_LINKS.map(l => `<a class="nav-link ${l.page === activePage ? 'active' : ''}" href="${l.href}"><span>${l.icon}</span><span>${l.label}</span></a>`).join('')}
        </nav>
        <div class="sidebar-bottom"><div class="online-dot"></div><div><strong>Admin workspace</strong><small>Local demo</small></div></div>
    </aside>`;

    const topbarHTML = `
    <header class="topbar">
        <button class="icon-button menu-toggle" id="menu-toggle" type="button" aria-label="Toggle navigation">☰</button>
        <div class="breadcrumb">School management <span>/</span> ${title}</div>
        <div class="topbar-user"><span class="avatar avatar-small" id="user-avatar">AD</span><span id="user-name">Administrator</span><a class="logout-link" href="#" id="logout-link">Log out</a></div>
    </header>`;

    document.querySelector('.app-shell').insertAdjacentHTML('afterbegin', sidebarHTML);
    document.querySelector('.main-area').insertAdjacentHTML('afterbegin', topbarHTML);

    document.getElementById('menu-toggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('sidebar-open');
    });

    document.getElementById('logout-link').addEventListener('click', async (e) => {
        e.preventDefault();
        await fetch('php/logout.php');
        window.location.href = 'login.html';
    });

    // Every page waits for this. It sends visitors who are not logged in to the login page.
    window.authReady = fetch('php/check_session.php')
        .then(res => res.json())
        .then(session => {
            if (!session.loggedIn) {
                window.location.href = 'login.html';
                return session;
            }
            document.getElementById('user-name').textContent = session.username;
            document.getElementById('user-avatar').textContent = session.username.slice(0, 2).toUpperCase();
            return session;
        });
})();