const studentForm  = document.getElementById('student-form');
const dateInput    = document.getElementById('date');
const tableBody    = document.getElementById('attendance-body');
const saveBtn      = document.getElementById('save-btn');
const messageEl    = document.getElementById('message');

// Set the date picker to today
dateInput.value = new Date().toISOString().split('T')[0];

function showMessage(text, isError = false) {
    messageEl.textContent = text;
    messageEl.className = isError ? 'error' : 'success';
}
async function loadSummary() {
    const res = await fetch('php/get_summary.php');
    const rows = await res.json();
    const body = document.getElementById('summary-body');
    body.innerHTML = '';

    rows.forEach(r => {
        const tr = document.createElement('tr');
        [r.student_number, r.full_name, r.present, r.late, r.absent, r.percentage + '%']
            .forEach(value => {
                const td = document.createElement('td');
                td.textContent = value;
                tr.appendChild(td);
            });
        body.appendChild(tr);
    });
}

// 1. Load students + their status for the selected date
async function loadAttendance() {
    loadSummary();
    const res = await fetch('php/get_attendance.php?date=' + dateInput.value);
    const students = await res.json();

    tableBody.innerHTML = '';

    if (students.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">No students yet. Add one above.</td></tr>';
        return;
    }

    students.forEach(s => {
        const row = document.createElement('tr');
        row.dataset.id = s.id;

        const numCell = document.createElement('td');
        numCell.textContent = s.student_number;

        const nameCell = document.createElement('td');
        nameCell.textContent = s.full_name;

        const statusCell = document.createElement('td');
        const select = document.createElement('select');
        ['', 'Present', 'Absent', 'Late'].forEach(opt => {
            const o = document.createElement('option');
            o.value = opt;
            o.textContent = opt === '' ? '-- select --' : opt;
            if (opt === (s.status || '')) o.selected = true;
            select.appendChild(o);
        });
        statusCell.appendChild(select);

        const delCell = document.createElement('td');
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.className = 'delete-btn';
        delBtn.addEventListener('click', () => deleteStudent(s.id, s.full_name));
        delCell.appendChild(delBtn);

        row.append(numCell, nameCell, statusCell, delCell);
        tableBody.appendChild(row);
    });
}

// 2. Add a student
studentForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // stop the page from reloading

    const payload = {
        student_number: document.getElementById('student-number').value,
        full_name: document.getElementById('full-name').value
    };

    const res = await fetch('php/add_student.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (res.ok) {
        studentForm.reset();
        showMessage('Student added.');
        loadAttendance();
    } else {
        showMessage(data.error, true);
    }
});

// 3. Delete a student
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

// 4. Save attendance
saveBtn.addEventListener('click', async () => {
    const records = [];
    tableBody.querySelectorAll('tr').forEach(row => {
        const select = row.querySelector('select');
        if (select) {
            records.push({ student_id: row.dataset.id, status: select.value });
        }
    });

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
document.getElementById('search').addEventListener('input', function () {
    const term = this.value.toLowerCase();
    tableBody.querySelectorAll('tr').forEach(row => {
        const text = Array.from(row.cells).slice(0, 2)
            .map(c => c.textContent).join(' ').toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
    });
});
// 5. Reload when the date changes, and on first page load
dateInput.addEventListener('change', loadAttendance);
loadAttendance();