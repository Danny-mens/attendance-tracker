const courseForm = document.getElementById('course-form');
const courseBody = document.getElementById('course-body');
const messageEl  = document.getElementById('message');

function showMessage(text, isError = false) {
    messageEl.textContent = text;
    messageEl.className = isError ? 'alert alert-error' : 'alert alert-success';
    messageEl.hidden = false;
}

async function loadCourses() {
    const res = await fetch('php/get_courses.php');
    const courses = await res.json();
    courseBody.innerHTML = '';

    if (courses.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 3;
        td.className = 'empty-state';
        td.textContent = 'No courses yet. Add your first course on the left.';
        tr.appendChild(td);
        courseBody.appendChild(tr);
        return;
    }

    courses.forEach(c => {
        const tr = document.createElement('tr');

        const nameCell = document.createElement('td');
        const wrap = document.createElement('div');
        wrap.className = 'person-cell';
        const text = document.createElement('span');
        const strong = document.createElement('strong');
        strong.textContent = c.course_code;
        const small = document.createElement('small');
        small.textContent = c.course_name;
        text.append(strong, small);
        wrap.appendChild(text);
        nameCell.appendChild(wrap);

        const countCell = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = 'badge badge-excused';
        badge.textContent = c.student_count + ' student(s)';
        countCell.appendChild(badge);

        const actionCell = document.createElement('td');
        const actions = document.createElement('div');
        actions.className = 'action-row';

        const studentsLink = document.createElement('a');
        studentsLink.href = 'enroll.html?id=' + c.id;
        studentsLink.className = 'text-link';
        studentsLink.textContent = 'Students';

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'link-danger';
        delBtn.textContent = 'Delete';
        delBtn.addEventListener('click', () => deleteCourse(c.id, c.course_code));

        actions.append(studentsLink, delBtn);
        actionCell.appendChild(actions);

        tr.append(nameCell, countCell, actionCell);
        courseBody.appendChild(tr);
    });
}

courseForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const res = await fetch('php/add_course.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            course_code: document.getElementById('course-code').value,
            course_name: document.getElementById('course-name').value
        })
    });
    const data = await res.json();

    if (res.ok) {
        courseForm.reset();
        showMessage('Course added. Click Students to choose who takes it.');
        loadCourses();
    } else {
        showMessage(data.error, true);
    }
});

async function deleteCourse(id, code) {
    if (!confirm('Delete ' + code + '? Its attendance records will be deleted too.')) return;

    const res = await fetch('php/delete_course.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
    const data = await res.json();

    if (res.ok) {
        showMessage('Course deleted.');
        loadCourses();
    } else {
        showMessage(data.error, true);
    }
}

authReady.then(session => {
    if (session.loggedIn) loadCourses();
});