const params = new URLSearchParams(window.location.search);
const studentId = params.get('id');

const editForm    = document.getElementById('edit-form');
const numberInput = document.getElementById('student-number');
const nameInput   = document.getElementById('full-name');
const classInput  = document.getElementById('class-name');
const suggestions = document.getElementById('class-suggestions');
const messageEl   = document.getElementById('message');

function showMessage(text, isError = false) {
    messageEl.textContent = text;
    messageEl.className = isError ? 'alert alert-error' : 'alert alert-success';
    messageEl.hidden = false;
}

async function init() {
    const classes = await (await fetch('php/get_classes.php')).json();
    classes.forEach(c => {
        const option = document.createElement('option');
        option.value = c.class_name;
        suggestions.appendChild(option);
    });

    const res = await fetch('php/get_student.php?id=' + encodeURIComponent(studentId));
    if (!res.ok) {
        showMessage('Student not found.', true);
        return;
    }

    const s = await res.json();
    numberInput.value = s.student_number;
    nameInput.value = s.full_name;
    classInput.value = s.class_name || '';
}

editForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const res = await fetch('php/update_student.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: studentId,
            student_number: numberInput.value,
            full_name: nameInput.value,
            class_name: classInput.value
        })
    });
    const data = await res.json();

    if (res.ok) {
        window.location.href = 'index.html';
    } else {
        showMessage(data.error, true);
    }
});

authReady.then(session => {
    if (session.loggedIn) init();
});