const courseFilter = document.getElementById('course-filter');
const reportForm  = document.getElementById('report-form');
const fromInput   = document.getElementById('from');
const toInput     = document.getElementById('to');
const classFilter = document.getElementById('class-filter');
const exportBtn   = document.getElementById('export-btn');
const messageEl   = document.getElementById('message');
const reportBody  = document.getElementById('report-body');

function toDateString(d) {
    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
}

// Default range: first day of this month until today
const now = new Date();
fromInput.value = toDateString(new Date(now.getFullYear(), now.getMonth(), 1));
toInput.value = toDateString(now);

function showMessage(text) {
    messageEl.textContent = text;
    messageEl.className = 'alert alert-error';
    messageEl.hidden = false;
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

function query() {
    return 'from=' + fromInput.value + '&to=' + toInput.value +
        '&class_id=' + classFilter.value + '&course_id=' + courseFilter.value;
}


function rangeIsValid() {
    return fromInput.value !== '' && toInput.value !== '' && fromInput.value <= toInput.value;
}

async function loadClassOptions() {
    const classes = await (await fetch('php/get_classes.php')).json();
    classes.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = c.class_name;
        classFilter.appendChild(option);
    });
}

async function runReport() {
    messageEl.hidden = true;

    if (!rangeIsValid()) {
        showMessage('Choose a valid date range: "From" must be on or before "To".');
        return;
    }

    const res = await fetch('php/get_report.php?' + query());
    const data = await res.json();

    if (!res.ok) {
        showMessage(data.error);
        return;
    }

    document.getElementById('r-present').textContent = data.counts.Present;
    document.getElementById('r-late').textContent = data.counts.Late;
    document.getElementById('r-absent').textContent = data.counts.Absent;
    document.getElementById('r-excused').textContent = data.counts.Excused + ' excused';
    document.getElementById('r-rate').textContent = data.rate === null ? '—' : data.rate + '%';
    document.getElementById('r-count').textContent = data.rows.length + ' record(s) found';

    reportBody.innerHTML = '';

    if (data.rows.length === 0) {
        const tr = document.createElement('tr');
        const td = makeCell('No attendance saved in this range.');
        td.colSpan = 5;
        td.className = 'empty-state';
        tr.appendChild(td);
        reportBody.appendChild(tr);
        return;
    }

    data.rows.forEach(r => {
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
        reportBody.appendChild(tr);
    });
}

reportForm.addEventListener('submit', (e) => {
    e.preventDefault();
    runReport();
});

exportBtn.addEventListener('click', () => {
    if (!rangeIsValid()) {
        showMessage('Choose a valid date range first.');
        return;
    }
    window.location.href = 'php/export_csv.php?' + query();
});

async function loadCourseOptions() {
    const courses = await (await fetch('php/get_courses.php')).json();
    courses.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = c.course_code + ' \u00b7 ' + c.course_name;
        courseFilter.appendChild(option);
    });
}

authReady.then(session => {
    if (session.loggedIn) {
        loadClassOptions();
        loadCourseOptions();
        runReport();
    }
});