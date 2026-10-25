const courseFilter = document.getElementById('course-filter');

function setText(id, value) {
    document.getElementById(id).textContent = value;
}

function makeCell(text) {
    const td = document.createElement('td');
    td.textContent = text;
    return td;
}

function initials(name) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function svgEl(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
}

// 7-day line chart drawn with SVG
function drawChart(trend) {
    const box = document.getElementById('chart');
    box.innerHTML = '';

    if (trend.every(d => d.rate === null)) {
        const p = document.createElement('p');
        p.className = 'muted';
        p.textContent = 'No attendance saved in the last 7 days.';
        box.appendChild(p);
        return;
    }

    const W = 600, H = 240, left = 40, right = 20, top = 15, bottom = 30;
    const plotW = W - left - right;
    const plotH = H - top - bottom;
    const xAt = i => left + (plotW * i) / (trend.length - 1);
    const yAt = v => top + plotH - (plotH * v) / 100;

    const svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'line-chart' });

    const grid = svgEl('g', { class: 'grid-lines' });
    [0, 25, 50, 75, 100].forEach(v => {
        grid.appendChild(svgEl('path', { d: 'M' + left + ' ' + yAt(v) + ' H' + (W - right) }));
        const label = svgEl('text', { class: 'axis-labels', x: left - 8, y: yAt(v) + 3, 'text-anchor': 'end' });
        label.textContent = v + '%';
        svg.appendChild(label);
    });
    svg.appendChild(grid);

    const points = [];
    trend.forEach((d, i) => {
        const day = svgEl('text', { class: 'day-label', x: xAt(i), y: H - 8, 'text-anchor': 'middle' });
        day.textContent = d.label;
        svg.appendChild(day);
        if (d.rate !== null) points.push({ x: xAt(i), y: yAt(d.rate) });
    });

    if (points.length > 1) {
        const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + p.x + ' ' + p.y).join(' ');
        svg.appendChild(svgEl('path', { class: 'chart-line', d: path }));
    }
    points.forEach(p => svg.appendChild(svgEl('circle', { class: 'chart-point', cx: p.x, cy: p.y, r: 4 })));

    box.appendChild(svg);
}

// Progress bar per class
function drawClasses(classes) {
    const list = document.getElementById('class-list');
    list.innerHTML = '';

    if (classes.length === 0) {
        const p = document.createElement('p');
        p.className = 'muted';
        p.textContent = 'No classes yet.';
        list.appendChild(p);
        return;
    }

    classes.forEach(c => {
        const row = document.createElement('div');
        row.className = 'class-row';

        const label = document.createElement('div');
        label.className = 'class-row-label';
        const name = document.createElement('span');
        name.textContent = c.class_name;
        const value = document.createElement('strong');
        value.textContent = c.rate === null ? 'No data' : c.rate + '%';
        label.append(name, value);

        const track = document.createElement('div');
        track.className = 'progress';
        const bar = document.createElement('span');
        bar.style.width = (c.rate === null ? 0 : c.rate) + '%';
        track.appendChild(bar);

        row.append(label, track);
        list.appendChild(row);
    });
}

// Latest records table
function drawRecent(recent) {
    const body = document.getElementById('recent-body');
    body.innerHTML = '';

    if (recent.length === 0) {
        const tr = document.createElement('tr');
        const td = makeCell('No attendance saved yet.');
        td.colSpan = 5;
        td.className = 'empty-state';
        tr.appendChild(td);
        body.appendChild(tr);
        return;
    }

    recent.forEach(r => {
        const tr = document.createElement('tr');

        const personTd = document.createElement('td');
        const wrap = document.createElement('div');
        wrap.className = 'person-cell';
        const avatar = document.createElement('span');
        avatar.className = 'avatar';
        avatar.textContent = initials(r.full_name);
        const text = document.createElement('span');
        const strong = document.createElement('strong');
        strong.textContent = r.full_name;
        const small = document.createElement('small');
        small.textContent = r.student_number;
        text.append(strong, small);
        wrap.append(avatar, text);
        personTd.appendChild(wrap);

        const statusTd = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = 'badge badge-' + r.status.toLowerCase();
        badge.textContent = r.status;
        statusTd.appendChild(badge);
tr.append(personTd, makeCell(r.course_code), makeCell(r.class_name || '\u2014'), makeCell(r.attendance_date), statusTd);
        body.appendChild(tr);
    });
}

async function loadDashboard() {
const res = await fetch('php/get_stats.php?course_id=' + courseFilter.value);
    const s = await res.json();

    setText('today-label', new Date().toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).toUpperCase());

    setText('stat-total', s.totalStudents);
    setText('stat-classes', s.totalClasses + ' class(es) \u00b7 ' + s.totalCourses + ' course(s)');
    setText('stat-present', s.present);
    setText('stat-present-foot', s.late + ' late');
    setText('stat-absent', s.absent);
    setText('stat-absent-foot', s.excused + ' excused');
    setText('stat-rate', s.rate === null ? '—' : s.rate + '%');
    setText('stat-rate-foot', s.notMarked + ' not marked yet');

    drawChart(s.trend);
    drawClasses(s.classes);
    drawRecent(s.recent);
}

async function loadCourseOptions() {
    const courses = await (await fetch('php/get_courses.php')).json();
    courses.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = c.course_code + ' \u00b7 ' + c.course_name;
        courseFilter.appendChild(option);
    });
}

courseFilter.addEventListener('change', loadDashboard);

authReady.then(async session => {
    if (session.loggedIn) {
        await loadCourseOptions();
        loadDashboard();
    }
});
