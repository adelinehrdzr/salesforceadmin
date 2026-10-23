// Optional browser regression: requires Playwright and a running local server.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const executablePath = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch({headless:true, ...(executablePath ? {executablePath} : {})});
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.accept());
  try {
    await page.goto(process.env.APP_URL || 'http://127.0.0.1:8000');
    await page.locator('#continue-course').click();
    await page.locator('[data-lesson="3"]').click();
    assert.equal(await page.locator('#module-exam').isDisabled(), true);
    await page.locator('#lab-complete').check();
    assert.equal(await page.locator('#module-exam').isDisabled(), true);
    await page.locator('#lab-notes').fill('Tested a positive and a negative access scenario.');
    await page.reload();
    await page.locator('#continue-course').click();
    await page.locator('[data-lesson="3"]').click();
    assert.equal(await page.locator('#lab-notes').inputValue(), 'Tested a positive and a negative access scenario.');
    await page.locator('[data-lesson="0"]').click();
    for (let i=0;i<3;i++) await page.locator('#complete-lesson').click();
    assert.equal(await page.locator('#module-exam').isEnabled(), true);
    await page.locator('#module-exam').click();
    assert.equal(await page.locator('#check').count(), 0);
    const selection = await page.evaluate(() => JSON.parse(localStorage.getItem('admin.session')));
    assert.equal(selection.questions.length, 10);
    assert(selection.questions.every(q => q.topic === 'Security & access'));
    await page.locator('#finish').click(); // Fail with unanswered questions.
    await page.getByRole('heading', {name:'Revisit this module before moving on'}).waitFor();
    assert.equal(await page.locator('#next-module').count(), 0);
    await page.locator('#return-module').click();
    await page.locator('#module-exam').click();
    for (let i=0;i<10;i++) {
      await page.locator('[name=answer][value="0"]').check();
      if (i<9) await page.locator('#next').click();
    }
    await page.locator('#finish').click();
    await page.getByRole('heading', {name:'Topic learning target reached'}).waitFor();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('admin.course')).modules.security.attempts),2);
    await page.locator('#next-module').click();
    await page.getByRole('heading', {name:'Build a maintainable data model'}).waitFor();
    await page.locator('#home').click();
    await page.locator('#browse-course').click();
    assert.equal(await page.locator('[data-module]').count(),9);
    await page.locator('[data-module="security"]').click();
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.locator('#home').click();
    await page.locator('#count').fill('2');
    await page.locator('#start').click();
    await page.locator('[name=answer]').first().check();
    await page.locator('#check').click();
    await page.getByText('Best answer:',{exact:false}).waitFor();
    await page.reload();
    await page.locator('#resume').click();
    await page.locator('#next').click();
    await page.locator('#finish').click();
    await page.getByRole('heading', {name:'Topic breakdown'}).waitFor();
    assert.equal(await page.locator('#return-module').count(),0);
    await page.locator('#done').click();
    await page.locator('#mode').selectOption('exam');
    await page.locator('#count').fill('2');
    await page.locator('#start').click();
    await page.evaluate(() => { const s=JSON.parse(localStorage.getItem('admin.session'));s.deadline=Date.now()-1000;localStorage.setItem('admin.session',JSON.stringify(s)); });
    await page.reload();
    await page.locator('#resume').click();
    await page.getByText('SESSION COMPLETE · TIME EXPIRED').waitFor();
    await page.locator('#home').click();
    await page.locator('#reset').click();
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('admin.course'))),{modules:{},notes:{}});
    assert.deepEqual(errors,[]);
    console.log('PASS: gated course exams, saved lessons/lab/notes, failed/passed assessments, topic isolation, next module, mobile layout, existing practice/resume/timer, reset, no JS errors.');
  } finally { await browser.close(); }
})().catch(e => {console.error(e);process.exit(1);});
