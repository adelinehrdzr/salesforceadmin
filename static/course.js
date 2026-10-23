let course = [], courseProgress;

function moduleState(module) {
  return courseProgress.modules[module.id] || { lessons: [], lab: false, best: null, attempts: 0 };
}
function updateModule(id, patch) {
  const module = course.find(m => m.id === id);
  courseProgress.modules[id] = { ...moduleState(module), ...patch };
  saveCourse();
}
function saveCourse() {
  localStorage.setItem('admin.course', JSON.stringify(courseProgress));
}
function materialReady(module) {
  const state = moduleState(module);
  return module.lessons.every(l => state.lessons.includes(l.id)) && state.lab;
}
function modulePassed(module) {
  return materialReady(module) && moduleState(module).best >= 80;
}
function mountCourse() {
  const completed = course.filter(modulePassed).length;
  const next = course.find(m => !modulePassed(m)) || course[0];
  const section = document.createElement('section');
  section.className = 'card course-overview';
  section.innerHTML = `<div class="row"><div><p class="eyebrow">YOUR GUIDED COURSE</p><h2>Study → hands-on lab → topic exam</h2></div><span class="tag">${completed} / ${course.length} modules complete</span></div><p>Learn the concepts here first. Apply them in a practice org, then take a focused assessment on exactly that topic.</p><div class="bar"><span style="width:${completed / course.length * 100}%"></span></div><p><button id="continue-course">${completed ? 'Continue learning' : 'Start the course'}</button> <button id="browse-course" class="secondary">Browse curriculum</button></p><small>27 text lessons · 9 hands-on labs · 9 topic assessments. Completion requires studying each lesson, self-confirming the lab, and scoring at least 80% on its assessment. This is a learning target, not an official exam pass mark.</small>`;
  const notice = app.querySelector('.notice');
  notice.after(section);
  $('#continue-course').onclick = () => openModule(next.id);
  $('#browse-course').onclick = curriculum;
}
function curriculum() {
  clearInterval(timer);
  app.innerHTML = `<p class="eyebrow">ADMINISTRATOR FOUNDATIONS</p><h1>Your course curriculum</h1><p>Follow the sequence or revisit any module. Study materials are always open. Each topic exam becomes available after its lessons and hands-on practice are marked complete.</p>${course.map((m,i) => {
    const s = moduleState(m);
    return `<section class="card row"><div><span class="tag">MODULE ${i+1} · ${modulePassed(m) ? 'COMPLETE' : 'IN PROGRESS'}</span><h2>${esc(m.title)}</h2><p>${esc(m.topic)} · ${s.lessons.length}/${m.lessons.length} lessons · Lab ${s.lab ? 'confirmed' : 'to do'} · Best exam: ${s.best === null ? 'not taken' : s.best+'%'}</p></div><button data-module="${m.id}">Open module ${i+1}</button></section>`;
  }).join('')}<button id="course-dashboard" class="secondary">Back to dashboard</button>`;
  document.querySelectorAll('[data-module]').forEach(b => b.onclick = () => openModule(b.dataset.module));
  $('#course-dashboard').onclick = home;
  window.scrollTo(0,0);
}
function openModule(id, lessonIndex) {
  clearInterval(timer);
  const module = course.find(m => m.id === id);
  const state = moduleState(module);
  if (lessonIndex === undefined) {
    lessonIndex = module.lessons.findIndex(l => !state.lessons.includes(l.id));
    if (lessonIndex === -1) lessonIndex = module.lessons.length;
  }
  const labView = lessonIndex === module.lessons.length;
  const lesson = module.lessons[lessonIndex];
  const moduleIndex = course.indexOf(module);
  app.innerHTML = `<div class="row"><button id="all-modules" class="secondary">← Curriculum</button><span class="tag">MODULE ${moduleIndex+1} OF ${course.length}</span></div><h1>${esc(module.title)}</h1><p class="muted">${esc(module.topic)}</p><div class="course-layout"><nav class="card lesson-nav" aria-label="Module lessons"><h2>In this module</h2>${module.lessons.map((l,i) => `<button class="${i === lessonIndex ? '' : 'secondary'}" data-lesson="${i}" ${i === lessonIndex ? 'aria-current="step"' : ''}>${state.lessons.includes(l.id) ? '✓' : i+1+'.'} ${esc(l.title)}</button>`).join('')}<button data-lesson="${module.lessons.length}" class="${labView ? '' : 'secondary'}">${state.lab ? '✓' : '4.'} Hands-on lab & topic exam</button><p><small>Best exam: ${state.best === null ? 'not taken' : state.best+'%'} · ${state.attempts} attempts</small></p></nav><article class="card lesson-content">${labView ? `<p class="eyebrow">APPLY WHAT YOU LEARNED</p><h2>Hands-on lab</h2><p>Use a Trailhead Playground, Developer Edition, or appropriate sandbox with synthetic records. Feature availability varies; if something is unavailable, document a reasoned design and the expected test result instead.</p><ol>${module.lab.map(step => `<li>${esc(step)}</li>`).join('')}</ol><h3>Explain it in your own words</h3><p>${esc(module.reflection)}</p><label><input type="checkbox" id="lab-complete" ${state.lab ? 'checked' : ''}> I completed the practice or documented the unavailable steps and expected outcomes.</label><p><small>Lab completion is self-reported; this app does not connect to your Salesforce org or verify your work.</small></p><label for="lab-notes">My observations and evidence</label><textarea id="lab-notes" rows="5" placeholder="What did you configure? What worked? What failed? Avoid secrets or customer data.">${esc(courseProgress.notes[id] || '')}</textarea><p id="notes-status" class="muted" role="status"></p><section class="assessment-panel"><h3>Module topic exam</h3><p>${bank.filter(q => q.topic === module.topic).length} questions · Feedback after submission · 80% learning target</p><p>Only this module's topic is included. Incorrect answers become review items. Retakes reuse the same small question pool, so support your score with hands-on evidence.</p><p id="exam-requirements">${materialReady(module) ? 'Your lessons and practice are complete. You can start the topic exam.' : 'Complete all three lessons and confirm the hands-on practice to unlock this exam.'}</p><button id="module-exam" ${materialReady(module) ? '' : 'disabled'}>Start topic exam</button></section>` : `<p class="eyebrow">LESSON ${lessonIndex+1} OF ${module.lessons.length}</p><h2>${esc(lesson.title)}</h2>${lesson.paragraphs.map(p => `<p>${esc(p)}</p>`).join('')}<div class="notice"><strong>Before moving on:</strong> Explain the choice to a colleague without looking at the question options. Name one tempting alternative and why it would not meet the requirement.</div><button id="complete-lesson">${state.lessons.includes(lesson.id) ? 'Continue to next step' : 'Mark studied & continue'}</button>`}<p><a href="${esc(module.reference)}" target="_blank" rel="noopener">Explore this topic on Trailhead ↗</a></p><small>Original study text with topic-level learning references. Check current documentation for feature availability and release-specific behavior.</small></article></div>`;
  $('#all-modules').onclick = curriculum;
  document.querySelectorAll('[data-lesson]').forEach(b => b.onclick = () => openModule(id, Number(b.dataset.lesson)));
  if (!labView) {
    $('#complete-lesson').onclick = () => {
      updateModule(id, { lessons: [...new Set([...moduleState(module).lessons, lesson.id])] });
      openModule(id, lessonIndex+1);
    };
  } else {
    $('#lab-complete').onchange = e => {
      updateModule(id, { lab: e.target.checked });
      $('#module-exam').disabled = !materialReady(module);
      $('#exam-requirements').textContent = materialReady(module) ? 'Your lessons and practice are complete. You can start the topic exam.' : 'Complete all three lessons and confirm the hands-on practice to unlock this exam.';
    };
    $('#lab-notes').oninput = e => {
      courseProgress.notes[id] = e.target.value;
      saveCourse();
      $('#notes-status').textContent = 'Notes saved in this browser.';
    };
    $('#module-exam').onclick = () => startModuleExam(module);
  }
  window.scrollTo(0,0);
}
function startModuleExam(module) {
  if (!materialReady(module)) return;
  if (session && !confirm('Replace your saved practice session with this topic exam?')) return;
  const questions = shuffle(bank.filter(q => q.topic === module.topic)).map(q => ({...q, choices: shuffle(q.choices)}));
  session = { mode: 'exam', moduleId: module.id, questions, answers: {}, feedback: {}, flags: [], index: 0, started: Date.now(), deadline: null };
  save(); render(); window.scrollTo(0,0);
}
function recordModuleAssessment(s, percent) {
  if (!s.moduleId) return;
  const module = course.find(m => m.id === s.moduleId);
  if (!module || s.questions.length !== bank.filter(q => q.topic === module.topic).length || s.questions.some(q => q.topic !== module.topic)) return;
  const state = moduleState(module);
  updateModule(module.id, { best: Math.max(state.best ?? 0, percent), attempts: state.attempts+1, last: percent });
}
function courseResult(s, percent) {
  if (!s.moduleId) return '';
  const module = course.find(m => m.id === s.moduleId);
  const next = course[course.indexOf(module)+1];
  const passed = percent >= 80;
  return `<section class="card ${passed ? 'good' : 'bad'}"><h2>${passed ? 'Topic learning target reached' : 'Revisit this module before moving on'}</h2><p>${passed ? 'You can continue with the next module. Return to any explanation or lab whenever you need it.' : 'Review the lesson and your missed decisions, then retry the topic exam. Unanswered items count as incorrect.'}</p><button id="return-module" class="secondary">Review module & lab</button> ${passed ? `<button id="next-module">${next ? 'Study next module' : 'View completed course'}</button>` : ''}</section>`;
}
function wireCourseResult(s) {
  if (!s.moduleId) return;
  $('#return-module').onclick = () => openModule(s.moduleId);
  $('#next-module')?.addEventListener('click', () => {
    const next = course[course.findIndex(m => m.id === s.moduleId)+1];
    next ? openModule(next.id) : curriculum();
  });
}
