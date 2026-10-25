const courseSelect = document.getElementById('course');
const fileInput    = document.getElementById('csv-file');
const previewCard  = document.getElementById('preview-card');
const previewBody  = document.getElementById('preview-body');
const summaryEl    = document.getElementById('summary');
const importBtn    = document.getElementById('import-btn');
const messageEl    = document.getElementById('message');

const ID_NAMES    = ['studentid', 'id', 'studentnumber', 'number', 'studentno', 'idnumber', 'indexnumber', 'index'];
const NAME_NAMES  = ['fullname', 'name', 'studentname'];
const CLASS_NAMES = ['class', 'classname', 'group', 'level'];

const MAX_ROWS = 1000;
let validRows = [];

function showMessage(text, isError = false) {
    messageEl.textContent = text;
    messageEl.className = isError ? 'alert alert-error' : 'alert alert-success';
    messageEl.hidden = false;
    messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Reads CSV text: quotes, commas inside quotes, comma or semicolon separators, Excel's BOM
function parseCSV(text) {
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

    const firstLine = text.split(/\r?\n/)[0] || '';
    const delimiter = firstLine.split(';').length > firstLine.split(',').length ? ';' : ',';

    const rows = [];
    let row = [], field = '', inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (inQuotes) {
            if (ch === '"') {
                if (text[i + 1] === '"') { field += '"'; i++; }
                else inQuotes = false;
            } else {
                field += ch;
            }
        } else if (ch === '"') {
            inQuotes = true;
        } else if (ch === delimiter) {
            row.push(field); field = '';
        } else if (ch === '\n' || ch === '\r') {
            if (ch === '\r' && text[i + 1] === '\n') i++;
            row.push(field); field = '';
            rows.push(row); row = [];
        } else {
            field += ch;
        }
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows;
}

function norm(h) {
    return h.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findCol(headers, names) {
    return headers.findIndex(h => names.includes(h));
}

function analyse(rows) {
    if (rows.length < 2) {
        return { error: 'The file needs a header row and at least one student.' };
    }

    const headers  = rows[0].map(norm);
    const idCol    = findCol(headers, ID_NAMES);
    const nameCol  = findCol(headers, NAME_NAMES);
    const classCol = findCol(headers, CLASS_NAMES);

    if (idCol === -1 || nameCol === -1) {
        return { error: 'I could not find the "Student ID" and "Full name" columns. The first row must be a header such as: Student ID,Full name,Class. Use "Download template".' };
    }

    const seen = new Set();
    const items = [];

    rows.slice(1).forEach((r, i) => {
        const cells = r.map(c => c.trim());
        if (cells.every(c => c === '')) return;   // blank line

        const item = {
            line: i + 2,
            student_number: cells[idCol] || '',
            full_name: cells[nameCol] || '',
            class_name: classCol === -1 ? '' : (cells[classCol] || ''),
            problem: ''
        };

        if (!item.student_number) item.problem = 'Missing student ID';
        else if (!item.full_name) item.problem = 'Missing name';
        else if (item.student_number.length > 20) item.problem = 'ID too long (20 characters at most)';
        else if (item.full_name.length > 100) item.problem = 'Name too long (100 characters at most)';
        else if (item.class_name.length > 80) item.problem = 'Class too long (80 characters at most)';
        else if (seen.has(item.student_number)) item.problem = 'ID repeated in the file';

        if (!item.problem) seen.add(item.student_number);
        items.push(item);
    });

    return { items };
}

function renderPreview(items) {
    previewBody.innerHTML = '';

    items.slice(0, 200).forEach(item => {
        const tr = document.createElement('tr');

        [item.line, item.student_number, item.full_name, item.class_name || '\u2014'].forEach(value => {
            const td = document.createElement('td');
            td.textContent = value;
            tr.appendChild(td);
        });

        const statusTd = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = 'badge ' + (item.problem ? 'badge-absent' : 'badge-present');
        badge.textContent = item.problem || 'OK';
        statusTd.appendChild(badge);
        tr.appendChild(statusTd);

        previewBody.appendChild(tr);
    });
}

function resetPreview() {
    validRows = [];
    previewCard.hidden = true;
    previewBody.innerHTML = '';
}

fileInput.addEventListener('change', async () => {
    messageEl.hidden = true;
    resetPreview();

    const file = fileInput.files[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
        showMessage('The file is too large (1 MB at most).', true);
        return;
    }

    const rows = parseCSV(await file.text());
    const result = analyse(rows);

    if (result.error) {
        showMessage(result.error, true);
        return;
    }

    const items = result.items;
    validRows = items.filter(i => !i.problem);

    if (validRows.length > MAX_ROWS) {
        showMessage('That file has ' + validRows.length + ' students. Import at most ' + MAX_ROWS + ' at a time.', true);
        validRows = [];
        return;
    }

    const problems = items.length - validRows.length;
    let text = items.length + ' row(s) read: ' + validRows.length + ' ready to import, ' + problems + ' with problems (they will be skipped).';
    if (items.length > 200) text += ' Only the first 200 rows are shown.';
    summaryEl.textContent = text;

    renderPreview(items);
    importBtn.textContent = 'Import ' + validRows.length + ' student(s)';
    importBtn.disabled = validRows.length === 0;
    previewCard.hidden = false;
});

importBtn.addEventListener('click', async () => {
    if (!courseSelect.value) {
        showMessage('Choose a course first.', true);
        return;
    }
    if (validRows.length === 0) return;

    const mode = document.querySelector('input[name="mode"]:checked').value;
    const courseName = courseSelect.options[courseSelect.selectedIndex].textContent;
    importBtn.disabled = true;

    try {
        const res = await fetch('php/import_students.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                course_id: courseSelect.value,
                mode: mode,
                rows: validRows.map(r => ({
                    line: r.line,
                    student_number: r.student_number,
                    full_name: r.full_name,
                    class_name: r.class_name
                }))
            })
        });

        const text = await res.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (err) {
            showMessage('The server sent an unexpected reply. Check that php/import_students.php exists.', true);
            importBtn.disabled = false;
            return;
        }

        if (!res.ok) {
            showMessage(data.error, true);
            importBtn.disabled = false;
            return;
        }

        let summary = 'Imported into ' + courseName + ': ' + data.added + ' added, ' +
            data.updated + ' updated, ' + data.skipped + ' already existed (details left unchanged).';
        if (data.errors.length > 0) {
            summary += ' ' + data.errors.length + ' row(s) were not imported: ' +
                data.errors.slice(0, 5).map(e => 'row ' + e.line + ' (' + e.message + ')').join(', ');
        }

        fileInput.value = '';
        resetPreview();
        showMessage(summary);
    } catch (err) {
        showMessage('Could not reach the server: ' + err.message, true);
        importBtn.disabled = false;
    }
});

document.getElementById('template-btn').addEventListener('click', () => {
    const csv = 'Student ID,Full name,Class\r\n10000001,Ama Mensah,Level 200 IT\r\n10000002,Kofi Boateng,Level 200 IT\r\n';
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = 'students_template.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
});

async function loadCourses() {
    const courses = await (await fetch('php/get_courses.php')).json();
    courseSelect.innerHTML = '';

    courses.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = c.course_code + ' \u00b7 ' + c.course_name;
        courseSelect.appendChild(option);
    });

    if (courses.length === 0) {
        fileInput.disabled = true;
        showMessage('Create a course first on the Courses page, then come back to import students.', true);
    }
}

authReady.then(session => {
    if (session.loggedIn) loadCourses();
});