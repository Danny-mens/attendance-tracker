const classForm = document.getElementById('class-form');
const classBody = document.getElementById('class-body');
const messageEl = document.getElementById('message');

function showMessage(text, isError = false) {
    messageEl.textContent = text;
    messageEl.className = isError ? 'alert alert-error' : 'alert alert-success';
    messageEl.hidden = false;
}

function makeCell(text) {
    const td = document.createElement('td');
    td.textContent = text;
    return td;
}

async function loadClasses() {
    const res = await fetch('php/get_classes.php');
    const classes = await res.json();
    classBody.innerHTML = '';

    if (classes.length === 0) {
        const tr = document.createElement('tr');
        const td = makeCell('No classes yet. Add one on the left.');
        td.colSpan = 4;
        td.className = 'empty-state';
        tr.appendChild(td);
        classBody.appendChild(tr);
        return;
    }

    classes.forEach(c => {
        const tr = document.createElement('tr');

        const nameCell = document.createElement('td');
        const strong = document.createElement('strong');
        strong.textContent = c.class_name;
        nameCell.appendChild(strong);

        const countCell = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = 'badge badge-excused';
        badge.textContent = c.student_count + ' student(s)';
        countCell.appendChild(badge);

        const actionCell = document.createElement('td');
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'link-danger';
        delBtn.textContent = 'Delete';
        delBtn.addEventListener('click', () => deleteClass(c.id, c.class_name));
        actionCell.appendChild(delBtn);

        tr.append(nameCell, makeCell(c.level || '—'), countCell, actionCell);
        classBody.appendChild(tr);
    });
}

classForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const res = await fetch('php/add_class.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            class_name: document.getElementById('class-name').value,
            level: document.getElementById('level').value
        })
    });
    const data = await res.json();

    if (res.ok) {
        classForm.reset();
        showMessage('Class added.');
        loadClasses();
    } else {
        showMessage(data.error, true);
    }
});

async function deleteClass(id, name) {
    if (!confirm('Delete ' + name + '? Its students will stay, but without a class.')) return;

    await fetch('php/delete_class.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
    showMessage('Class deleted.');
    loadClasses();
}

authReady.then(session => {
    if (session.loggedIn) loadClasses();
});