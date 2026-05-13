// teacher_dashboard.js

// Check auth
var session = JSON.parse(localStorage.getItem('quizcraft_session') || 'null');
if (!session || session.role !== 'teacher') {
  window.location.href = 'login.html';
}

document.getElementById('teacherName').textContent = session.name;
document.getElementById('greetName').textContent = session.name.split(' ')[0];

function logout() {
  localStorage.removeItem('quizcraft_session');
  window.location.href = 'login.html';
}

// Load quizzes created by this teacher
function loadQuizList() {
  var quizzes = JSON.parse(localStorage.getItem('quizcraft_quizzes') || '[]');
  // Filter by this teacher
  var mine = quizzes.filter(function(q) { return q.teacherEmail === session.email; });

  var emptyMsg = document.getElementById('emptyMsg');
  var table = document.getElementById('quizTable');
  var tbody = document.getElementById('quizTableBody');

  if (mine.length === 0) {
    emptyMsg.classList.remove('hidden');
    table.classList.add('hidden');
    return;
  }

  emptyMsg.classList.add('hidden');
  table.classList.remove('hidden');
  tbody.innerHTML = '';

  mine.forEach(function(quiz) {
    var tr = document.createElement('tr');

    var dateStr = new Date(quiz.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    tr.innerHTML =
      '<td>' + quiz.title + '</td>' +
      '<td>' + quiz.questions.length + '</td>' +
      '<td>' + quiz.timer + ' min</td>' +
      '<td>' + dateStr + '</td>' +
      '<td class="td-actions">' +
        '<button class="btn-sm btn-link" onclick="copyLink(\'' + quiz.id + '\')">Copy Link</button>' +
        '<button class="btn-sm btn-stats" onclick="viewStats(\'' + quiz.id + '\')">Stats</button>' +
        '<button class="btn-sm btn-delete" onclick="deleteQuiz(\'' + quiz.id + '\')">Delete</button>' +
      '</td>';

    tbody.appendChild(tr);
  });
}

function copyLink(id) {
  var link = window.location.origin + window.location.pathname.replace('teacher_dashboard.html', '') + 'student_view.html?quiz=' + id;
  navigator.clipboard.writeText(link).then(function() {
    alert('Link copied!\n\n' + link);
  }).catch(function() {
    prompt('Copy this link:', link);
  });
}

function viewStats(id) {
  window.location.href = 'quiz_stats.html?quiz=' + id;
}

function deleteQuiz(id) {
  if (!confirm('Delete this quiz? This cannot be undone.')) return;
  var quizzes = JSON.parse(localStorage.getItem('quizcraft_quizzes') || '[]');
  quizzes = quizzes.filter(function(q) { return q.id !== id; });
  localStorage.setItem('quizcraft_quizzes', JSON.stringify(quizzes));
  loadQuizList();
}

loadQuizList();
