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
// accent: UI 강조(게이지/배경)용 · ink: 흰 카드 위 글씨용(대비 확보를 위해 더 진하게)
const LEVELS = [
  { name:'아주 좋은 흐름', condName:'쌩쌩 끄숑',     msg:'끄숑이 컨디션이 최고예요! 지금처럼만 해주세요.',        face:FACES[0], accent:'#5bbd72', soft:'#eaf6ec', ink:'#2f8f4a', filter:'none', img:CHAR },
  { name:'괜찮은 편',     condName:'기분 좋은 끄숑', msg:'끄숑이 아직 쌩쌩해요. 잘 지켜주고 있어요.',             face:FACES[1], accent:'#7cb95f', soft:'#eef6e3', ink:'#41902f', filter:'none', img:CHAR },
  { name:'주의 필요',     condName:'나른한 끄숑',   msg:'끄숑이 조금 나른해졌어요. 잠깐 쉬게 해줄까요?',          face:FACES[2], accent:'#e3ad36', soft:'#fbf2d8', ink:'#a87908', filter:'saturate(.92)', img:CHAR },
  { name:'사용시간 많음', condName:'지친 끄숑',     msg:'끄숑이 많이 지쳤어요. 휴대폰을 잠깐 내려놔 주세요.',      face:FACES[3], accent:'#e3893c', soft:'#fbecdc', ink:'#bc5e14', filter:'saturate(.8) brightness(.97)', img:CHAR },
  { name:'디톡스 필요',   condName:'방전된 끄숑',   msg:'끄숑이 방전됐어요… 지금 끄숑이에겐 휴식이 필요해요.',     face:FACES[4], accent:'#df564b', soft:'#fbe6e3', ink:'#c5372c', filter:'saturate(.65) brightness(.93)', img:CHAR },
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
// 단계·컨디션은 모두 "목표 대비 사용 비율(r = 사용시간 / 목표시간)"을 단일 기준으로 쓴다.
//  → 목표 상태(goalStatus)와 캐릭터 단계·표정·멘트·게이지가 항상 같은 방향으로 움직인다(따로 놀지 않음).
//  경계: r<0.5 1단계 · r<1.0 2단계 · r<1.25 3단계 · r<1.75 4단계 · 그 이상 5단계.
//  특히 r=1.0(목표 도달) 지점에서 "목표 초과" 경고와 캐릭터 경고 단계가 동시에 켜진다.
//  컨디션(%)도 같은 구간에 묶어 보간: 1단계 100~80 · 2 80~60 · 3 60~40 · 4 40~20 · 5 20~0.
const STATE_BANDS = [
  { lo:0,    hi:0.5,  lvl:0, top:100, bot:80 },
  { lo:0.5,  hi:1.0,  lvl:1, top:80,  bot:60 },
  { lo:1.0,  hi:1.25, lvl:2, top:60,  bot:40 },
  { lo:1.25, hi:1.75, lvl:3, top:40,  bot:20 },
  { lo:1.75, hi:2.5,  lvl:4, top:20,  bot:0  },   // 175~250%를 20~0%로 보간, 그 이상은 0%
];
function ratioOf(min, goal){
  if(goal <= 0) return min > 0 ? 99 : 0;   // 목표 0 방어: 사용 중이면 최악 단계로
  return min / goal;
}
function bandOf(r){
  for(const b of STATE_BANDS){ if(r < b.hi) return b; }
  return STATE_BANDS[STATE_BANDS.length - 1];
}
function levelOf(min, goal){ return bandOf(ratioOf(min, goal)).lvl; }
function energyOf(min, goal){
  const r = ratioOf(min, goal);
  if(r <= 0) return 100;
  const b = bandOf(r);
  const t = Math.min(1, Math.max(0, (r - b.lo) / (b.hi - b.lo)));
  return Math.round(b.top - (b.top - b.bot) * t);
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
  if(hKST >= 5  && hKST <= 10) return 'assets/characters/bg0.png';  // 05:00 ~ 10:59
  if(hKST >= 11 && hKST <= 16) return 'assets/characters/bg1.png';  // 11:00 ~ 16:59
  if(hKST >= 17 && hKST <= 19) return 'assets/characters/bg2.png';  // 17:00 ~ 19:59
  return 'assets/characters/bg3.png';                                // 20:00 ~ 04:59
}

// ---- 홈 렌더 ----
function renderHome(){
  const usage = store.usage, goal = store.goal, mode = store.mode;
  const lv = levelOf(usage, goal);
  const L = LEVELS[lv];

  // accent 색 전체 반영
  document.documentElement.style.setProperty('--accent', L.accent);
  document.documentElement.style.setProperty('--accent-soft', L.soft);
  document.documentElement.style.setProperty('--accent-ink', L.ink);
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

  // 끄숑 컨디션 (표정 + 컨디션% + 게이지)
  $('condFace').innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${L.face}</svg>`;
  $('condName').textContent = L.condName;
  const energy = energyOf(usage, goal);
  $('condPct').textContent = `컨디션 ${energy}%`;
  $('condFill').style.width = energy + '%';

  // 오늘 / 목표 / 남은·초과 3분할 + 목표 대비 문구
  $('usageBig').textContent = fmt(usage);
  $('goalText').textContent = fmt(goal);
  const gs = $('goalStatus'), rl = $('remainLabel'), rv = $('remainValue'), rc = $('remainCol');
  if(usage < goal){
    gs.textContent = `목표보다 ${fmt(goal - usage)} 적게 사용했어요`; gs.className = 'goal-status-line pos';
    rl.textContent = '남은 시간'; rv.textContent = fmt(goal - usage); rc.className = 'stat-col remain pos';
  } else if(usage > goal){
    gs.textContent = `목표보다 ${fmt(usage - goal)} 더 사용했어요`; gs.className = 'goal-status-line neg';
    rl.textContent = '초과 시간'; rv.textContent = fmt(usage - goal); rc.className = 'stat-col remain neg';
  } else {
    gs.textContent = '목표를 딱 맞췄어요'; gs.className = 'goal-status-line pos';
    rl.textContent = '남은 시간'; rv.textContent = '0분'; rc.className = 'stat-col remain pos';
  }

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
  let high = 0; vals.forEach((v,i)=>{ if(v > vals[high]) high = i; });
  $('statAvgLabel').textContent = isDaily ? '일 평균' : '월 평균';
  $('statAvg').textContent = fmt(avg);
  $('statPeakLabel').textContent = isDaily ? '가장 많은 날' : '가장 많은 달';
  $('statPeak').textContent = `${labels[high].main} · ${fmt(vals[high])}`;

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

// ===== 온보딩 캐러셀 (3장) =====
const OB_COUNT = 3;
let obIdx = 0;
const obTrack = $('obTrack');
const obNext = $('obNext');
const obSkip = $('obSkip');
const obDots = [...document.querySelectorAll('.ob-dot')];

// 마지막 장에서만 동의 여부로 버튼 활성화 제어
function checkConsent(){
  if(obIdx !== OB_COUNT - 1) return;
  obNext.disabled = !($('agreePrivacy').checked && $('agreeUsage').checked);
}
function renderOb(){
  obIdx = Math.max(0, Math.min(OB_COUNT - 1, obIdx));
  obTrack.style.transform = `translateX(-${obIdx * (100 / OB_COUNT)}%)`;
  obDots.forEach((d, k) => d.classList.toggle('active', k === obIdx));
  const last = obIdx === OB_COUNT - 1;
  obNext.textContent = last ? '끄숑이랑 시작하기' : '다음';
  obSkip.classList.toggle('hide', last);
  if(last) checkConsent(); else obNext.disabled = false;
}
function obGo(i){ obIdx = i; renderOb(); }

obNext.addEventListener('click', () => {
  if(obIdx < OB_COUNT - 1){ obGo(obIdx + 1); }
  else { store.onboarded = true; enterApp(); }
});
obSkip.addEventListener('click', () => obGo(OB_COUNT - 1));
obDots.forEach((d, k) => d.addEventListener('click', () => obGo(k)));
$('agreePrivacy').addEventListener('change', checkConsent);
$('agreeUsage').addEventListener('change', checkConsent);

// 좌우 스와이프로 장 이동
let obStartX = null;
const obView = document.querySelector('.ob-viewport');
obView.addEventListener('touchstart', e => { obStartX = e.touches[0].clientX; }, { passive:true });
obView.addEventListener('touchend', e => {
  if(obStartX == null) return;
  const dx = e.changedTouches[0].clientX - obStartX; obStartX = null;
  if(Math.abs(dx) < 40) return;
  if(dx < 0 && obIdx < OB_COUNT - 1) obGo(obIdx + 1);
  else if(dx > 0 && obIdx > 0) obGo(obIdx - 1);
});
renderOb();

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
