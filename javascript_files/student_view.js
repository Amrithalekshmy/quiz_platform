// student_view.js

// ── Load quiz from localStorage using URL param ──
function getParam(name) {
  var params = new URLSearchParams(window.location.search);
  return params.get(name);
}

var quizId = getParam('quiz');
var quiz = null;

if (quizId) {
  var quizzes = JSON.parse(localStorage.getItem('quizcraft_quizzes') || '[]');
  for (var i = 0; i < quizzes.length; i++) {
    if (quizzes[i].id === quizId) {
      quiz = quizzes[i];
      break;
    }
  }
}

// Fallback to old questions.js format if no quiz found via URL
if (!quiz && typeof questionBank !== 'undefined') {
  quiz = {
    id: 'legacy',
    title: 'Quiz',
    questions: questionBank,
    numQuestions: typeof questionsPerStudent !== 'undefined' ? questionsPerStudent : 5,
    timer: 15,
    shuffle: true,
    showAnswers: false,
    marksCorrect: 2,
    marksNegative: 0
  };
}

if (!quiz) {
  document.body.innerHTML = '<div style="padding:60px;text-align:center;font-family:sans-serif;"><h2>Quiz not found.</h2><p style="margin-top:10px;color:#888;">Please ask your teacher for a valid quiz link.</p></div>';
  throw new Error('No quiz found');
}

// Show quiz info on name screen
document.getElementById('quizTitleDisplay').textContent = quiz.title;
document.getElementById('quizMetaDisplay').textContent =
  quiz.questions.length + ' questions · ' + quiz.timer + ' minutes' +
  (quiz.subject ? ' · ' + quiz.subject : '');

// ── Shuffle helper ──
function shuffleArray(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

var quizData = [];
var currentIndex = 0;
var userAnswers = [];
var timerInterval = null;
var secondsLeft = 0;
var studentName = '';

function startQuiz() {
  var nameInput = document.getElementById('studentNameInput').value.trim();
  if (!nameInput) {
    document.getElementById('nameError').classList.remove('hidden');
    return;
  }
  studentName = nameInput;
  document.getElementById('nameError').classList.add('hidden');

  // Pick questions
  var pool = quiz.shuffle ? shuffleArray(quiz.questions) : quiz.questions.slice();
  quizData = pool.slice(0, quiz.numQuestions);
  userAnswers = new Array(quizData.length).fill(null);

  // Switch screens
  document.getElementById('nameScreen').classList.add('hidden');
  document.getElementById('quizScreen').classList.remove('hidden');

  // Start timer
  secondsLeft = quiz.timer * 60;
  updateTimerDisplay();
  timerInterval = setInterval(function() {
    secondsLeft--;
    updateTimerDisplay();
    if (secondsLeft <= 0) {
      clearInterval(timerInterval);
      submitQuiz();
    }
  }, 1000);

  loadQuestion(0);
}

function updateTimerDisplay() {
  var mins = Math.floor(secondsLeft / 60);
  var secs = secondsLeft % 60;
  var text = mins + ':' + (secs < 10 ? '0' : '') + secs;
  var el = document.getElementById('timerDisplay');
  el.textContent = text;
  if (secondsLeft <= 60) {
    el.style.background = '#fee2e2';
    el.style.color = '#dc2626';
  } else if (secondsLeft <= 180) {
    el.style.background = '#fef9c3';
    el.style.color = '#ca8a04';
  }
}

// ── Load a question onto the page ──
function loadQuestion(index) {
  var q = quizData[index];

  document.getElementById("questionCounter").textContent =
    "Question " + (index + 1) + " of " + quizData.length;

  var pct = ((index + 1) / quizData.length) * 100;
  document.getElementById("progressFill").style.width = pct + "%";

  document.getElementById("questionText").textContent = q.question;

  var list = document.getElementById("optionsList");
  list.innerHTML = "";

  q.options.forEach(function(opt) {
    var li = document.createElement("li");
    var label = document.createElement("label");
    label.className = "option-label";
    if (userAnswers[index] === opt) {
      label.classList.add("selected");
    }

    var radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "option";
    radio.value = opt;
    if (userAnswers[index] === opt) radio.checked = true;

    radio.addEventListener("change", function() {
      userAnswers[index] = this.value;
      var allLabels = list.querySelectorAll(".option-label");
      allLabels.forEach(function(lbl) { lbl.classList.remove("selected"); });
      label.classList.add("selected");
    });

    label.appendChild(radio);
    label.appendChild(document.createTextNode(opt));
    li.appendChild(label);
    list.appendChild(li);
  });

  var prevBtn = document.getElementById("prevBtn");
  prevBtn.disabled = (index === 0);

  var nextBtn = document.getElementById("nextBtn");
  if (index === quizData.length - 1) {
    nextBtn.textContent = "Submit";
    nextBtn.className = "nav-btn btn-submit";
    nextBtn.onclick = submitQuiz;
  } else {
    nextBtn.textContent = "Next →";
    nextBtn.className = "nav-btn btn-next";
    nextBtn.onclick = goToNext;
  }
}

function goToNext() {
  if (currentIndex < quizData.length - 1) {
    currentIndex++;
    loadQuestion(currentIndex);
  }
}

function goToPrev() {
  if (currentIndex > 0) {
    currentIndex--;
    loadQuestion(currentIndex);
  }
}

// ── Calculate and show score ──
function submitQuiz() {
  clearInterval(timerInterval);

  var correct = 0;
  var incorrect = 0;
  var unanswered = 0;
  var totalMarks = 0;
  var maxMarks = 0;

  for (var i = 0; i < quizData.length; i++) {
    var marks = quizData[i].marks || quiz.marksCorrect || 2;
    maxMarks += marks;

    if (userAnswers[i] === null) {
      unanswered++;
    } else if (userAnswers[i] === quizData[i].answer) {
      correct++;
      totalMarks += marks;
    } else {
      incorrect++;
      totalMarks -= (quiz.marksNegative || 0);
    }
  }

  if (totalMarks < 0) totalMarks = 0;

  var percent = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;
  var rank = "D";
  if (percent >= 85) rank = "A+";
  else if (percent >= 70) rank = "A";
  else if (percent >= 55) rank = "B";
  else if (percent >= 40) rank = "C";

  document.getElementById("scoreHeading").textContent = studentName + "'s Score";
  document.getElementById("correctCount").textContent = correct;
  document.getElementById("incorrectCount").textContent = incorrect;
  document.getElementById("partialCount").textContent = unanswered;
  document.getElementById("totalMarks").textContent = totalMarks + " / " + maxMarks;
  document.getElementById("rankBadge").textContent = rank;

  // Save result for teacher stats
  var result = {
    quizId: quiz.id,
    studentName: studentName,
    correct: correct,
    incorrect: incorrect,
    unanswered: unanswered,
    totalMarks: totalMarks,
    maxMarks: maxMarks,
    percent: Math.round(percent),
    rank: rank,
    submittedAt: Date.now()
  };
  var results = JSON.parse(localStorage.getItem('quizcraft_results') || '[]');
  results.push(result);
  localStorage.setItem('quizcraft_results', JSON.stringify(results));

  // Answer review if teacher enabled it
  if (quiz.showAnswers) {
    var reviewSection = document.getElementById('answersReview');
    var reviewList = document.getElementById('answersReviewList');
    reviewSection.classList.remove('hidden');
    reviewList.innerHTML = '';

    quizData.forEach(function(q, idx) {
      var div = document.createElement('div');
      var studentAns = userAnswers[idx];
      var cls, status;

      if (studentAns === null) {
        cls = 'unanswered'; status = 'Not answered';
      } else if (studentAns === q.answer) {
        cls = 'correct-ans'; status = 'Correct';
      } else {
        cls = 'wrong-ans'; status = 'Wrong';
      }

      div.className = 'review-item ' + cls;
      div.innerHTML =
        '<div class="review-q">' + (idx+1) + '. ' + q.question + '</div>' +
        (studentAns ? '<div class="review-your">Your answer: ' + studentAns + '</div>' : '<div class="review-your">Not answered</div>') +
        (cls !== 'correct-ans' ? '<div class="review-correct">Correct: ' + q.answer + '</div>' : '');

      reviewList.appendChild(div);
    });
  }

  // Switch screens
  document.getElementById("quizScreen").classList.add("hidden");
  document.getElementById("scoreScreen").classList.remove("hidden");
}
