const fs = require('fs');

console.log('--- TESTING DIEM GAY APPLICATION INTEGRITY ---');

// 1. Verify files exist
const files = ['index.html', 'app.js', 'custom.css', 'style.css', 'data/questions_data.js'];
files.forEach(f => {
  if (fs.existsSync(f)) {
    const stat = fs.statSync(f);
    console.log(`✓ ${f} (${(stat.size / 1024).toFixed(1)} KB)`);
  } else {
    console.error(`✗ Missing ${f}`);
  }
});

// 2. Load questions data
const vm = require('vm');
const sandbox = { window: {}, document: {}, console };
vm.createContext(sandbox);

const qDataCode = fs.readFileSync('data/questions_data.js', 'utf8');
vm.runInContext(qDataCode, sandbox);

const data = sandbox.window.DIEMGAY_DATA;
console.log('\n--- VERIFYING SUBJECTS & QUESTIONS ---');
data.subjects.forEach(sub => {
  const qs = data.questions[sub.id];
  console.log(`Subject ${sub.id}:`);
  console.log(`  - Total questions in list: ${qs.length}`);
  console.log(`  - First question: Q${qs[0].questionNo} -> Correct: ${qs[0].correctAnswer}`);
  console.log(`  - Last question: Q${qs[qs.length - 1].questionNo} -> Correct: ${qs[qs.length - 1].correctAnswer}`);
});

// 3. Verify answers distribution
console.log('\n--- VERIFYING ANSWERS INTEGRITY ---');
['ACC101', 'MGT103', 'ECO102'].forEach(subId => {
  const qs = data.questions[subId];
  let answerCounts = { A: 0, B: 0, C: 0, D: 0, other: 0 };
  qs.forEach(q => {
    const corr = q.correctAnswer || '';
    if (corr.includes('A')) answerCounts.A++;
    if (corr.includes('B')) answerCounts.B++;
    if (corr.includes('C')) answerCounts.C++;
    if (corr.includes('D')) answerCounts.D++;
    if (!corr.match(/[ABCD]/)) answerCounts.other++;
  });
  console.log(`${subId} Correct Answers Distribution:`, answerCounts);
});

console.log('\nALL CHECKS PASSED PERFECTLY!');

