/* ===== 디지털디톡스 코치 · 프로토타입 로직 ===== */

// ---- 상태 ----
const store = {
  get usage(){ return +(localStorage.getItem('usage') ?? 204); },        // 분
  set usage(v){ localStorage.setItem('usage', v); },
  get goal(){ return +(localStorage.getItem('goal') ?? 180); },          // 분 (기본 3시간)
  set goal(v){ localStorage.setItem('goal', v); },
  get mode(){ return localStorage.getItem('mode') ?? 'T'; },
  set mode(v){ localStorage.setItem('mode', v); },
  get onboarded(){ return localStorage.getItem('onboarded') === '1'; },
  set onboarded(v){ localStorage.setItem('onboarded', v ? '1':'0'); },
};

// ---- 단계 정의 ----
const LEVELS = [
  { name:'아주 좋은 흐름', face:'😄', ring:'#bdeccb', light:'#d6f5e0', shadow:'rgba(52,199,89,.22)' },
  { name:'괜찮은 편',     face:'🙂', ring:'#bfe6f6', light:'#dcf2fb', shadow:'rgba(90,200,250,.22)' },
  { name:'주의 필요',     face:'😟', ring:'#ffe8a3', light:'#fff4cf', shadow:'rgba(255,204,0,.28)' },
  { name:'사용시간 많음', face:'😤', ring:'#ffd6a8', light:'#ffe9cf', shadow:'rgba(255,149,0,.28)' },
  { name:'디톡스 필요',   face:'😫', ring:'#ffc2bd', light:'#ffd9d6', shadow:'rgba(255,59,48,.3)' },
];

// ---- 멘트 ----
const MENTS = {
  T:[
    ['좋습니다. 오늘은 꽤 잘 관리하고 있네요.','이 정도면 디지털디톡스 성공권입니다.','지금 페이스 유지하세요.'],
    ['아직 괜찮습니다. 여기서 더 늘어나지만 않으면 됩니다.','슬슬 조절할 시간입니다.','지금 멈추면 오늘 기록은 나쁘지 않습니다.'],
    ['사용시간이 꽤 늘었습니다. 지금부터 조절해야 합니다.','이대로 가면 목표 초과입니다.','지금은 쉬는 게 아니라 끊어야 할 타이밍입니다.'],
    ['눈 건강이 걱정되는 수준이네요.','오늘 사용시간은 꽤 과합니다.','이건 휴식이 아니라 습관적으로 보고 있는 겁니다.'],
    ['오늘은 확실히 과했습니다. 변명할 시간이 아닙니다.','지금 사용시간은 디지털디톡스와 거리가 멉니다.','이 정도면 습관을 다시 점검해야 합니다.'],
  ],
  F:[
    ['잘하고 있어요. 오늘 정말 좋은 흐름이에요.','휴대폰과 거리두기, 아주 잘 실천하고 있어요.','지금처럼만 해도 충분히 멋져요.'],
    ['아직 괜찮아요. 조금만 쉬어가면 더 좋아요.','잠깐 화면을 내려놓고 숨 돌려볼까요?','오늘도 충분히 잘하고 있어요.'],
    ['조금 많이 사용한 것 같아요. 잠깐 쉬어가요.','눈도 마음도 조금 지쳤을 수 있어요.','괜찮아요. 지금부터 줄이면 돼요.'],
    ['오늘 사용시간이 좀 과하게 많아 보여요.','괜찮아요. 지금이라도 잠깐 내려놓아볼까요?','조금 쉬어도 괜찮아요. 휴대폰은 잠시 멀리 둬요.'],
    ['오늘 많이 지쳤을 것 같아요. 이제는 정말 쉬어야 해요.','괜찮아요. 오늘이 끝나기 전에 잠깐이라도 멈춰봐요.','많이 사용했지만, 지금부터 다시 시작할 수 있어요.'],
  ],
};

// ---- 기록용 임시 데이터 (분) ----
const DAILY = { labels:['월','화','수','목','금','토','일'], vals:[176, 232, 198, 255, 312, 268, 204] };
const MONTHLY = { labels:['1월','2월','3월','4월','5월','6월'], vals:[5180, 4720, 5400, 4880, 5620, 5180] };

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
function pick(arr, seed){ return arr[seed % arr.length]; }
let mentSeed = 0;

// ---- 홈 렌더 ----
function renderHome(){
  const usage = store.usage, goal = store.goal, mode = store.mode;
  const lv = levelOf(usage);
  const L = LEVELS[lv];

  // 캐릭터
  $('charFace').textContent = L.face;
  $('stateLabel').textContent = L.name;
  const ring = $('character').querySelector('.char-ring');
  ring.style.setProperty('--ring', L.ring);
  ring.style.setProperty('--ring-light', L.light);
  ring.style.setProperty('--ring-shadow', L.shadow);
  $('stateLabel').style.setProperty('--ring', L.ring);

  // 말풍선
  $('bubble').textContent = pick(MENTS[mode][lv], mentSeed);

  // 사용시간
  $('usageBig').textContent = fmt(usage);

  // 목표 대비
  const gs = $('goalStatus');
  if(usage <= goal){
    gs.textContent = `목표보다 ${fmt(goal - usage)} 적게 사용 중`;
    gs.className = 'goal-status pos';
  }else{
    gs.textContent = `목표보다 ${fmt(usage - goal)} 초과`;
    gs.className = 'goal-status neg';
  }

  // 목표 텍스트
  $('goalText').textContent = fmt(goal);

  // 모드 버튼
  $('modeT').classList.toggle('active', mode === 'T');
  $('modeF').classList.toggle('active', mode === 'F');

  // 슬라이더 동기화
  $('usageSlider').value = usage;
}

// ---- 기록 렌더 ----
let recView = 'daily';
function renderRecord(){
  const isDaily = recView === 'daily';
  const data = isDaily ? DAILY : MONTHLY;
  // 오늘/이번달 값은 홈 사용시간과 연동 (마지막 막대)
  const vals = data.vals.slice();
  if(isDaily) vals[vals.length-1] = store.usage;

  const cur = vals[vals.length-1];
  const prev = vals[vals.length-2];

  $('recTotalLabel').textContent = isDaily ? '오늘 총 사용시간' : '이번 달 총 사용시간';
  $('recTotal').textContent = fmt(cur);
  $('recCompareLabel').textContent = isDaily ? '전일 대비' : '전월 대비';

  const diff = cur - prev;
  const cmp = $('recCompare');
  const word = isDaily ? '전일' : '전월';
  if(diff >= 0){ cmp.textContent = `${word}보다 ${fmt(diff)} 증가`; cmp.className = 'compare-val up'; }
  else { cmp.textContent = `${word}보다 ${fmt(-diff)} 감소`; cmp.className = 'compare-val down'; }

  $('recChartLabel').textContent = isDaily ? '최근 7일' : '최근 6개월';

  // 그래프
  const max = Math.max(...vals);
  const chart = $('chart');
  chart.innerHTML = '';
  vals.forEach((v,i) => {
    const col = document.createElement('div');
    col.className = 'bar-col';
    const h = max ? Math.round((v/max)*120) + 8 : 8;
    const isLast = i === vals.length-1;
    col.innerHTML =
      `<span class="bar-val">${Math.round(v/60*10)/10}h</span>` +
      `<div class="bar ${isLast?'today':''}" style="height:${h}px"></div>` +
      `<span class="bar-label">${data.labels[i]}</span>`;
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

// ===== 이벤트 바인딩 =====
function checkConsent(){
  $('startBtn').disabled = !($('agreePrivacy').checked && $('agreeUsage').checked);
}
$('agreePrivacy').addEventListener('change', checkConsent);
$('agreeUsage').addEventListener('change', checkConsent);
$('startBtn').addEventListener('click', () => { store.onboarded = true; enterApp(); });

// 네비
document.querySelectorAll('.nav-btn').forEach(b =>
  b.addEventListener('click', () => showTab(b.dataset.tab)));

// 모드
$('modeT').addEventListener('click', () => { store.mode='T'; mentSeed++; renderHome(); });
$('modeF').addEventListener('click', () => { store.mode='F'; mentSeed++; renderHome(); });

// 데모 슬라이더
$('usageSlider').addEventListener('input', e => {
  store.usage = +e.target.value; mentSeed++; renderHome();
});

// 기록 세그먼트
$('segDaily').addEventListener('click', () => { recView='daily'; renderRecord(); });
$('segMonthly').addEventListener('click', () => { recView='monthly'; renderRecord(); });

// 목표 모달
const modal = $('goalModal');
let pendingGoal = store.goal;
function openGoalModal(){
  pendingGoal = store.goal;
  $('goalCustom').value = '';
  document.querySelectorAll('.goal-opt').forEach(o =>
    o.classList.toggle('active', +o.dataset.min === store.goal));
  modal.classList.remove('hidden');
}
$('editGoalBtn').addEventListener('click', openGoalModal);
$('goalCancel').addEventListener('click', () => modal.classList.add('hidden'));
modal.addEventListener('click', e => { if(e.target === modal) modal.classList.add('hidden'); });
document.querySelectorAll('.goal-opt').forEach(o =>
  o.addEventListener('click', () => {
    pendingGoal = +o.dataset.min;
    $('goalCustom').value = '';
    document.querySelectorAll('.goal-opt').forEach(x => x.classList.toggle('active', x === o));
  }));
$('goalCustom').addEventListener('input', e => {
  const h = +e.target.value;
  if(h > 0){ pendingGoal = h*60; document.querySelectorAll('.goal-opt').forEach(x => x.classList.remove('active')); }
});
$('goalSave').addEventListener('click', () => {
  store.goal = Math.min(24*60, Math.max(30, pendingGoal));
  modal.classList.add('hidden');
  renderHome();
});

// ===== 시작 =====
if(store.onboarded){ enterApp(); }
