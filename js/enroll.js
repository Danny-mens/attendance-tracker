const params   = new URLSearchParams(window.location.search);
const courseId = params.get('id');

const body      = document.getElementById('enroll-body');
const searchBox = document.getElementById('search');
const countEl   = document.getElementById('count');
const messageEl = document.getElementById('message');

function showMessage(text, isError = false) {
    messageEl.textContent = text;
    messageEl.className = isError ? 'alert alert-error' : 'alert alert-success';
    messageEl.hidden = false;
    messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function initials(name) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function updateCount() {
    const total = body.querySelectorAll('input[type="checkbox"]').length;
    const chosen = body.querySelectorAll('input:checked').length;
    countEl.textContent = chosen + ' of ' + total + ' student(s) selected';
}

function visibleRows() {
    return Array.from(body.querySelectorAll('tr[data-id]')).filter(r => r.style.display !== 'none');
}

function render(students) {
    body.innerHTML = '';

    if (students.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 3;
        td.className = 'empty-state';
        td.textContent = 'You have no students yet. Add some on the Attendance page.';
        tr.appendChild(td);
        body.appendChild(tr);
        return;
    }

    students.forEach(s => {
        const tr = document.createElement('tr');
        tr.dataset.id = s.id;
        tr.dataset.search = (s.full_name + ' ' + s.student_number + ' ' + (s.class_name || '')).toLowerCase();

        const boxTd = document.createElement('td');
        const box = document.createElement('input');
        box.type = 'checkbox';
        box.checked = Number(s.enrolled) === 1;
        box.addEventListener('change', updateCount);
        boxTd.appendChild(box);

        const personTd = document.createElement('td');
        const wrap = document.createElement('div');
        wrap.className = 'person-cell';
        const avatar = document.createElement('span');
        avatar.className = 'avatar';
        avatar.textContent = initials(s.full_name);
        const text = document.createElement('span');
        const strong = document.createElement('strong');
        strong.textContent = s.full_name;
        const small = document.createElement('small');
        small.textContent = s.student_number;
        text.append(strong, small);
        wrap.append(avatar, text);
        personTd.appendChild(wrap);

        const classTd = document.createElement('td');
        classTd.textContent = s.class_name || '\u2014';

        tr.append(boxTd, personTd, classTd);
        body.appendChild(tr);
    });

    updateCount();
}

searchBox.addEventListener('input', () => {
    const term = searchBox.value.toLowerCase();
    body.querySelectorAll('tr[data-id]').forEach(row => {
        row.style.display = row.dataset.search.includes(term) ? '' : 'none';
    });
});

document.getElementById('select-shown').addEventListener('click', () => {
    visibleRows().forEach(r => { r.querySelector('input').checked = true; });
    updateCount();
});

document.getElementById('clear-shown').addEventListener('click', () => {
    visibleRows().forEach(r => { r.querySelector('input').checked = false; });
    updateCount();
});

document.getElementById('save-btn').addEventListener('click', async () => {
    const ids = [];
    body.querySelectorAll('tr[data-id]').forEach(row => {
        if (row.querySelector('input').checked) ids.push(row.dataset.id);
    });

    try {
        const res = await fetch('php/save_enrollment.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ course_id: courseId, student_ids: ids })
        });

        const text = await res.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (err) {
            console.log('Server reply:', text);
            showMessage('The server sent an unexpected reply. Check that php/save_enrollment.php exists.', true);
            return;
        }

        if (res.ok) {
            showMessage('Saved. ' + ids.length + ' student(s) take this course.');
        } else {
            showMessage(data.error, true);
        }
    } catch (err) {
        showMessage('Could not reach the server: ' + err.message, true);
    }
});

async function init() {
    try {
        const res = await fetch('php/get_enrollment.php?course_id=' + encodeURIComponent(courseId));
        const text = await res.text();

        let data;
        try {
            data = JSON.parse(text);
        } catch (err) {
            console.log('Server reply:', text);
            showMessage('The server sent an unexpected reply. Press Ctrl+F5 and try again.', true);
            return;
        }

        if (!res.ok) {
            showMessage(data.error || 'Course not found.', true);
            return;
        }

        document.getElementById('course-title').textContent = data.course.course_code + ' \u00b7 ' + data.course.course_name;
        render(data.students);
    } catch (err) {
        showMessage('Could not reach the server: ' + err.message, true);
    }
}

authReady.then(session => {
    if (session.loggedIn) init();
});