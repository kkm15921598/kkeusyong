/* ===== 끄숑 · 디지털디톡스 코치 · 프로토타입 로직 ===== */

// ---- 상태 ----
const store = {
  get usage(){ return +(localStorage.getItem('usage') ?? 135); },        // 분 (임시 데이터)
  set usage(v){ localStorage.setItem('usage', v); },
  get goal(){ return +(localStorage.getItem('goal') ?? 180); },          // 분 (기본 3시간)
  set goal(v){ localStorage.setItem('goal', v); },
  get mode(){ return localStorage.getItem('mode') ?? 'T'; },
  set mode(v){ localStorage.setItem('mode', v); },
  get streak(){ return +(localStorage.getItem('streak') ?? 3); },        // 연속 디톡스 일수(임시)
  get onboarded(){ return localStorage.getItem('onboarded') === '1'; },
  set onboarded(v){ localStorage.setItem('onboarded', v ? '1':'0'); },
};

// ---- 끄숑 표정 (컨디션별로 확연히 다른 5종 · 라인 페이스 SVG) ----
const FACES = [
  // 1 쌩쌩 (활짝 웃음 + 반달눈)
  '<circle cx="12" cy="12" r="10"/><path d="M8 13a5 5 0 0 0 8 0"/><path d="M7.6 9.7c.5-.7 1.3-.7 1.8 0"/><path d="M14.6 9.7c.5-.7 1.3-.7 1.8 0"/>',
  // 2 기분 좋은 (미소 + 점눈)
  '<circle cx="12" cy="12" r="10"/><path d="M8.5 13.5a4 4 0 0 0 7 0"/><path d="M9 9.5h.01"/><path d="M15 9.5h.01"/>',
  // 3 나른한 (무표정 + 졸린 눈)
  '<circle cx="12" cy="12" r="10"/><path d="M9 14.5h6"/><path d="M8 10h2"/><path d="M14 10h2"/>',
  // 4 지친 (시무룩 + 점눈)
  '<circle cx="12" cy="12" r="10"/><path d="M8.5 15.5a4 4 0 0 1 7 0"/><path d="M9 10h.01"/><path d="M15 10h.01"/>',
  // 5 방전 (X눈 + 작은 입)
  '<circle cx="12" cy="12" r="10"/><path d="m8.2 9.2 1.8 1.8"/><path d="m10 9.2-1.8 1.8"/><path d="m14 9.2 1.8 1.8"/><path d="m15.8 9.2-1.8 1.8"/><path d="M10.4 15.4h3.2"/>',
];

// ---- 단계 정의 (사용시간 5단계) ----
// img: 단계별 캐릭터 그림이 준비되면 경로만 교체하면 외형 변화로도 확장 가능
const CHAR = 'assets/characters/kkeusyong.png';
const LEVELS = [
  { name:'아주 좋은 흐름', condName:'쌩쌩 끄숑',     msg:'끄숑이 컨디션이 최고예요! 지금처럼만 해주세요.',        face:FACES[0], accent:'#5bbd72', soft:'#eaf6ec', filter:'none', img:CHAR },
  { name:'괜찮은 편',     condName:'기분 좋은 끄숑', msg:'끄숑이 아직 쌩쌩해요. 잘 지켜주고 있어요.',             face:FACES[1], accent:'#7cb95f', soft:'#eef6e3', filter:'none', img:CHAR },
  { name:'주의 필요',     condName:'나른한 끄숑',   msg:'끄숑이 조금 나른해졌어요. 잠깐 쉬게 해줄까요?',          face:FACES[2], accent:'#e3ad36', soft:'#fbf2d8', filter:'saturate(.92)', img:CHAR },
  { name:'사용시간 많음', condName:'지친 끄숑',     msg:'끄숑이 많이 지쳤어요. 휴대폰을 잠깐 내려놔 주세요.',      face:FACES[3], accent:'#e3893c', soft:'#fbecdc', filter:'saturate(.8) brightness(.97)', img:CHAR },
  { name:'디톡스 필요',   condName:'방전된 끄숑',   msg:'끄숑이 방전됐어요… 지금 끄숑이에겐 휴식이 필요해요.',     face:FACES[4], accent:'#df564b', soft:'#fbe6e3', filter:'saturate(.65) brightness(.93)', img:CHAR },
];

// ---- 멘트 (3개 톤: 일반 / 사용시간 많음 / 위험 단계) ----
const MENTS = {
  T:{ // 끄숑 팩폭형 — 적게 쓰면 인정, 많이 쓸수록 팩폭 강도↑
    normal:[
      '좋습니다. 오늘 페이스 깔끔하네요.','지금 관리 상태, 합격입니다.','이 정도면 잘 하고 있는 겁니다.',
      '오늘은 휴대폰한테 안 졌네요.','딱 좋습니다. 이대로 유지하세요.','군더더기 없는 사용량입니다.',
      '오늘 자제력 좋습니다.','스크롤 욕구, 잘 참고 있네요.','이 페이스면 끄숑이도 만족입니다.',
      '휴대폰 주도권, 지금은 회원님한테 있습니다.',
    ],
    heavy:[
      '하루가 휴대폰 속으로 사라졌습니다.','이 정도면 디지털 거주자입니다.','눈 건강이 도망가는 중.',
      '액정이 회원님 얼굴을 기억하겠습니다.','휴대폰 없이 10분 버틸 수 있나요?','사용시간이 조금 심각합니다.',
      '지금 필요한 건 충전기가 아니라 휴식입니다.','오늘도 현실보다 화면을 더 많이 봤네요.',
      '스크롤 국가대표 출전 가능.','엄지손가락만 성장 중입니다.',
      '오늘도 액정을 열심히 키우셨네요.','휴대폰이 직업입니까?','손가락만 운동 중.',
      '현실 접속은 언제 하시나요?','또 스크롤 하셨네요.','오늘도 알고리즘의 승리.',
      '눈도 소모품입니다.','휴대폰은 쉬는데 회원님은 안 쉬네요.','액정과 사랑에 빠지셨군요.',
      '휴대폰이 회원님을 사용 중입니다.',
    ],
    danger:[
      '회원님은 휴대폰과 동거 중입니다.','이제 그만 보세요.','눈이 울고 있습니다.','시력은 복구권이 없습니다.',
      '오늘은 진짜 많이 봤습니다.','잠시 내려놓으세요.','액정인간 단계 진입.','끄숑도 말리기 포기 직전입니다.',
    ],
  },
  F:{ // 끄숑 위로형 — 따뜻하게
    normal:[
      '오늘도 고생 많았어요.','많이 바쁜 하루였나 봐요.','잠시 눈을 쉬게 해주세요.','천천히 줄여도 괜찮아요.',
      '끄숑은 회원님이 걱정돼요.','오늘 하루는 어땠나요?','쉬어가는 시간도 필요해요.','물 한 잔 마시고 올까요?',
      '눈도 잠시 휴식이 필요해요.','지금도 충분히 잘하고 있어요.',
    ],
    heavy:[
      '오늘은 휴대폰과 함께한 시간이 길었네요.','많이 지친 하루였나 봐요.','무언가에 기대고 싶었던 하루였을까요?',
      '잠시 창밖을 바라보는 건 어떨까요?','회원님의 눈 건강이 걱정돼요.','조금만 쉬어도 몸이 훨씬 편해질 거예요.',
      '내일은 조금 덜 봐도 괜찮아요.','오늘도 잘 버텨냈어요.','휴대폰 말고도 좋은 것들이 많답니다.','끄숑이 응원할게요.',
    ],
    danger:[
      '오늘은 정말 오래 사용하셨네요.','충분히 쉬어야 할 것 같아요.','눈도 마음도 휴식이 필요해요.',
      '오늘만큼은 일찍 쉬어보는 건 어떨까요?','내일은 조금 더 가볍게 보내봐요.','회원님의 건강이 가장 중요해요.',
      '끄숑은 회원님이 오래 건강했으면 좋겠어요.',
    ],
  },
};
// 5단계 → 멘트 톤 매핑
const TIER_OF_LEVEL = ['normal','normal','heavy','heavy','danger'];

// ===== 사용시간 히스토리 (날짜 키 기반) =====
// 비교는 "오늘 vs 어제", "이번 달 vs 지난달"을 실제 날짜 키로 조회해서 계산한다.
// 프로토타입은 과거값을 샘플로 시드하고 오늘값을 날짜별로 저장한다.
// 실제 출시: 이 저장소(dayHistory/monthHistory)를 Android Usage Stats의 일별/월별 합계로
//           채우기만 하면, 아래 비교 로직이 그대로 진짜 수치로 동작한다.
const WEEKDAY = ['일','월','화','수','목','금','토'];
function dKey(d){ const p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; }
function mKey(d){ const p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}`; }
function loadHist(k){ try{ return JSON.parse(localStorage.getItem(k)) || {}; }catch(_){ return {}; } }
function saveHist(k,o){ localStorage.setItem(k, JSON.stringify(o)); }

const dayHistory = loadHist('dayHistory');     // { 'YYYY-MM-DD': 분 }
const monthHistory = loadHist('monthHistory'); // { 'YYYY-MM': 분 }
(function seedHistory(){
  const today = new Date();
  const SAMPLE_DAYS   = [176,232,198,255,312,268];        // 과거 6일(오래된→어제)
  const SAMPLE_MONTHS = [5180,4720,5400,4880,5620,5180];  // 과거 6개월(오래된→이번 달)
  for(let i=6;i>=1;i--){ const d=new Date(today); d.setDate(today.getDate()-i); const k=dKey(d); if(dayHistory[k]==null) dayHistory[k]=SAMPLE_DAYS[6-i]; }
  for(let i=5;i>=0;i--){ const d=new Date(today.getFullYear(),today.getMonth()-i,1); const k=mKey(d); if(monthHistory[k]==null) monthHistory[k]=SAMPLE_MONTHS[5-i]; }
  saveHist('dayHistory',dayHistory); saveHist('monthHistory',monthHistory);
})();
// 오늘 사용시간을 날짜 키로 기록 → 내일이면 자동으로 '어제'가 되어 실제 비교됨
function recordToday(){ const t=new Date(); dayHistory[dKey(t)] = store.usage; saveHist('dayHistory',dayHistory); }
function usageOnDate(d){ return dayHistory[dKey(d)] ?? 0; }
function usageInMonth(d){ return monthHistory[mKey(d)] ?? 0; }

// 최근 n일/n개월 시리즈(오늘·이번 달로 끝남) — 요일+날짜 라벨 포함
function buildSeries(isDaily){
  const today = new Date(), labels = [], vals = [];
  if(isDaily){
    for(let i=6;i>=0;i--){ const d=new Date(today); d.setDate(today.getDate()-i);
      labels.push({ main:WEEKDAY[d.getDay()], sub:`${d.getMonth()+1}/${d.getDate()}` }); vals.push(usageOnDate(d)); }
  } else {
    for(let i=5;i>=0;i--){ const d=new Date(today.getFullYear(),today.getMonth()-i,1);
      labels.push({ main:`${d.getMonth()+1}월`, sub:'' }); vals.push(usageInMonth(d)); }
  }
  return { labels, vals };
}

// ---- 유틸 ----
const $ = id => document.getElementById(id);
function fmt(min){
  min = Math.max(0, Math.round(min));
  const h = Math.floor(min/60), m = min%60;
  if(h && m) return `${h}시간 ${m}분`;
  if(h) return `${h}시간`;
  return `${m}분`;
}
function levelOf(min){
  const h = min/60;
  if(h < 2) return 0;
  if(h < 4) return 1;
  if(h < 5) return 2;
  if(h < 7) return 3;
  return 4;
}
// 끄숑 컨디션(에너지): 5단계 임계값에 묶어 계산 → 게이지와 표정/단계가 항상 일치
//  1단계(0~2h)=100~80% · 2(2~4h)=80~60% · 3(4~5h)=60~40% · 4(5~7h)=40~20% · 5(7h~)=20~0%
const ENERGY_BANDS = [
  { lo:0, hi:2,  top:100, bot:80 },
  { lo:2, hi:4,  top:80,  bot:60 },
  { lo:4, hi:5,  top:60,  bot:40 },
  { lo:5, hi:7,  top:40,  bot:20 },
  { lo:7, hi:10, top:20,  bot:0  },   // 7h~10h 구간을 20~0%로 보간, 10h 이상은 0%
];
function energyOf(min){
  const h = min / 60;
  if(h <= 0) return 100;
  for(const b of ENERGY_BANDS){
    if(h < b.hi || b.hi === 10){
      const t = Math.min(1, Math.max(0, (h - b.lo) / (b.hi - b.lo)));
      return Math.round(b.top - (b.top - b.bot) * t);
    }
  }
  return 0;
}
function pick(arr, seed){ return arr[seed % arr.length]; }
// 날짜 기반 시드: 멘트를 '그날 하루는 고정 + 매일 달라짐'으로 (클릭해도 안 바뀜)
function daySeed(){ const d = new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000); }

function todayStr(){
  const d = new Date();
  const p = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}.${p(d.getMonth()+1)}.${p(d.getDate())}`;
}

// 한국시간(KST=UTC+9) 기준 시간대별 배경 — 사용자의 기기 타임존과 무관하게 KST로 판정
function currentBg(){
  const hKST = new Date(Date.now() + 9 * 3600000).getUTCHours(); // 0~23 (KST)
  if(hKST >= 6 && hKST <= 12)  return 'assets/characters/bg1.png';  // 06:00 ~ 12:59
  if(hKST >= 13 && hKST <= 18) return 'assets/characters/bg2.png';  // 13:00 ~ 18:59
  return 'assets/characters/bg3.png';                                // 19:00 ~ 05:59
}

// ---- 홈 렌더 ----
function renderHome(){
  const usage = store.usage, goal = store.goal, mode = store.mode;
  const lv = levelOf(usage);
  const L = LEVELS[lv];

  // accent 색 전체 반영
  document.documentElement.style.setProperty('--accent', L.accent);
  document.documentElement.style.setProperty('--accent-soft', L.soft);
  document.documentElement.style.setProperty('--accent-back', ['#cfe8d2','#d3e8cd','#f1e1b0','#f4d4b6','#f3c3bd'][lv]);

  // 캐릭터 이미지 (지금은 동일, 단계별 그림 준비 시 L.img 교체로 외형 변화 가능)
  const img = $('charImg');
  if(img.getAttribute('src') !== L.img) img.setAttribute('src', L.img);
  img.style.filter = `${L.filter==='none'?'':L.filter+' '}drop-shadow(0 14px 20px rgba(120,100,70,.2))`;

  // 상단

  // 시간대별 배경 (KST 기준)
  $('homeBg').style.backgroundImage = `url('${currentBg()}')`;

  // 말풍선 (사용시간 단계 → 톤, 그 안에서 날짜 기반으로 하루 고정)
  $('bubble').textContent = pick(MENTS[mode][TIER_OF_LEVEL[lv]], daySeed());

  // 끄숑 컨디션 카드
  $('condFace').innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${L.face}</svg>`;
  $('condName').textContent = L.condName;
  const energy = energyOf(usage);
  $('condPct').textContent = `컨디션 ${energy}%`;
  $('condFill').style.width = energy + '%';
  $('condMsg').textContent = L.msg;

  // 사용시간
  $('usageBig').textContent = fmt(usage);
  const ratio = goal > 0 ? Math.min(1, usage / goal) : 0;
  const fill = $('usageFill');
  fill.style.width = (ratio * 100) + '%';
  fill.classList.toggle('over', usage > goal);
  const gs = $('goalStatus');
  if(usage < goal){ gs.textContent = `앞으로 ${fmt(goal - usage)} 더 쓸 수 있어요`; gs.className = 'goal-status-line pos'; }
  else if(usage > goal){ gs.textContent = `목표를 ${fmt(usage - goal)} 넘었어요`; gs.className = 'goal-status-line neg'; }
  else { gs.textContent = '오늘 쓸 수 있는 시간을 다 썼어요'; gs.className = 'goal-status-line pos'; }
  $('goalText').textContent = fmt(goal);

  // 모드 버튼
  $('modeT').classList.toggle('active', mode === 'T');
  $('modeF').classList.toggle('active', mode === 'F');
}

// ---- 기록 렌더 ----
let recView = 'daily';
function renderRecord(){
  recordToday();                       // 오늘값을 날짜 키로 최신화
  const isDaily = recView === 'daily';
  const { labels, vals } = buildSeries(isDaily);   // 실제 날짜 기준 시리즈

  const cur = vals[vals.length-1];     // 오늘 / 이번 달
  const prev = vals[vals.length-2];    // 어제 / 지난달

  $('recTotalLabel').textContent = isDaily ? '오늘 총 사용시간' : '이번 달 총 사용시간';
  $('recTotal').textContent = fmt(cur);

  const diff = cur - prev;
  const ctx = isDaily ? '어제보다' : '지난달보다';
  const cmp = $('recCompare');
  if(diff > 0){ cmp.textContent = `↑ ${ctx} ${fmt(diff)} 많아요`; cmp.className = 'compare-line up'; }
  else if(diff < 0){ cmp.textContent = `↓ ${ctx} ${fmt(-diff)} 적어요`; cmp.className = 'compare-line down'; }
  else { cmp.textContent = `${ctx} 그대로예요`; cmp.className = 'compare-line same'; }

  $('recChartLabel').textContent = isDaily ? '최근 7일' : '최근 6개월';
  $('chartLegendTxt').textContent = isDaily ? '오늘' : '이번 달';

  // 하단 통계 — 평균 / 가장 많은 기간
  const avg = Math.round(vals.reduce((a,b)=>a+b,0) / vals.length);
  let low = 0; vals.forEach((v,i)=>{ if(v < vals[low]) low = i; });
  $('statAvgLabel').textContent = isDaily ? '일 평균' : '월 평균';
  $('statAvg').textContent = fmt(avg);
  $('statPeakLabel').textContent = isDaily ? '가장 적은 날' : '가장 적은 달';
  $('statPeak').textContent = `${labels[low].main} · ${fmt(vals[low])}`;

  // 그래프 (막대 색 통일, 현재 기간만 강조 / 요일+날짜 라벨)
  const max = Math.max(...vals);
  const chart = $('chart');
  chart.innerHTML = '';
  vals.forEach((v,i) => {
    const isLast = i === vals.length-1;
    const col = document.createElement('div');
    col.className = 'bar-col' + (isLast ? ' current' : '');
    const h = max ? Math.round((v/max)*82) + 14 : 14;   // 카드 높이 대비 비율(%)
    col.innerHTML =
      `<span class="bar-val">${Math.round(v/60*10)/10}h</span>` +
      `<div class="bar ${isLast?'current':''}" style="height:${h}%"></div>` +
      `<span class="bar-label">${labels[i].main}</span>` +
      (labels[i].sub ? `<span class="bar-date">${labels[i].sub}</span>` : '');
    chart.appendChild(col);
  });

  $('segDaily').classList.toggle('active', isDaily);
  $('segMonthly').classList.toggle('active', !isDaily);
}

// ---- 화면 전환 ----
function showTab(tab){
  $('home').classList.toggle('hidden', tab !== 'home');
  $('record').classList.toggle('hidden', tab !== 'record');
  document.querySelectorAll('.nav-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tab));
  if(tab === 'record') renderRecord();
}

// ---- 온보딩 → 앱 진입 ----
function enterApp(){
  $('onboarding').classList.add('hidden');
  $('bottomNav').classList.remove('hidden');
  showTab('home');
  renderHome();
}

// ===== 쓰다듬기 (탭 → 통! + 하트) =====
function petKkeusyong(){
  const img = $('charImg');
  img.classList.remove('pet'); void img.offsetWidth; img.classList.add('pet');
  const stage = $('character');
  for(let i=0;i<3;i++){
    const h = document.createElement('span');
    h.className = 'heart'; h.textContent = '♥';
    h.style.left = (40 + Math.random()*20) + '%';
    h.style.top = '24%';
    h.style.animationDelay = (i*0.09) + 's';
    stage.appendChild(h);
    setTimeout(() => h.remove(), 1150);
  }
}

// ===== 반응형: 디바이스 균등 스케일 =====
function fitDevice(){
  const d = $('device');
  const margin = 20;
  const scale = Math.min(1, (window.innerWidth - margin) / 390, (window.innerHeight - margin) / 844);
  d.style.transform = `scale(${scale})`;
}
window.addEventListener('resize', fitDevice);

// ===== 이벤트 바인딩 =====
function checkConsent(){
  $('startBtn').disabled = !($('agreePrivacy').checked && $('agreeUsage').checked);
}
$('agreePrivacy').addEventListener('change', checkConsent);
$('agreeUsage').addEventListener('change', checkConsent);
$('startBtn').addEventListener('click', () => { store.onboarded = true; enterApp(); });

document.querySelectorAll('.nav-btn').forEach(b =>
  b.addEventListener('click', () => showTab(b.dataset.tab)));

$('modeT').addEventListener('click', () => { store.mode='T'; renderHome(); });
$('modeF').addEventListener('click', () => { store.mode='F'; renderHome(); });

$('charImg').addEventListener('click', petKkeusyong);

$('segDaily').addEventListener('click', () => { recView='daily'; renderRecord(); });
$('segMonthly').addEventListener('click', () => { recView='monthly'; renderRecord(); });

// 목표 모달 (스테퍼 ±30분 + 프리셋 칩)
const modal = $('goalModal');
let pendingGoal = store.goal;
function renderGoalPicker(){
  $('goalValue').textContent = fmt(pendingGoal);
  document.querySelectorAll('.preset-chip').forEach(o =>
    o.classList.toggle('active', +o.dataset.min === pendingGoal));
}
function openGoalModal(){ pendingGoal = store.goal; renderGoalPicker(); modal.classList.remove('hidden'); }
$('editGoalBtn').addEventListener('click', openGoalModal);
$('goalCancel').addEventListener('click', () => modal.classList.add('hidden'));
modal.addEventListener('click', e => { if(e.target === modal) modal.classList.add('hidden'); });
$('goalMinus').addEventListener('click', () => { pendingGoal = Math.max(30, pendingGoal - 30); renderGoalPicker(); });
$('goalPlus').addEventListener('click', () => { pendingGoal = Math.min(24*60, pendingGoal + 30); renderGoalPicker(); });
document.querySelectorAll('.preset-chip').forEach(o =>
  o.addEventListener('click', () => { pendingGoal = +o.dataset.min; renderGoalPicker(); }));
$('goalSave').addEventListener('click', () => {
  store.goal = pendingGoal;
  modal.classList.add('hidden');
  renderHome();
});

// ===== 시작 =====
fitDevice();
if(store.onboarded){ enterApp(); }
