const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const overlay = document.querySelector('#overlay');
const startScreen = document.querySelector('#start-screen');
const nameInput = document.querySelector('#name-input');
const rank = document.querySelector('#rank');
const playerName = document.querySelector('#player-name');
const progressFill = document.querySelector('#progress-fill');
const edgeHint = document.querySelector('#edge-hint');
const questTitle = document.querySelector('#quest-title');
const questNodes = document.querySelector('#quest-nodes');
const soundButton = document.querySelector('#sound-button');
const W = 1100, H = 680, WORLD_W = 1450;
const asset = path => `${path}?v=20260720-pixel-v5`;
const sideHero = new Image();
sideHero.src = asset('assets/fire-wizard-side-run-8x-v2.png');
const heroRunFrames = Array.from({ length: 4 }, (_, index) => {
  const image = new Image();
  image.src = asset(`assets/fire-wizard-run-v3-${index}.png`);
  return image;
});
const turtleArt = new Image();
turtleArt.src = asset('assets/turtle-chief-8x.png');
const mentorArt = Object.fromEntries(['gold', 'wood', 'water', 'fire', 'earth'].map(element => {
  const image = new Image(); image.src = asset(`assets/mentor-${element}-v3-8x.png`); return [element, image];
}));
const innerDemons = [
  { id:'fomo', stage:'risk', name:'追高炎魔', x:350, y:420, color:'#d94b2d', line:'快追！再等就錯過暴漲了！你敢不敢把風險全押上？' },
  { id:'revenge', stage:'mindset', name:'復仇雙頭獸', x:315, y:210, color:'#e07a32', line:'剛被停損？立刻打回去！今天一定要把虧損凹回來！' },
  { id:'baghold', stage:'smc', name:'凹單沼澤怪', x:470, y:190, color:'#7f9b3f', line:'停損只是暫時的，把它移遠一點，價格總會回來……' },
  { id:'overtrade', stage:'patterns', name:'過度交易刃螳螂', x:820, y:220, color:'#3c8b91', line:'每一根 K 線都是機會！不下單就是輸！' },
  { id:'liquidation', stage:'boss', name:'爆倉空洞魔王', x:780, y:470, color:'#70416e', line:'只要一次失控的槓桿，我就能吞掉你所有的本金。' },
];
const demonFrames = Object.fromEntries(innerDemons.map(demon => {
  const image = new Image(); image.src = asset(`assets/boss-${demon.id}-8x.png`); return [demon.id, [image]];
}));
ctx.imageSmoothingEnabled = false;

const npcs = {
  turtle: { id: 'turtle', x: 570, y: 355, name: '村長老龜', kind: 'turtle' },
  smith: { id: 'smith', x: 245, y: 480, name: '金相・衡', element: 'gold', aspect: '界線與風控' },
  shrine: { id: 'shrine', x: 180, y: 190, name: '木相・靜', element: 'wood', aspect: '耐心與心態' },
  captain: { id: 'captain', x: 565, y: 140, name: '水相・觀', element: 'water', aspect: '結構與流動' },
  artist: { id: 'artist', x: 925, y: 180, name: '火相・斷', element: 'fire', aspect: '行動與型態' },
  wizard: { id: 'wizard', x: 900, y: 490, name: '土相・定', element: 'earth', aspect: '整合與紀律' },
};

const sideScenes = {
  risk:     { sky:'#526d7a', far:'#314958', ground:'#5b5b58', accent:'#d9b65a', name:'古堡鍛造院', demon:{x:620,y:480}, mentor:{x:1150,y:485} },
  mindset:  { sky:'#69744c', far:'#3e5743', ground:'#566247', accent:'#b7c96f', name:'泥沼神社', demon:{x:620,y:480}, mentor:{x:1150,y:485} },
  smc:      { sky:'#397189', far:'#24515f', ground:'#496b70', accent:'#8ed2df', name:'湖畔碼頭', demon:{x:620,y:480}, mentor:{x:1150,y:485} },
  patterns: { sky:'#355c53', far:'#223e39', ground:'#4e624f', accent:'#9fc76c', name:'星輝森林', demon:{x:620,y:480}, mentor:{x:1150,y:485} },
  boss:     { sky:'#4c435f', far:'#302b42', ground:'#585264', accent:'#d7b37b', name:'遺跡魔法師塔', demon:{x:620,y:480}, mentor:{x:1150,y:485} },
};

const stages = [
  {
    id: 'risk', number: 1, npc: 'smith', place: '古堡鍛造院', title: '合約倉位管理', rank: '古堡風控學徒',
    item: { icon: '🔨', name: '風控之鎚', desc: '進場前先算風險的鍛造之鎚。' },
    intro: '金相・衡是你的界線。進場前先知道最多願意虧多少，才有資格談放大利潤。',
    hint: '穿過村莊西北的木棧道，前往泥沼神社。',
    questions: [
      { q:'本金 $1,000，單筆風險 1%，停損距離 5%。正確倉位是多少？', a:2, o:['$50','$100','$200','$1,000'], e:'可虧金額是 $10；$10 ÷ 5% = <b>$200</b>。' },
      { q:'進場 $100、停損 $95、目標 $115，這筆交易的 R:R 為？', a:1, o:['1:1','1:3','1:5','3:1'], e:'風險是 $5，潛在報酬是 $15，因此是 <b>1:3</b>。' },
      { q:'連續兩筆停損後，最健康的下一步是？', a:3, o:['加倍倉位凹回來','移遠停損','立刻追 K 線','回看計畫與日虧上限'], e:'停損是計畫的一部分；先回到規則，不讓情緒接管。' },
      { q:'帳戶 $2,000，風險 1%，停損 4%。倉位應為？', a:1, o:['$200','$500','$800','$2,000'], e:'可虧 $20；$20 ÷ 4% = <b>$500</b>。' },
      { q:'槓桿最正確的理解是？', a:0, o:['同時放大部位與虧損速度','幾乎不會輸','可忽略停損','保證提高勝率'], e:'槓桿不是免費力量，風控與停損不能省略。' },
    ],
  },
  {
    id: 'mindset', number: 2, npc: 'shrine', place: '泥沼神社', title: '交易心態建設', rank: '心穩修士',
    item: { icon: '🪬', name: '靜心御守', desc: '在波動中提醒你遵守紀律。' },
    intro: '木相・靜是你的耐心。市場越吵，越要回到自己的交易計畫。',
    hint: '沿著湖岸石路向東，前往湖畔碼頭。',
    questions: [
      { q:'BTC 半小時暴漲 8%，群組都喊上車，你沒有部位。你會？', a:2, o:['市價全倉追進','開更高槓桿','等回測與自己的進場條件','立刻向朋友借錢'], e:'避免 FOMO。沒有符合計畫的進場，觀望也是正確選擇。' },
      { q:'今日連續 3 筆虧損，已達日虧上限。最好的選擇是？', a:1, o:['加碼一筆凹回來','停止交易並檢討','轉去更高槓桿','移除停損'], e:'日虧上限存在的目的，就是在情緒失控前保護本金。' },
      { q:'被停損後 10 分鐘價格回到原方向，應如何理解？', a:0, o:['接受計畫結果，避免報復性追單','立刻追價報復','怪罪交易所','把下一次停損移更遠'], e:'一次停損不代表策略失敗；紀律比事後懊悔重要。' },
      { q:'勝率 40%、每次賺 3R、每次虧 1R，期望值偏向？', a:3, o:['一定虧損','完全靠運氣','不能計算','長期仍可能為正'], e:'0.4 × 3R − 0.6 × 1R = +0.6R，R:R 會改變期望值。' },
      { q:'下列何者最像「過度交易」？', a:2, o:['只做符合計畫的型態','每天記錄交易','每根 K 線都想下單','等待關鍵價位'], e:'市場不是每分鐘都有機會，等待也是交易技能。' },
    ],
  },
  {
    id: 'smc', number: 3, npc: 'captain', place: '湖畔碼頭', title: 'SMC 基礎進出場', rank: '聰明錢追蹤者',
    item: { icon: '🔭', name: '大戶望遠鏡', desc: '用來觀察結構與流動性的魔法鏡。' },
    intro: '水相・觀是你的洞察。先讀市場結構，再尋找流動性被掃後的機會。',
    hint: '走進東側星輝森林，面對火相・斷的型態試煉。',
    questions: [
      { q:'出現連續 HH 與 HL，通常代表什麼結構？', a:0, o:['上升趨勢','下降趨勢','橫盤必跌','無法判讀'], e:'Higher High 與 Higher Low 是基本上升結構。' },
      { q:'CHoCH 的核心意義是？', a:1, o:['增加槓桿','市場結構可能轉變','保證反轉','任何突破都叫 CHoCH'], e:'Change of Character 表示原本的結構被破壞，需重新評估方向。' },
      { q:'等高點上方常被稱為什麼區域？', a:2, o:['FVG','訂單簿','流動性／停損聚集區','固定停利區'], e:'等高點上方常有空單停損，容易成為流動性掃蕩目標。' },
      { q:'看多 Order Block 常指哪一根 K 線？', a:3, o:['最高的一根','任何十字線','第一根上漲 K','大幅上漲前最後一根下跌 K'], e:'常以大幅推動前的最後一根反向 K 線作為觀察區。' },
      { q:'較完整的 SMC 看多模型順序為？', a:1, o:['追突破→移除停損','掃流動性→CHoCH→回踩進場','先全倉→再找結構','只看 RSI'], e:'等待掃流動性與結構改變，再在回踩區尋找有風險定義的進場。' },
    ],
  },
  {
    id: 'patterns', number: 4, npc: 'artist', place: '星輝森林', title: '常見技術型態', rank: '型態獵人',
    item: { icon: '🔎', name: '型態放大鏡', desc: '讓支撐、壓力與頸線無所遁形。' },
    intro: '火相・斷是你的行動力。型態不是預言，而是把價格行為、頸線與風險說清楚的語言。',
    hint: '循森林南側的石橋前進，接受遺跡魔法師塔的最終試煉。',
    questions: [
      { q:'頭肩頂型態最重要的確認訊號是？', a:1, o:['看到右肩就做空','跌破頸線','成交量最大','K 線變紅'], e:'型態需等待頸線被有效突破，不能只靠外觀預測。' },
      { q:'雙重頂（M 頭）通常需留意哪個位置？', a:2, o:['第二個頂必然更高','均線黃金交叉','兩頂之間低點的頸線','任何一根長紅'], e:'跌破兩頂之間低點，才是型態可能確認的關鍵。' },
      { q:'旗形在強趨勢中常被視為？', a:0, o:['可能的趨勢中繼','保證反轉','完全無用','固定做空訊號'], e:'旗形常出現在急漲或急跌後的短暫整理，仍需等待突破確認。' },
      { q:'上方壓力被突破並成功回踩，常見的角色互換是？', a:3, o:['支撐變壓力','停損變槓桿','成交量消失','壓力變支撐'], e:'被突破的壓力若守住回踩，可能轉為新的支撐。' },
      { q:'分辨楔形與三角收斂時，最該看的是？', a:1, o:['K 線顏色','兩條趨勢線的斜率與收斂方式','社群喊單','隨機指標'], e:'型態辨識的核心是高低點與趨勢線的結構，而不是單根 K 線。' },
    ],
  },
  {
    id: 'boss', number: 5, npc: 'wizard', place: '遺跡魔法師塔', title: '最終綜合考核', rank: '交易魔法師',
    item: { icon: '🧙', name: '交易魔法師帽', desc: '完成五種火術試煉的證明。' },
    intro: '土相・定是你的根基。最後一關考的是能否把風控、心態、結構與型態放進同一個流程。',
    hint: '所有試煉已完成，回到晨光新手村展示你的收藏。',
    questions: [
      { q:'一筆交易開始前，最優先確認的是？', a:0, o:['停損位置與單筆風險','別人的獲利截圖','最高槓桿','最新喊單'], e:'先定義風險，才能反推適合的倉位大小。' },
      { q:'遇到流動性掃蕩後的理想做法是？', a:2, o:['立刻追單','移除停損','等待結構確認與回踩','永遠反向全倉'], e:'掃蕩本身不是進場指令，仍要等 CHoCH、回踩與明確停損。' },
      { q:'圖表出現疑似頭肩頂但未跌破頸線，應？', a:3, o:['直接做空','保證反轉','加倍槓桿','等待確認，或依計畫觀望'], e:'型態尚未確認前只是假設，不能取代交易計畫。' },
      { q:'浮虧時最容易傷害帳戶的情緒行為是？', a:1, o:['檢查原先假設','任意移遠停損','降低單筆風險','暫停觀察'], e:'移遠停損常讓原本定義好的小風險變成不可控虧損。' },
      { q:'真正的交易魔法師相信什麼？', a:1, o:['永遠預測正確','紀律與流程比預測重要','每筆都要賺','槓桿越高越強'], e:'可重複的流程、風險控制與紀律，才是長期生存的力量。' },
    ],
  },
];

const rankNames = ['見習旅人', '古堡風控學徒', '心穩修士', '聰明錢追蹤者', '型態獵人', '交易魔法師'];
const saveKey = 'trading-wizard-village-v2';
const legacySaveKey = 'trading-wizard-village-v1';
let state = { name: '', level: 0, intro: false, completed: [] };
try { state = { ...state, ...JSON.parse(localStorage.getItem(saveKey) || localStorage.getItem(legacySaveKey)) }; } catch { /* empty save */ }
if (!Array.isArray(state.completed)) state.completed = [];
if (!Array.isArray(state.demonsMet)) state.demonsMet = [];
if (typeof state.soundOn !== 'boolean') state.soundOn = true;
if (state.riskComplete && !state.completed.includes('risk')) state.completed.push('risk');
state.completed = stages.filter(stage => state.completed.includes(stage.id)).map(stage => stage.id);
state.level = state.completed.length;

let player = { x: 145, y: 510, r: 16, walkClock: 0, moving: false };
let playerFacing = 1;
let keys = new Set(); let locked = true; let dialogOpen = false; let last = 0; let animationTime = 0; let levelBurstUntil = 0; let lastStepSound = 0; let cameraX = 0; let interactionLatch = '';
let audioContext;

function enableAudio() {
  if (!window.AudioContext && !window.webkitAudioContext) return;
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === 'suspended') audioContext.resume();
}
function tone(frequency, start, duration, type='square', volume=.035) {
  if (!state.soundOn || !audioContext || audioContext.state !== 'running') return;
  const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain();
  oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(volume, start); gain.gain.exponentialRampToValueAtTime(.001, start + duration);
  oscillator.connect(gain).connect(audioContext.destination); oscillator.start(start); oscillator.stop(start + duration);
}
function playStep() { if (!audioContext) return; const now=audioContext.currentTime; tone(180,now,.055,'square',.018); tone(260,now+.015,.04,'square',.01); }
function playClear() { enableAudio(); if (!audioContext) return; const now=audioContext.currentTime; [523,659,784,1046].forEach((pitch,index)=>tone(pitch,now+index*.105,.18,'square',.045)); }
function playUi() { enableAudio(); if (!audioContext) return; tone(620,audioContext.currentTime,.055,'square',.025); }
function playCorrect() { enableAudio(); if (!audioContext) return; const now=audioContext.currentTime; tone(660,now,.09,'square',.035); tone(880,now+.075,.12,'square',.04); }
function playWrong() { enableAudio(); if (!audioContext) return; tone(170,audioContext.currentTime,.16,'sawtooth',.035); }
function playDemon() { enableAudio(); if (!audioContext) return; const now=audioContext.currentTime; tone(100,now,.17,'sawtooth',.025); tone(78,now+.08,.22,'square',.02); }

function persist() { localStorage.setItem(saveKey, JSON.stringify(state)); }
function nextStage() { return stages.find(stage => !state.completed.includes(stage.id)); }
function activeScene() { return sideScenes[nextStage()?.id] || sideScenes.boss; }
function activeDemon() { const stage = nextStage(); return stage ? innerDemons.find(demon => demon.stage === stage.id) : null; }
function activeMentor() { const stage = nextStage(); return stage ? npcs[stage.npc] : null; }
function enterStage() { player.x = 145; player.y = 510; player.walkClock = 0; interactionLatch = ''; keys.clear(); }
function stageForNpc(npc) { return stages.find(stage => stage.npc === npc.id); }
function stageIsAvailable(stage) { return stages.indexOf(stage) === state.completed.length; }
function titleFor(stage) { return `第 ${stage.number} 關 · ${stage.place}`; }
function esc(str) { return str.replace(/[&<>"']/g, s => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#039;' }[s])); }
function updateHUD() {
  playerName.textContent = state.name || '見習生';
  rank.textContent = `Lv.${state.level} ${rankNames[state.level]}`;
  progressFill.style.width = `${8 + state.level * 18.4}%`;
  soundButton.textContent = state.soundOn ? '🔊' : '🔇';
  soundButton.setAttribute('aria-label', state.soundOn ? '關閉音效' : '開啟音效');
  updateQuestRibbon();
  updateGuidance();
}
function updateQuestRibbon() {
  const stage = nextStage();
  questTitle.textContent = stage ? `第 ${stage.number} 關・${stage.place}` : '五大試煉・全部完成';
  questNodes.innerHTML = stages.map((item, index) => {
    const status = state.completed.includes(item.id) ? 'done' : stage?.id === item.id ? 'active' : '';
    return `<span class="quest-node ${status}" aria-label="第 ${index + 1} 關 ${item.place}${status === 'done' ? '，已完成' : status === 'active' ? '，進行中' : '，未解鎖'}"></span>`;
  }).join('');
}
function updateGuidance() {
  const stage = nextStage();
  if (!state.intro || !stage) { edgeHint.classList.add('hidden'); return; }
  const scene = activeScene();
  const arrow = player.x < scene.demon.x ? '→ 面對心魔' : '→ 尋找導師';
  edgeHint.textContent = `${arrow}　第 ${stage.number} 關：${stage.place}`;
  edgeHint.classList.remove('hidden');
}
function show(html, className = '') {
  locked = true;
  dialogOpen = true;
  overlay.className = `overlay ${className}`;
  overlay.innerHTML = html;
  overlay.querySelectorAll('[data-close]').forEach(button => { button.onclick = () => { playUi(); close(); }; });
}
function close() { overlay.className = 'overlay hidden'; overlay.innerHTML = ''; dialogOpen = false; locked = false; }
function mentorPortrait(npc) { if (npc.kind === 'turtle') return `<img src="${asset('assets/turtle-chief-8x.png')}" alt="${npc.name}" />`; return `<img src="${asset(`assets/mentor-${npc.element}-v3-8x.png`)}" alt="${npc.name}" />`; }
function speaker(npc, body, action = '繼續') { return `<div class="panel"><div class="speaker"><div class="portrait mentor-portrait">${mentorPortrait(npc)}</div><div><small>${npc.aspect ? `你的${npc.aspect}之相` : '晨光村居民'}</small><strong>${npc.name}</strong></div></div><p>${body}</p><button class="continue" data-close>${action} →</button></div>`; }

function intro() {
  show(speaker(npcs.turtle, `歡迎，<b>${esc(state.name || '見習生')}</b>！五位導師不是別人，而是你在交易路上會遇到的五個自己：界線、耐心、觀察、行動與紀律。`, '我準備好了'));
  overlay.querySelector('[data-close]').onclick = () => { state.intro = true; persist(); updateHUD(); close(); tutorial(); };
}
function tutorial() {
  show(`<div class="panel center"><div class="portrait" style="margin:auto">📜</div><h2>小小冒險守則</h2><div class="fact"><b>探索</b><br>用 <b>WASD／方向鍵</b> 移動，碰到心魔或導師時會<b>自動互動</b>。</div><div class="fact"><b>收藏</b><br>每關通過都會得到道具。按 <b>B</b> 或點 🎒 可查看背包。</div><div class="fact"><b>第一個任務</b><br>前往西南側的「古堡鍛造院」，找金相・衡練習先守住風險。</div><button class="continue" data-close>出發吧 →</button></div>`);
}
function interactionTargets() {
  const stage = nextStage();
  if (!stage) return [];
  const scene = activeScene();
  const mentor = activeMentor();
  const demon = activeDemon();
  return [
    { type:'npc', value:mentor, x:scene.mentor.x, y:scene.mentor.y, range:108 },
    { type:'demon', value:demon, x:scene.demon.x, y:scene.demon.y, range:122 },
  ].map(target => ({ ...target, distance:Math.hypot(player.x-target.x, player.y-target.y) }))
    .filter(target => target.distance < target.range)
    .sort((a,b) => a.distance-b.distance);
}
function interact(target = null) {
  if (locked) return;
  const stage = nextStage();
  if (!stage) { rewardChest(); return; }
  target ||= interactionTargets()[0];
  if (!target) return;
  if (target.type === 'demon') { playDemon(); confrontDemon(target.value); return; }
  const near = target.value;
  if (state.completed.includes(stage.id)) {
    show(speaker(near, `「${stage.item.name}」已收進你的背包。下一步請前往下一個試煉。`));
  } else if (!stageIsAvailable(stage)) {
    const needed = stages[stages.indexOf(stage) - 1];
    show(speaker(near, `這裡仍被火焰封印。先完成「<b>${needed.place}</b>」的試煉吧。`));
  } else if (!state.demonsMet.includes(stage.id)) {
    const demon = innerDemons.find(item => item.stage === stage.id);
    show(speaker(near, `在開始試煉前，先面對附近的「<b>${demon.name}</b>」。找它交談，認清它的陷阱。`));
  } else {
    stageLesson(stage);
  }
}
function autoInteract() {
  if (locked || !state.intro || !nextStage()) return;
  const target = interactionTargets()[0];
  if (!target) { interactionLatch = ''; return; }
  const key = `${target.type}:${target.value.id}`;
  if (interactionLatch === key) return;
  interactionLatch = key;
  interact(target);
}
function confrontDemon(demon) {
  const firstMeeting = !state.demonsMet.includes(demon.stage);
  if (firstMeeting) { state.demonsMet.push(demon.stage); persist(); }
  show(`<div class="panel"><div class="speaker"><div class="portrait demon-portrait"><img src="${asset(`assets/boss-${demon.id}-8x.png`)}" alt="${demon.name}" /></div><div><small>交易心魔</small><strong>${demon.name}</strong></div></div><p>「${demon.line}」</p><div class="fact"><b>${firstMeeting ? '心魔已現形' : '再次面對心魔'}</b><br>辨識誘惑後，回到導師身邊，使用規則與紀律完成試煉。</div><button class="continue" data-close>${firstMeeting ? '我不會被你控制' : '回到導師身邊'} →</button></div>`);
}
function stageLesson(stage) {
  const npc = npcs[stage.npc];
  show(`<div class="panel"><div class="speaker"><div class="portrait mentor-portrait">${mentorPortrait(npc)}</div><div><small>${npc.aspect} · ${titleFor(stage)}</small><strong>${npc.name}</strong></div></div><h2>${stage.title}</h2><p>${stage.intro}</p>${chartDemo(stage.id)}<div class="fact"><b>通關規則</b><br>回答 5 題，答對至少 4 題即可取得「${stage.item.name}」。</div><button class="continue" id="start-quiz">接受試煉 →</button></div>`);
  document.querySelector('#start-quiz').onclick = () => quiz(stage, 0, 0, []);
}
function quiz(stage, index, score, history) {
  const question = stage.questions[index];
  show(`<div class="panel"><div class="quiz-top"><span>${titleFor(stage)} 試煉</span><span>答對 ${score} / ${index}</span></div><h3>第 ${index + 1} 題／${stage.questions.length}</h3><p>${question.q}</p><div class="forge">${question.o.map((option, answer) => `<button data-answer="${answer}">${option}</button>`).join('')}</div><div class="explain" id="explain">選擇你的答案，讓火焰為你的計畫定型。</div></div>`);
  overlay.querySelectorAll('[data-answer]').forEach(button => button.onclick = () => {
    const choice = +button.dataset.answer;
    const correct = choice === question.a;
    correct ? playCorrect() : playWrong();
    overlay.querySelectorAll('[data-answer]').forEach(answer => answer.disabled = true);
    button.classList.add(correct ? 'good' : 'bad');
    if (!correct) overlay.querySelector(`[data-answer="${question.a}"]`).classList.add('good');
    const explanation = document.querySelector('#explain');
    explanation.innerHTML = `${correct ? '✓ 火焰穩定！' : '這次沒關係。'} ${question.e}<br><button class="continue" id="next" style="float:none;margin-top:12px">${index === stage.questions.length - 1 ? '查看試煉 Review →' : '下一題 →'}</button>`;
    const answer = { choice, correct };
    document.querySelector('#next').onclick = () => index === stage.questions.length - 1 ? result(stage, score + correct, [...history, answer]) : quiz(stage, index + 1, score + correct, [...history, answer]);
  });
}
function result(stage, score, history) {
  const passed = score >= 4;
  const rows = stage.questions.map((question, index) => {
    const answer = history[index];
    return `<article class="review-item ${answer.correct ? 'correct' : 'miss'}"><span class="review-mark">${answer.correct ? '✓' : '!'}</span><div><b>第 ${index + 1} 題　${answer.correct ? '掌握了' : '建議複習'}</b><small>你的答案：${question.o[answer.choice]}　·　正解：${question.o[question.a]}</small><p>${question.e}</p></div></article>`;
  }).join('');
  show(`<div class="panel review"><p class="eyebrow">STAGE ${stage.number} REVIEW</p><h2>${passed ? `${stage.place}完成！` : '這次的試煉紀錄'}</h2><p class="review-score"><b>${score}</b> / ${stage.questions.length}<span>${passed ? '已達成通關標準' : '需要答對 4 題才能通關'}</span></p><div class="review-list">${rows}</div><button class="continue" id="review-next">${passed ? '接受升級與收藏 →' : '帶著筆記再試一次 →'}</button></div>`);
  document.querySelector('#review-next').onclick = () => passed ? completeStage(stage) : quiz(stage, 0, 0, []);
}
function completeStage(stage) {
  if (!state.completed.includes(stage.id)) state.completed.push(stage.id);
  state.level = state.completed.length;
  persist();
  updateHUD();
  levelUp(stage);
}
function levelUp(stage) {
  const following = nextStage();
  const finished = !following;
  show(`<div class="levelup overlay"><div class="panel levelup center"><div class="badge">${finished ? '🧙' : stage.item.icon}</div><p class="eyebrow">${finished ? 'ALL TRIALS CLEAR!' : 'LEVEL UP!'}</p><h2>${finished ? '交易魔法師' : stage.rank}</h2><p>${finished ? '你已掌握風控、心態、結構與型態。真正的魔法，是紀律。' : `獲得收藏道具「<b>${stage.item.name}</b>」！`}</p><div class="unlock-card">✦ 外型解鎖：<b>${finished ? '魔法師之冠' : '焰紋披風 ＋ 星火冠'}</b></div>${following ? `<div class="fact"><b>下一關指引：${following.place}</b><br>${following.hint}</div>` : '<div class="fact"><b>最終獎勵</b><br>回到廣場，打開背包查看五件收藏。</div>'}<button class="continue" data-close>${finished ? '成為交易魔法師' : '循著火焰前進'}</button></div></div>`);
  overlay.querySelector('[data-close]').onclick = () => { playClear(); levelBurstUntil = performance.now() + 3200; close(); if (finished) rewardChest(); else enterStage(); };
}
function chartDemo(stageId) {
  if (stageId === 'smc') return `<figure class="chart-demo"><figcaption>SMC 簡圖：掃流動性 → CHoCH → 回踩 OB</figcaption><svg viewBox="0 0 420 150" role="img" aria-label="SMC 市場結構示意圖"><path d="M20 104 L76 78 L120 98 L175 50 L222 112 L276 83 L328 36 L400 60" fill="none" stroke="#ffc44f" stroke-width="5"/><line x1="208" y1="20" x2="208" y2="128" stroke="#ef5a36" stroke-width="3" stroke-dasharray="7 5"/><rect x="205" y="105" width="42" height="20" fill="#d85232"/><text x="175" y="18">掃流動性</text><text x="253" y="76">CHoCH</text><text x="205" y="145">OB 回踩區</text></svg></figure>`;
  if (stageId === 'patterns') return `<figure class="chart-demo"><figcaption>型態簡圖：頭肩頂需等待頸線突破</figcaption><svg viewBox="0 0 420 150" role="img" aria-label="頭肩頂型態示意圖"><path d="M18 112 L70 68 L118 106 L210 25 L298 108 L346 74 L402 112" fill="none" stroke="#ffc44f" stroke-width="6"/><line x1="24" y1="112" x2="400" y2="112" stroke="#ef5a36" stroke-width="4" stroke-dasharray="8 5"/><text x="53" y="55">左肩</text><text x="190" y="18">頭</text><text x="332" y="60">右肩</text><text x="276" y="139">頸線</text></svg></figure>`;
  return '';
}
function rewardChest() {
  show(`<div class="panel reward"><p class="eyebrow">ALL TRIALS CLEAR</p><section class="final-awakening"><img src="${asset('assets/final-awakening-preview.png')}" alt="五元素覺醒後的交易魔法師" /><div class="final-awakening-copy"><small>FIVE ELEMENT AWAKENING</small><h2>交易魔法師・覺醒完成</h2><p>你已將風控、心態、結構、型態與紀律，化為自己的五元素力量。</p><div class="awakening-rule">✦ 不是預測市場，而是駕馭自己。</div></div></section><h3>交易魔法師專屬入口</h3><p>選擇適合你的元素通道，或先加入新手社群。請務必自行評估風險。</p><div class="reward-grid"><a class="element-button community" href="https://line.me/ti/g2/V4-2Rs1rlmq6T_80WfAbWpCADzLqmkMxjeGfdA?utm_source=invitation&utm_medium=link_copy&utm_campaign=default" target="_blank" rel="noopener noreferrer"><span>✦</span><b>風元素</b><small>加入新手社群</small></a><a class="element-button grass" href="https://www.ourbit.com/zh-TW/register?inviteCode=BULAII" target="_blank" rel="noopener noreferrer"><span>♣</span><b>草元素 · 凹幣</b><small>使用邀請碼 BULAII</small></a><a class="element-button water" href="https://partner.bitget.com/bg/fj3lmlyl" target="_blank" rel="noopener noreferrer"><span>≋</span><b>水元素 · Bitget</b><small>開啟註冊入口</small></a><a class="element-button fire" href="https://www.pionex.com/zh-TW/signUp?r=0FuKj85iHRG" target="_blank" rel="noopener noreferrer"><span>🔥</span><b>火元素 · 派網</b><small>開啟註冊入口</small></a></div><p class="reward-disclaimer">本遊戲內容僅為教育用途，不構成投資建議。合約交易具高風險，請自行評估。</p><button class="continue" data-close>回到晨光新手村</button></div>`);
}
function backpack() {
  const items = stages.map(stage => {
    const hasItem = state.completed.includes(stage.id);
    return `<article class="bag-item ${hasItem ? '' : 'locked'}"><span class="bag-icon">${hasItem ? stage.item.icon : '◆'}</span><b>${hasItem ? stage.item.name : '未解鎖收藏'}</b><small>${hasItem ? stage.item.desc : `完成第 ${stage.number} 關「${stage.place}」取得`}</small></article>`;
  }).join('');
  const stage = nextStage();
  show(`<div class="panel bag"><div class="bag-top"><div><p class="eyebrow">EMBER COLLECTION</p><h2>你的火焰背包</h2></div><p>${state.completed.length} / ${stages.length} 件收藏</p></div><div class="bag-grid">${items}</div><p class="bag-tip">${stage ? `下一個目標：<b>${stage.place}</b>。${stage.hint}` : '五件收藏已齊全。你已成為交易魔法師！'}</p><button class="continue" data-close>收起背包</button></div>`);
}
function menu() {
  const stage = nextStage();
  show(`<div class="panel center"><h2>元素試煉選單</h2><p><b>${esc(state.name || '見習生')}</b>　·　Lv.${state.level} ${rankNames[state.level]}</p><div class="menu-list"><button class="quiet" id="open-bag">🎒 開啟背包</button><button class="quiet" id="close-menu">← 回到關卡</button><button class="quiet" id="restart">↻ 重置冒險進度</button></div>${stage ? `<p class="disclaimer">下一關：${stage.place}</p>` : ''}</div>`);
  document.querySelector('#open-bag').onclick = backpack;
  document.querySelector('#close-menu').onclick = close;
  document.querySelector('#restart').onclick = () => { if (confirm('確定要清除所有村莊進度嗎？')) { localStorage.removeItem(saveKey); localStorage.removeItem(legacySaveKey); location.reload(); } };
}

function rect(x,y,w,h,color) { ctx.fillStyle = color; ctx.fillRect(x,y,w,h); }
function circle(x,y,r,color) { ctx.fillStyle = color; ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill(); }
function label(text,x,y,back='#fff9e9') {
  ctx.save(); ctx.setTransform(1,0,0,1,0,0);
  const px = (x - cameraX) * .5, py = y * .5;
  ctx.font='800 11px "Noto Sans TC", sans-serif';
  const width = Math.ceil(ctx.measureText(text).width) + 14;
  ctx.fillStyle='#351823';ctx.fillRect(Math.round(px-width/2)-2,Math.round(py-13),width+4,19);
  ctx.fillStyle=back;ctx.fillRect(Math.round(px-width/2),Math.round(py-11),width,15);
  ctx.fillStyle='#351823';ctx.textAlign='center';ctx.fillText(text,px,py);ctx.textAlign='left';ctx.restore();
}
function tree(x,y,size=1) { ctx.fillStyle='#42212a';ctx.fillRect(x-5*size,y,10*size,22*size); circle(x,y-5*size,20*size,'#6f2b2f');circle(x-13*size,y+2*size,14*size,'#96352e');circle(x+14*size,y+3*size,14*size,'#d34a2c');circle(x+2*size,y-18*size,15*size,'#f07831');circle(x+1*size,y-21*size,8*size,'#ffcb50'); }
function npc(npc) {
  const npcStage = stageForNpc(npc);
  const active = nextStage()?.npc === npc.id && (!npcStage || state.demonsMet.includes(npcStage.id));
  if (npc.kind === 'turtle') {
    circle(npc.x,npc.y+17,38,'rgba(24,35,34,.38)');
    if (turtleArt.complete && turtleArt.naturalWidth) ctx.drawImage(turtleArt,npc.x-64,npc.y-150,128,128);
    else rect(npc.x-16,npc.y-30,32,52,'#5b7a43');
  } else {
    const art = mentorArt[npc.element];
    circle(npc.x,npc.y+17,28,'rgba(24,35,34,.38)');
    if (art.complete && art.naturalWidth) ctx.drawImage(art,npc.x-96,npc.y-240,192,288);
    else rect(npc.x-16,npc.y-30,32,52,'#d8b258');
  }
  const labelY = npc.element ? npc.y-244 : npc.y-42;
  if (active) label('！',npc.x,labelY-26,'#ffcf52');
  if (Math.hypot(player.x-npc.x,player.y-npc.y)<108 && !locked) label('靠近自動交談',npc.x,npc.y+50,'#ffc44f'); else label(npc.name,npc.x,npc.y+50,'#fff0c9');
}
function building(x,y,w,h,wall,roof,name) { rect(x,y,w,h,wall);ctx.fillStyle=roof;ctx.beginPath();ctx.moveTo(x-16,y);ctx.lineTo(x+w/2,y-54);ctx.lineTo(x+w+16,y);ctx.fill();label(name,x+w/2,Math.max(36,y-70),'#ffc44f'); }
function drawDemon(demon, index) {
  const active = nextStage()?.id === demon.stage;
  const bob = Math.round(Math.sin(animationTime / 420 + index * 1.3) * 5);
  const art = demonFrames[demon.id][0];
  circle(demon.x, demon.y + 22 + bob, 50, 'rgba(13,7,14,.55)');
  if (art.complete && art.naturalWidth) ctx.drawImage(art, demon.x-96, demon.y-154+bob, 192, 192);
  else rect(demon.x-15,demon.y-25+bob,30,38,demon.color);
  if (active) label('！',demon.x,demon.y-160+bob,'#ffcf52');
  if (Math.hypot(player.x-demon.x,player.y-demon.y)<122 && !locked) label('靠近自動面對',demon.x,demon.y+78+bob,'#ffc44f'); else label(demon.name,demon.x,demon.y+78+bob,'#fff0c9');
}
function drawVillageAmbient() {
  const drift = Math.floor(animationTime / 55);
  for (let i=0;i<26;i++) {
    const x = (i * 137 + 41) % W;
    const y = H - ((i * 83 + drift * (i % 3 + 1)) % H);
    const size = i % 5 === 0 ? 5 : 3;
    rect(x,y,size,size,i%3===0 ? '#dff1a6' : '#9bd9d0');
  }
}
function block(x,y,w,h,fill,outline='#17272b') { rect(x-6,y-6,w+12,h+12,outline);rect(x,y,w,h,fill); }
function drawSideScene(stage, scene) {
  rect(0,0,WORLD_W,H,scene.sky);rect(0,325,WORLD_W,195,scene.far);
  for (let i=0;i<14;i++) block(i*126-20,370-(i%3)*18,96,128,stage.id==='smc' ? '#356878' : '#4a5d55');
  rect(0,520,WORLD_W,160,'#17272b');rect(0,532,WORLD_W,148,scene.ground);for(let x=0;x<WORLD_W;x+=70)rect(x,540,38,8,scene.accent);
  if(stage.id==='risk'){
    block(64,205,190,210,'#5f6870');block(92,165,42,48,'#5f6870');block(188,152,42,61,'#5f6870');block(138,338,60,77,'#bea865');
    for(let x=365;x<1450;x+=178){block(x,250-(x%3)*18,90,166,'#59636b');rect(x+16,238-(x%3)*18,12,32,'#8a9a9a');rect(x+55,238-(x%3)*18,12,32,'#8a9a9a');rect(x+38,303,15,34,'#d6b560');}
    rect(220,145,10,76,'#283d46');rect(230,148,45,24,'#d35b3d');
  }
  else if(stage.id==='mindset'){
    for(let x=48;x<290;x+=62){circle(x,395,50,'#a6b65c');rect(x-10,410,20,96,'#425a43');}block(90,340,130,55,'#c7b56e');
    for(let x=330;x<1450;x+=118){circle(x,474,20,'#8ab067');rect(x-3,455,6,34,'#5f784d');rect(x-18,480,36,5,'#bdcf80');}
    rect(0,356,WORLD_W,20,'rgba(227,240,188,.15)');rect(130,430,54,9,'#d7d88b');rect(900,406,70,9,'#d7d88b');
  }
  else if(stage.id==='smc'){
    rect(0,410,WORLD_W,110,'#2f8293');for(let x=0;x<WORLD_W;x+=88)block(x,485,68,20,'#c39a5d');block(108,228,205,55,'#c39a5d');
    for(let x=40;x<WORLD_W;x+=94){rect(x,432,44,5,'#9ad9d7');rect(x+13,455,61,5,'#76bdc5');}
    rect(312,218,9,188,'#543e32');ctx.fillStyle='#e5d4a0';ctx.beginPath();ctx.moveTo(322,234);ctx.lineTo(401,281);ctx.lineTo(322,326);ctx.fill();
    rect(990,265,8,146,'#543e32');ctx.fillStyle='#d9c98f';ctx.beginPath();ctx.moveTo(998,276);ctx.lineTo(1054,308);ctx.lineTo(998,340);ctx.fill();
  }
  else if(stage.id==='patterns'){
    for(let x=34;x<360;x+=74){rect(x-9,305,18,180,'#1b302d');circle(x,288,60,'#214d41');circle(x+35,320,47,'#315b45');}block(74,455,210,28,'#688a55');
    for(let x=380;x<1450;x+=104){rect(x-7,315,14,188,'#203b32');circle(x,278,49,'#285645');circle(x+29,305,35,'#3d7554');rect(x-22,473,18,10,'#b5cb6d');rect(x+14,462,12,17,'#f2b858');}
    for(let x=420;x<1450;x+=176){rect(x,168+(x%4)*12,6,6,'#dcefab');rect(x+12,183+(x%3)*8,4,4,'#badc87');}
  }
  else {
    block(76,188,190,250,'#48415d');block(128,125,68,70,'#48415d');block(360,386,120,95,'#514a67');
    for(let x=540;x<1450;x+=145){block(x,245-(x%4)*17,82,183,'#48415d');rect(x+23,292,34,58,'#776398');rect(x+33,302,14,38,'#c4a6df');}
    for(let x=270;x<1450;x+=215){rect(x,455,11,45,'#534a70');rect(x-9,445,30,14,'#8d76ac');rect(x-3,435,18,12,'#d1a5e5');}
  }
  block(318,480,24,40,scene.accent);block(700,480,24,40,scene.accent);
  if (startScreen.classList.contains('hidden')) label(`第 ${stage.number} 關 · ${scene.name}`,cameraX+W/2,132,'#fff4ce');
  label('起點',112,500,'#fff4ce');label('心魔',scene.demon.x,392,'#ffe0a3');label('導師',scene.mentor.x,365,'#e7f2cf');
}
function drawWorld() {
  const stage=nextStage()||stages[stages.length-1];const scene=sideScenes[stage.id];const mentor=npcs[stage.npc];const demon=innerDemons.find(item=>item.stage===stage.id);
  mentor.x=scene.mentor.x;mentor.y=scene.mentor.y;demon.x=scene.demon.x;demon.y=scene.demon.y;
  drawSideScene(stage,scene);drawDemon(demon,stage.number);npc(mentor);
  drawPlayer();
}
function drawPlayer() {
  const frame = player.moving ? Math.floor(player.walkClock / 115) % heroRunFrames.length : 0;
  const bob = player.moving ? [0, 4, 1, 5][frame] : 0;
  circle(player.x, player.y + 18 + bob, 36, 'rgba(13,7,14,.45)');
  if (state.level) {
    const flicker = Math.floor(animationTime / 130) % 2;
    rect(player.x-34,player.y-51+bob,8,25,'#d94b2d');rect(player.x+26,player.y-47+bob,8,25,'#f07c32');
    rect(player.x-12,player.y-71+bob,6,7,'#ffcf52');rect(player.x-3,player.y-76+bob,6,12,'#ff8c35');rect(player.x+6,player.y-71+bob,6,7,'#ffcf52');
    if (flicker) { rect(player.x-43,player.y-35+bob,5,9,'#ffbd42');rect(player.x+38,player.y-42+bob,5,9,'#ffbd42'); }
  }
  if (player.moving) {
    const trailX = player.x - playerFacing * (42 + (frame % 2) * 8);
    rect(trailX, player.y + 15, 12, 6, '#897652');
    rect(trailX - playerFacing * 14, player.y + 23, 8, 5, '#645c50');
    if (frame === 1 || frame === 3) rect(trailX - playerFacing * 27, player.y + 28, 5, 4, '#b79a64');
  }
  const art = player.moving ? heroRunFrames[frame] : sideHero;
  if (art.complete && art.naturalWidth) {
    ctx.save();
    ctx.translate(player.x, player.y - 75 + bob);
    ctx.scale(playerFacing, 1);
    const size = player.moving ? 184 : 160;
    ctx.drawImage(art, -size / 2, -size / 2, size, size);
    ctx.restore();
  }
  else { rect(player.x-15,player.y-22+bob,30,42,'#b83c2b'); circle(player.x,player.y-29+bob,18,'#ffc05b'); }
  label(`${state.name || '小魔法師'}・Lv.${state.level}`, player.x, player.y + 62 + bob, '#fff4ce');
  if (animationTime < levelBurstUntil) {
    const progress = 1 - (levelBurstUntil - animationTime) / 3200;
    for (let i=0;i<12;i++) { const angle=i*Math.PI/6; const distance=18+progress*96; const x=Math.round(player.x+Math.cos(angle)*distance); const y=Math.round(player.y-30+Math.sin(angle)*distance); rect(x,y,7,7,i%2?'#ffcf52':'#f2532d'); }
  }
}
function visibleWorldWidth() {
  const portraitMobile = window.matchMedia('(max-width: 760px) and (orientation: portrait)').matches;
  if (!portraitMobile || !canvas.clientWidth || !canvas.clientHeight) return W;
  // Portrait uses object-fit: cover. Convert the visible canvas slice back into world units.
  const imageScale = canvas.clientHeight / canvas.height;
  return Math.max(360, Math.min(W, (canvas.clientWidth / imageScale) * 2));
}
function loop(time) {
  const dt = Math.min(32,time-last||16); last=time; animationTime=time; player.moving=false;
  if (!locked) {
    const dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
    if(dx) { const speed=.26*dt;player.x=Math.max(70,Math.min(WORLD_W-70,player.x+dx*speed));player.y=510;playerFacing=dx>0?1:-1;player.walkClock+=dt;player.moving=true;if(time-lastStepSound>190){playStep();lastStepSound=time;} }
    autoInteract();
  }
  updateGuidance();
  const viewWidth = visibleWorldWidth();
  cameraX=Math.max(0,Math.min(WORLD_W-viewWidth,player.x-viewWidth/2));
  ctx.setTransform(.5,0,0,.5,0,0);ctx.translate(-cameraX,0);drawWorld();ctx.setTransform(1,0,0,1,0,0);
  requestAnimationFrame(loop);
}

document.addEventListener('keydown', event => {
  const key=event.key.toLowerCase();
  if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','e',' '].includes(key)) enableAudio();
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key)) event.preventDefault();
  if(key==='escape'){ if(!startScreen.classList.contains('hidden')) return; dialogOpen?close():menu(); return; }
  if(key==='b' && startScreen.classList.contains('hidden') && !dialogOpen) { backpack(); return; }
  if(key==='e'||key===' ') interact();
  keys.add(key);
});
document.addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));
document.querySelector('#menu-button').onclick = () => !startScreen.classList.contains('hidden') ? null : (dialogOpen ? close() : menu());
document.querySelector('#bag-button').onclick = () => !startScreen.classList.contains('hidden') && !dialogOpen ? backpack() : null;
soundButton.onclick = () => { state.soundOn = !state.soundOn; if (state.soundOn) { enableAudio(); playUi(); } persist(); updateHUD(); };
document.querySelectorAll('[data-key]').forEach(button => {
  const key=button.dataset.key;
  const down=event=>{event.preventDefault();button.setPointerCapture?.(event.pointerId);enableAudio();keys.add(key);};
  const up=event=>{event.preventDefault();keys.delete(key);};
  button.addEventListener('pointerdown',down);button.addEventListener('pointerup',up);button.addEventListener('pointerleave',up);button.addEventListener('pointercancel',up);
});
document.querySelector('#touch-interact').addEventListener('pointerdown', event => { event.preventDefault();enableAudio();interact(); });
document.querySelector('#touch-fullscreen').addEventListener('pointerdown', async event => {
  event.preventDefault();
  enableAudio();
  try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); } catch { /* iOS may ignore fullscreen requests */ }
  try { await screen.orientation?.lock?.('landscape'); } catch { /* orientation lock is optional */ }
});
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) screen.orientation?.unlock?.(); });
document.querySelector('#start-button').onclick = () => { enableAudio(); state.name=nameInput.value.trim()||'小魔法師';persist();updateHUD();enterStage();startScreen.classList.add('hidden');locked=false;if(!state.intro) intro(); };
nameInput.value=state.name;updateHUD();requestAnimationFrame(loop);
