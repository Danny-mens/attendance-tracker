const studentForm = document.getElementById('student-form');
const dateInput   = document.getElementById('date');
const searchInput = document.getElementById('search');
const tableBody   = document.getElementById('attendance-body');
const summaryBody = document.getElementById('summary-body');
const countEl     = document.getElementById('count');
const saveBtn     = document.getElementById('save-btn');
const markAllBtn  = document.getElementById('mark-all');
const messageEl   = document.getElementById('message');
const classInput  = document.getElementById('class-name');
const suggestions = document.getElementById('class-suggestions');
const classFilter = document.getElementById('class-filter');


dateInput.value = new Date().toISOString().split('T')[0];

function showMessage(text, isError = false) {
    messageEl.textContent = text;
    messageEl.className = isError ? 'msg-error' : 'msg-success';
}

function initials(name) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function makeCell(text) {
    const td = document.createElement('td');
    td.textContent = text;
    return td;
}

function personCell(name, number) {
    const td = document.createElement('td');
    const wrap = document.createElement('div');
    wrap.className = 'person-cell';

    const avatar = document.createElement('span');
    avatar.className = 'avatar';
    avatar.textContent = initials(name);

    const text = document.createElement('span');
    const strong = document.createElement('strong');
    strong.textContent = name;
    const small = document.createElement('small');
    small.textContent = number;
    text.append(strong, small);

    wrap.append(avatar, text);
    td.appendChild(wrap);
    return td;
}

function statusCell(student) {
    const td = document.createElement('td');
    const group = document.createElement('div');
    group.className = 'status-options';

   ['Present', 'Absent', 'Late', 'Excused'].forEach(value =>  {
        const label = document.createElement('label');
        label.className = 'status-option status-' + value.toLowerCase();
        if (student.status === value) label.classList.add('selected');

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'status-' + student.id;
        radio.value = value;
        radio.checked = student.status === value;
        radio.addEventListener('change', () => {
            group.querySelectorAll('.status-option').forEach(el => el.classList.remove('selected'));
            label.classList.add('selected');
        });

        const text = document.createElement('span');
        text.textContent = value;
        label.append(radio, text);
        group.appendChild(label);
    });

    td.appendChild(group);
    return td;
}
async function loadClassOptions() {
    const res = await fetch('php/get_classes.php');
    const classes = await res.json();

    const selected = classFilter.value;   // remember the chosen filter
    classFilter.innerHTML = '<option value="0">All classes</option>';
    suggestions.innerHTML = '';

    classes.forEach(c => {
        const filterOption = document.createElement('option');
        filterOption.value = c.id;
        filterOption.textContent = c.class_name;
        classFilter.appendChild(filterOption);

        const suggestion = document.createElement('option');
        suggestion.value = c.class_name;
        suggestions.appendChild(suggestion);
    });

    classFilter.value = selected;
}

// 1. Load students and their status for the selected date
async function loadAttendance() {
    loadSummary();
    const res = await fetch('php/get_attendance.php?date=' + dateInput.value + '&class_id=' + classFilter.value);
    const students = await res.json();

    tableBody.innerHTML = '';
    countEl.textContent = students.length + ' student(s)';

    if (students.length === 0) {
        const tr = document.createElement('tr');
        const td = makeCell('No students found.');
        td.colSpan = 4;
        td.className = 'empty-state';
        tr.appendChild(td);
        tableBody.appendChild(tr);
        return;
    }

    students.forEach(s => {
        const row = document.createElement('tr');
        row.dataset.id = s.id;
        row.dataset.search = (s.full_name + ' ' + s.student_number + ' ' + (s.class_name || '')).toLowerCase();

        const classCell = document.createElement('td');
        if (s.class_name) {
            const badge = document.createElement('span');
            badge.className = 'badge badge-excused';
            badge.textContent = s.class_name;
            classCell.appendChild(badge);
        } else {
            classCell.textContent = '—';
        }

        const actionCell = document.createElement('td');
        const actions = document.createElement('div');
        actions.className = 'action-row';

        const editLink = document.createElement('a');
        editLink.href = 'edit.html?id=' + s.id;
        editLink.className = 'text-link';
        editLink.textContent = 'Edit';

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'link-danger';
        delBtn.textContent = 'Delete';
        delBtn.addEventListener('click', () => deleteStudent(s.id, s.full_name));

        actions.append(editLink, delBtn);
        actionCell.appendChild(actions);

        row.append(personCell(s.full_name, s.student_number), classCell, statusCell(s), actionCell);
        tableBody.appendChild(row);
    });

    applySearch();
}
// 2. Summary table
async function loadSummary() {
    const res = await fetch('php/get_summary.php');
    const rows = await res.json();
    summaryBody.innerHTML = '';

    rows.forEach(r => {
        const tr = document.createElement('tr');

        const rate = document.createElement('td');
        const badge = document.createElement('span');
        const pct = Number(r.percentage);
        badge.className = 'badge ' + (pct >= 80 ? 'badge-present' : pct >= 60 ? 'badge-late' : 'badge-absent');
        badge.textContent = pct + '%';
        rate.appendChild(badge);

       tr.append(personCell(r.full_name, r.student_number), makeCell(r.present), makeCell(r.late), makeCell(r.absent), makeCell(r.excused), rate);
        summaryBody.appendChild(tr);
    });
}

// 3. Search
function applySearch() {
    const term = searchInput.value.toLowerCase();
    tableBody.querySelectorAll('tr[data-id]').forEach(row => {
        row.style.display = row.dataset.search.includes(term) ? '' : 'none';
    });
}
searchInput.addEventListener('input', applySearch);

// 4. Add a student
studentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const res = await fetch('php/add_student.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
    student_number: document.getElementById('student-number').value,
    full_name: document.getElementById('full-name').value,
    class_name: classInput.value
})
    });
    const data = await res.json();

    if (res.ok) {
        studentForm.reset();
        showMessage('Student added.');
        loadClassOptions();
        loadAttendance();
    } else {
        showMessage(data.error, true);
    }
});

// 5. Delete a student
async function deleteStudent(id, name) {
    if (!confirm('Delete ' + name + ' and all their attendance records?')) return;

    await fetch('php/delete_student.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
    showMessage('Student deleted.');
    loadAttendance();
}

// 6. Mark all present
markAllBtn.addEventListener('click', () => {
    tableBody.querySelectorAll('tr[data-id]').forEach(row => {
        const radio = row.querySelector('input[value="Present"]');
        radio.checked = true;
        radio.dispatchEvent(new Event('change'));
    });
});

// 7. Save attendance
saveBtn.addEventListener('click', async () => {
    const records = [];
    tableBody.querySelectorAll('tr[data-id]').forEach(row => {
        const checked = row.querySelector('input:checked');
        if (checked) records.push({ student_id: row.dataset.id, status: checked.value });
    });

    if (records.length === 0) {
        showMessage('Mark at least one student first.', true);
        return;
    }

    const res = await fetch('php/save_attendance.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateInput.value, records })
    });
    const data = await res.json();

    if (res.ok) {
        showMessage('Attendance saved for ' + dateInput.value + '.');
        loadSummary();
    } else {
        showMessage(data.error, true);
    }
});

// 8. Start
dateInput.addEventListener('change', loadAttendance);
classFilter.addEventListener('change', loadAttendance);

authReady.then(session => {
    if (session.loggedIn) {
        loadClassOptions();
        loadAttendance();
    }
});