#!/usr/bin/env node
// Checks that Sahay's free answer bank sends realistic parent questions (English,
// Hinglish, Hindi, Gujarati) to the right topic. Needs a local server on :8843
// (python3 -m http.server 8843) and Playwright, like tests/e2e/smoke.js.
const pw = (() => { for (const c of [process.env.PLAYWRIGHT_MODULE, 'playwright', '/opt/node22/lib/node_modules/playwright'].filter(Boolean)) { try { return require(c); } catch {} } throw new Error('playwright not found'); })();
const { chromium } = pw;
const CASES = [
  ['What are the fees for nursery?', 'fees'], ['fees kitni hai', 'fees'], ['How much is admission fee for grade 5', 'fees'],
  ['नर्सरी की फीस कितनी है?', 'fees'], ['ધોરણ 3 ની ફી કેટલી છે?', 'fees'], ['what is the cost per year', 'fees'],
  ['What age for nursery admission?', 'age'], ['my son is 3 years old, eligible for nursery?', 'age'], ['बच्चे की उम्र कितनी होनी चाहिए', 'age'], ['જુનિયર KG માટે ઉંમર કેટલી?', 'age'],
  ['How do I apply?', 'apply'], ['admission process', 'apply'], ['admission kaise le', 'apply'], ['प्रवेश की प्रक्रिया क्या है', 'apply'], ['પ્રવેશ કેવી રીતે લેવો?', 'apply'],
  ['what documents are needed', 'documents'], ['is aadhaar required', 'documents'], ['कौन से दस्तावेज़ चाहिए', 'documents'],
  ['can I visit the school?', 'visit'], ['I want to see the campus', 'visit'], ['શાળાની મુલાકાત લેવી છે', 'visit'],
  ['what is your phone number', 'contact'], ['where is the school located', 'contact'], ['school ka address kya hai', 'contact'], ['स्कूल का पता क्या है', 'contact'], ['શાળાનું સરનામું', 'contact'],
  ['is there school bus', 'transport'], ['bus facility available?', 'transport'], ['क्या बस की सुविधा है', 'transport'], ['સ્કૂલ બસ છે?', 'transport'],
  ['which board is it', 'curriculum'], ['is it CBSE?', 'curriculum'], ['syllabus details', 'curriculum'],
  ['do you have swimming', 'activities'], ['sports activities?', 'activities'], ['robotics classes', 'activities'],
  ['facilities in campus', 'campus'], ['is there a library', 'campus'],
  ['are seats available in grade 4', 'grades'], ['are admissions open', 'grades'],
  ['school timings?', 'timings'], ['when are holidays', 'timings'], ['स्कूल का समय क्या है', 'timings'],
  ['who is the principal', 'principal'], ['is the school recognised', 'affiliation'], ['is campus safe', 'safety'],
  ['any teacher job vacancy', 'careers'], ['नौकरी चाहिए', 'careers'],
  ['hello', 'greeting'], ['thank you', 'thanks'], ['what is the result of class 10 last year', 'unknown'], ['tell me a joke', 'unknown'],
];
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const p = await b.newPage();
  await p.route('**/fonts.googleapis.com/**', r => r.abort());
  await p.goto('http://localhost:8843/index.html');
  await p.addScriptTag({ url: '/assets/js/sahay-answers.js' });
  await p.waitForFunction(() => window.__sahayMatch && window.SAHAY_ANSWERS);
  const res = await p.evaluate(cases => cases.map(([q, want]) => { const r = window.__sahayMatch(window.SAHAY_ANSWERS, q); return [q, want, r.kind === 'topic' ? r.id : r.kind, r.text.slice(0, 18)]; }), CASES);
  let bad = 0;
  for (const [q, want, got, t] of res) { if (want !== got) { bad++; console.log('MISS', JSON.stringify(q), 'want', want, 'got', got); } }
  console.log(`${res.length - bad}/${res.length} matched`);
  await b.close();
  if (bad) process.exit(1);
})();
