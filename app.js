const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const overlay = document.querySelector('#overlay');
const startScreen = document.querySelector('#start-screen');
const nameInput = document.querySelector('#name-input');
const rank = document.querySelector('#rank');
const playerName = document.querySelector('#player-name');
const progressFill = document.querySelector('#progress-fill');
const edgeHint = document.querySelector('#edge-hint');
const W = 1100, H = 680;
const walkFrames = Array.from({ length: 4 }, (_, index) => {
  const image = new Image();
  image.src = `assets/fire-wizard-walk-${index}.png`;
  return image;
});
ctx.imageSmoothingEnabled = false;

const npcs = {
  turtle: { id: 'turtle', x: 700, y: 320, name: '村長老龜', icon: '🐢', kind: 'turtle' },
  smith: { id: 'smith', x: 250, y: 365, name: '鐵匠阿倉', icon: '🔨', kind: 'smith' },
  shrine: { id: 'shrine', x: 875, y: 485, name: '巫女小心', icon: '🔮', kind: 'shrine' },
  captain: { id: 'captain', x: 900, y: 185, name: '船長聰明錢', icon: '🔭', kind: 'captain' },
  artist: { id: 'artist', x: 240, y: 150, name: '畫家型態', icon: '🎨', kind: 'artist' },
  wizard: { id: 'wizard', x: 530, y: 170, name: '大魔法師', icon: '🧙', kind: 'wizard' },
};

const stages = [
  {
    id: 'risk', number: 1, npc: 'smith', place: '灼焰工坊', title: '合約倉位管理', rank: '灼焰風控學徒',
    item: { icon: '🔨', name: '風控之鎚', desc: '進場前先算風險的鍛造之鎚。' },
    intro: '真正的火術不是放大槓桿，而是在進場前先知道最多願意虧多少。',
    hint: '沿著熔岩小徑往東南，尋找心火神社。',
    questions: [
      { q:'本金 $1,000，單筆風險 1%，停損距離 5%。正確倉位是多少？', a:2, o:['$50','$100','$200','$1,000'], e:'可虧金額是 $10；$10 ÷ 5% = <b>$200</b>。' },
      { q:'進場 $100、停損 $95、目標 $115，這筆交易的 R:R 為？', a:1, o:['1:1','1:3','1:5','3:1'], e:'風險是 $5，潛在報酬是 $15，因此是 <b>1:3</b>。' },
      { q:'連續兩筆停損後，最健康的下一步是？', a:3, o:['加倍倉位凹回來','移遠停損','立刻追 K 線','回看計畫與日虧上限'], e:'停損是計畫的一部分；先回到規則，不讓情緒接管。' },
      { q:'帳戶 $2,000，風險 1%，停損 4%。倉位應為？', a:1, o:['$200','$500','$800','$2,000'], e:'可虧 $20；$20 ÷ 4% = <b>$500</b>。' },
      { q:'槓桿最正確的理解是？', a:0, o:['同時放大部位與虧損速度','幾乎不會輸','可忽略停損','保證提高勝率'], e:'槓桿不是免費力量，風控與停損不能省略。' },
    ],
  },
  {
    id: 'mindset', number: 2, npc: 'shrine', place: '心火神社', title: '交易心態建設', rank: '心穩修士',
    item: { icon: '🪬', name: '靜心御守', desc: '在波動中提醒你遵守紀律。' },
    intro: '火焰最怕失控。市場越吵，越要回到你的交易計畫。',
    hint: '穿過北方的熔岩橋，前往聰明錢碼頭。',
    questions: [
      { q:'BTC 半小時暴漲 8%，群組都喊上車，你沒有部位。你會？', a:2, o:['市價全倉追進','開更高槓桿','等回測與自己的進場條件','立刻向朋友借錢'], e:'避免 FOMO。沒有符合計畫的進場，觀望也是正確選擇。' },
      { q:'今日連續 3 筆虧損，已達日虧上限。最好的選擇是？', a:1, o:['加碼一筆凹回來','停止交易並檢討','轉去更高槓桿','移除停損'], e:'日虧上限存在的目的，就是在情緒失控前保護本金。' },
      { q:'被停損後 10 分鐘價格回到原方向，應如何理解？', a:0, o:['接受計畫結果，避免報復性追單','立刻追價報復','怪罪交易所','把下一次停損移更遠'], e:'一次停損不代表策略失敗；紀律比事後懊悔重要。' },
      { q:'勝率 40%、每次賺 3R、每次虧 1R，期望值偏向？', a:3, o:['一定虧損','完全靠運氣','不能計算','長期仍可能為正'], e:'0.4 × 3R − 0.6 × 1R = +0.6R，R:R 會改變期望值。' },
      { q:'下列何者最像「過度交易」？', a:2, o:['只做符合計畫的型態','每天記錄交易','每根 K 線都想下單','等待關鍵價位'], e:'市場不是每分鐘都有機會，等待也是交易技能。' },
    ],
  },
  {
    id: 'smc', number: 3, npc: 'captain', place: '聰明錢碼頭', title: 'SMC 基礎進出場', rank: '聰明錢追蹤者',
    item: { icon: '🔭', name: '大戶望遠鏡', desc: '用來觀察結構與流動性的魔法鏡。' },
    intro: '別只盯著一根 K 線。先讀市場結構，再尋找流動性被掃後的機會。',
    hint: '向西穿過餘燼林，找能看見圖形的畫家型態。',
    questions: [
      { q:'出現連續 HH 與 HL，通常代表什麼結構？', a:0, o:['上升趨勢','下降趨勢','橫盤必跌','無法判讀'], e:'Higher High 與 Higher Low 是基本上升結構。' },
      { q:'CHoCH 的核心意義是？', a:1, o:['增加槓桿','市場結構可能轉變','保證反轉','任何突破都叫 CHoCH'], e:'Change of Character 表示原本的結構被破壞，需重新評估方向。' },
      { q:'等高點上方常被稱為什麼區域？', a:2, o:['FVG','訂單簿','流動性／停損聚集區','固定停利區'], e:'等高點上方常有空單停損，容易成為流動性掃蕩目標。' },
      { q:'看多 Order Block 常指哪一根 K 線？', a:3, o:['最高的一根','任何十字線','第一根上漲 K','大幅上漲前最後一根下跌 K'], e:'常以大幅推動前的最後一根反向 K 線作為觀察區。' },
      { q:'較完整的 SMC 看多模型順序為？', a:1, o:['追突破→移除停損','掃流動性→CHoCH→回踩進場','先全倉→再找結構','只看 RSI'], e:'等待掃流動性與結構改變，再在回踩區尋找有風險定義的進場。' },
    ],
  },
  {
    id: 'patterns', number: 4, npc: 'artist', place: '餘燼圖表林', title: '常見技術型態', rank: '型態獵人',
    item: { icon: '🔎', name: '型態放大鏡', desc: '讓支撐、壓力與頸線無所遁形。' },
    intro: '型態不是預言，而是把價格行為、頸線與風險說清楚的語言。',
    hint: '往東北的魔法師之塔，接受最終綜合試煉。',
    questions: [
      { q:'頭肩頂型態最重要的確認訊號是？', a:1, o:['看到右肩就做空','跌破頸線','成交量最大','K 線變紅'], e:'型態需等待頸線被有效突破，不能只靠外觀預測。' },
      { q:'雙重頂（M 頭）通常需留意哪個位置？', a:2, o:['第二個頂必然更高','均線黃金交叉','兩頂之間低點的頸線','任何一根長紅'], e:'跌破兩頂之間低點，才是型態可能確認的關鍵。' },
      { q:'旗形在強趨勢中常被視為？', a:0, o:['可能的趨勢中繼','保證反轉','完全無用','固定做空訊號'], e:'旗形常出現在急漲或急跌後的短暫整理，仍需等待突破確認。' },
      { q:'上方壓力被突破並成功回踩，常見的角色互換是？', a:3, o:['支撐變壓力','停損變槓桿','成交量消失','壓力變支撐'], e:'被突破的壓力若守住回踩，可能轉為新的支撐。' },
      { q:'分辨楔形與三角收斂時，最該看的是？', a:1, o:['K 線顏色','兩條趨勢線的斜率與收斂方式','社群喊單','隨機指標'], e:'型態辨識的核心是高低點與趨勢線的結構，而不是單根 K 線。' },
    ],
  },
  {
    id: 'boss', number: 5, npc: 'wizard', place: '魔法師之塔', title: '最終綜合考核', rank: '交易魔法師',
    item: { icon: '🧙', name: '交易魔法師帽', desc: '完成五種火術試煉的證明。' },
    intro: '最後一關不考你猜對幾次，而是考你是否能把風控、心態、結構與型態放進同一個流程。',
    hint: '所有試煉已完成，回到熾火廣場展示你的收藏。',
    questions: [
      { q:'一筆交易開始前，最優先確認的是？', a:0, o:['停損位置與單筆風險','別人的獲利截圖','最高槓桿','最新喊單'], e:'先定義風險，才能反推適合的倉位大小。' },
      { q:'遇到流動性掃蕩後的理想做法是？', a:2, o:['立刻追單','移除停損','等待結構確認與回踩','永遠反向全倉'], e:'掃蕩本身不是進場指令，仍要等 CHoCH、回踩與明確停損。' },
      { q:'圖表出現疑似頭肩頂但未跌破頸線，應？', a:3, o:['直接做空','保證反轉','加倍槓桿','等待確認，或依計畫觀望'], e:'型態尚未確認前只是假設，不能取代交易計畫。' },
      { q:'浮虧時最容易傷害帳戶的情緒行為是？', a:1, o:['檢查原先假設','任意移遠停損','降低單筆風險','暫停觀察'], e:'移遠停損常讓原本定義好的小風險變成不可控虧損。' },
      { q:'真正的交易魔法師相信什麼？', a:1, o:['永遠預測正確','紀律與流程比預測重要','每筆都要賺','槓桿越高越強'], e:'可重複的流程、風險控制與紀律，才是長期生存的力量。' },
    ],
  },
];

const rankNames = ['火之見習生', '灼焰風控學徒', '心穩修士', '聰明錢追蹤者', '型態獵人', '交易魔法師'];
const saveKey = 'trading-wizard-village-v2';
const legacySaveKey = 'trading-wizard-village-v1';
let state = { name: '', level: 0, intro: false, completed: [] };
try { state = { ...state, ...JSON.parse(localStorage.getItem(saveKey) || localStorage.getItem(legacySaveKey)) }; } catch { /* empty save */ }
if (!Array.isArray(state.completed)) state.completed = [];
if (state.riskComplete && !state.completed.includes('risk')) state.completed.push('risk');
state.completed = stages.filter(stage => state.completed.includes(stage.id)).map(stage => stage.id);
state.level = state.completed.length;

let player = { x: 690, y: 490, r: 16, walkClock: 0, moving: false };
let keys = new Set(); let locked = true; let dialogOpen = false; let last = 0; let animationTime = 0; let levelBurstUntil = 0;

function persist() { localStorage.setItem(saveKey, JSON.stringify(state)); }
function nextStage() { return stages.find(stage => !state.completed.includes(stage.id)); }
function stageForNpc(npc) { return stages.find(stage => stage.npc === npc.id); }
function stageIsAvailable(stage) { return stages.indexOf(stage) === state.completed.length; }
function titleFor(stage) { return `第 ${stage.number} 關 · ${stage.place}`; }
function esc(str) { return str.replace(/[&<>"']/g, s => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#039;' }[s])); }
function updateHUD() {
  playerName.textContent = state.name || '見習生';
  rank.textContent = `Lv.${state.level} ${rankNames[state.level]}`;
  progressFill.style.width = `${8 + state.level * 18.4}%`;
  updateGuidance();
}
function updateGuidance() {
  const stage = nextStage();
  if (!state.intro || !stage) { edgeHint.classList.add('hidden'); return; }
  const target = npcs[stage.npc];
  const dx = target.x - player.x, dy = target.y - player.y;
  const arrow = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? '→' : '←') : (dy > 0 ? '↓' : '↑');
  edgeHint.textContent = `${arrow} 第 ${stage.number} 關：${stage.place} · ${stage.hint}`;
  edgeHint.classList.remove('hidden');
}
function show(html, className = '') {
  locked = true;
  dialogOpen = true;
  overlay.className = `overlay ${className}`;
  overlay.innerHTML = html;
  overlay.querySelectorAll('[data-close]').forEach(button => { button.onclick = close; });
}
function close() { overlay.className = 'overlay hidden'; overlay.innerHTML = ''; dialogOpen = false; locked = false; }
function speaker(npc, body, action = '繼續') { return `<div class="panel"><div class="speaker"><div class="portrait">${npc.icon}</div><div><small>熾焰村居民</small><strong>${npc.name}</strong></div></div><p>${body}</p><button class="continue" data-close>${action} →</button></div>`; }

function intro() {
  show(speaker(npcs.turtle, `歡迎，<b>${esc(state.name || '見習生')}</b>！熾焰村曾經被失控的槓桿之火吞沒。完成五位導師的試煉，才能守護大家的錢包。`, '我準備好了'));
  overlay.querySelector('[data-close]').onclick = () => { state.intro = true; persist(); updateHUD(); close(); tutorial(); };
}
function tutorial() {
  show(`<div class="panel center"><div class="portrait" style="margin:auto">📜</div><h2>小小冒險守則</h2><div class="fact"><b>探索</b><br>用 <b>WASD／方向鍵</b> 移動，靠近導師時按 <b>E</b> 互動。</div><div class="fact"><b>收藏</b><br>每關通過都會得到道具。按 <b>B</b> 或點 🎒 可查看背包。</div><div class="fact"><b>第一個任務</b><br>往左側的「灼焰工坊」找鐵匠阿倉，先把風險打進倉位。</div><button class="continue" data-close>出發吧 →</button></div>`);
}
function interact() {
  if (locked) return;
  const near = Object.values(npcs).find(npc => Math.hypot(player.x-npc.x, player.y-npc.y) < 74);
  if (!near) return;
  if (near.id === 'turtle') {
    if (!state.intro) intro();
    else {
      const stage = nextStage();
      show(speaker(near, stage ? `下一道火術在「<b>${stage.place}</b>」。${stage.hint}` : '你已完成五種火術！到背包看看所有收藏吧。'));
    }
    return;
  }
  const stage = stageForNpc(near);
  if (state.completed.includes(stage.id)) {
    show(speaker(near, `「${stage.item.name}」已收進你的背包。下一步請依畫面上的火焰指引前進。`));
  } else if (!stageIsAvailable(stage)) {
    const needed = stages[stages.indexOf(stage) - 1];
    show(speaker(near, `這裡仍被火焰封印。先完成「<b>${needed.place}</b>」的試煉吧。`));
  } else {
    stageLesson(stage);
  }
}
function stageLesson(stage) {
  const npc = npcs[stage.npc];
  show(`<div class="panel"><div class="speaker"><div class="portrait">${npc.icon}</div><div><small>${titleFor(stage)}</small><strong>${npc.name}</strong></div></div><h2>${stage.title}</h2><p>${stage.intro}</p><div class="fact"><b>通關規則</b><br>回答 5 題，答對至少 4 題即可取得「${stage.item.name}」。</div><button class="continue" id="start-quiz">接受試煉 →</button></div>`);
  document.querySelector('#start-quiz').onclick = () => quiz(stage, 0, 0, []);
}
function quiz(stage, index, score, history) {
  const question = stage.questions[index];
  show(`<div class="panel"><div class="quiz-top"><span>${titleFor(stage)} 試煉</span><span>答對 ${score} / ${index}</span></div><h3>第 ${index + 1} 題／${stage.questions.length}</h3><p>${question.q}</p><div class="forge">${question.o.map((option, answer) => `<button data-answer="${answer}">${option}</button>`).join('')}</div><div class="explain" id="explain">選擇你的答案，讓火焰為你的計畫定型。</div></div>`);
  overlay.querySelectorAll('[data-answer]').forEach(button => button.onclick = () => {
    const choice = +button.dataset.answer;
    const correct = choice === question.a;
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
  overlay.querySelector('[data-close]').onclick = () => { levelBurstUntil = performance.now() + 3200; close(); };
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
  show(`<div class="panel center"><h2>熾焰村選單</h2><p><b>${esc(state.name || '見習生')}</b>　·　Lv.${state.level} ${rankNames[state.level]}</p><div class="menu-list"><button class="quiet" id="open-bag">🎒 開啟背包</button><button class="quiet" id="close-menu">← 回到村莊</button><button class="quiet" id="restart">↻ 重置冒險進度</button></div>${stage ? `<p class="disclaimer">下一關：${stage.place}</p>` : ''}</div>`);
  document.querySelector('#open-bag').onclick = backpack;
  document.querySelector('#close-menu').onclick = close;
  document.querySelector('#restart').onclick = () => { if (confirm('確定要清除所有村莊進度嗎？')) { localStorage.removeItem(saveKey); localStorage.removeItem(legacySaveKey); location.reload(); } };
}

function rect(x,y,w,h,color) { ctx.fillStyle = color; ctx.fillRect(x,y,w,h); }
function circle(x,y,r,color) { ctx.fillStyle = color; ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill(); }
function label(text,x,y,back='#fff9e9') {
  ctx.save(); ctx.setTransform(1,0,0,1,0,0);
  const px = x * .5, py = y * .5;
  ctx.font='800 11px "Noto Sans TC", sans-serif';
  const width = Math.ceil(ctx.measureText(text).width) + 14;
  ctx.fillStyle='#351823';ctx.fillRect(Math.round(px-width/2)-2,Math.round(py-13),width+4,19);
  ctx.fillStyle=back;ctx.fillRect(Math.round(px-width/2),Math.round(py-11),width,15);
  ctx.fillStyle='#351823';ctx.textAlign='center';ctx.fillText(text,px,py);ctx.textAlign='left';ctx.restore();
}
function tree(x,y,size=1) { ctx.fillStyle='#42212a';ctx.fillRect(x-5*size,y,10*size,22*size); circle(x,y-5*size,20*size,'#6f2b2f');circle(x-13*size,y+2*size,14*size,'#96352e');circle(x+14*size,y+3*size,14*size,'#d34a2c');circle(x+2*size,y-18*size,15*size,'#f07831');circle(x+1*size,y-21*size,8*size,'#ffcb50'); }
function npc(npc) {
  const active = nextStage()?.npc === npc.id;
  const palette = { turtle:['#476a3b','#97a94d'], smith:['#8a342d','#f0ac70'], shrine:['#7d3b88','#e8b4d8'], captain:['#345d83','#edba70'], artist:['#487456','#f5b878'], wizard:['#452f68','#f0c489'] }[npc.kind];
  rect(npc.x-14,npc.y+1,28,22,palette[0]);rect(npc.x-10,npc.y-16,20,20,palette[1]);
  rect(npc.x-6,npc.y-9,3,3,'#2b1723');rect(npc.x+4,npc.y-9,3,3,'#2b1723');
  if (npc.kind === 'turtle') { rect(npc.x-16,npc.y-8,7,10,'#718f42');rect(npc.x+9,npc.y-8,7,10,'#718f42'); }
  else { rect(npc.x-13,npc.y-20,26,8,'#41212a');rect(npc.x-14,npc.y+14,7,11,'#54262a');rect(npc.x+7,npc.y+14,7,11,'#54262a'); }
  if (active) label('！',npc.x,npc.y-67,'#ffcf52');
  if (Math.hypot(player.x-npc.x,player.y-npc.y)<74 && !locked) label('E 交談',npc.x,npc.y-42,'#ffc44f'); else label(npc.name,npc.x,npc.y-42,'#fff0c9');
}
function building(x,y,w,h,wall,roof,name) { rect(x,y,w,h,wall);ctx.fillStyle=roof;ctx.beginPath();ctx.moveTo(x-16,y);ctx.lineTo(x+w/2,y-54);ctx.lineTo(x+w+16,y);ctx.fill();label(name,x+w/2,Math.max(36,y-70),'#ffc44f'); }
function drawWorld() {
  rect(0,0,W,H,'#2a1827');
  for(let x=8;x<W;x+=24) for(let y=12;y<H;y+=24) { const seed=(x*17+y*13)%7; if(seed<3) rect(x,y,5,5,seed===0?'#563038':'#3a202d'); if(seed===6) rect(x+5,y+8,3,3,'#b83c2b'); }
  rect(472,0,92,H,'#8e2d2d'); for(let y=8;y<H;y+=28){rect(480,y,31,6,'#f05c2c');rect(524,y+14,22,5,'#ffbb43');}
  rect(458,407,120,50,'#35202a'); for(let x=465;x<576;x+=18)rect(x,410,6,44,'#6d3633');
  ctx.strokeStyle='#562b32';ctx.lineWidth=50;ctx.lineCap='square';ctx.beginPath();ctx.moveTo(100,510);ctx.lineTo(425,510);ctx.lineTo(515,432);ctx.lineTo(770,432);ctx.lineTo(920,285);ctx.stroke();ctx.beginPath();ctx.moveTo(692,432);ctx.lineTo(692,220);ctx.stroke();
  ctx.strokeStyle='#a54431';ctx.lineWidth=30;ctx.beginPath();ctx.moveTo(100,510);ctx.lineTo(425,510);ctx.lineTo(515,432);ctx.lineTo(770,432);ctx.lineTo(920,285);ctx.stroke();ctx.beginPath();ctx.moveTo(692,432);ctx.lineTo(692,220);ctx.stroke();
  building(110,230,210,137,'#8d392e','#2e1a28','灼焰工坊');rect(201,315,22,52,'#f45a2e');
  building(628,230,145,88,'#b85031','#321a29','熾火廣場');
  building(804,405,160,98,'#6d3b78','#321a45','心火神社');
  building(800,92,190,75,'#31556e','#1d283d','聰明錢碼頭');
  building(128,75,195,74,'#56613b','#2b3526','餘燼圖表林');
  building(470,88,118,98,'#49336b','#261a3d','魔法師之塔');
  [[54,100,1.2],[145,110,.8],[365,120,1.1],[413,273,.8],[1012,185,1.3],[1020,525,1.1],[870,600,1.1],[670,620,.9],[330,625,1.2],[80,600,1]].forEach(treeData=>tree(...treeData));
  circle(700,510,40,'#44232e');circle(700,510,29,'#b63b2d');circle(700,510,18,'#f27a2f');circle(700,510,8,'#ffdf68');
  Object.values(npcs).forEach(npc);
  drawPlayer();
}
function drawPlayer() {
  const frame = player.moving ? Math.floor(player.walkClock / 105) % walkFrames.length : 0;
  const bob = player.moving ? (frame % 2 ? 2 : 0) : 0;
  circle(player.x, player.y + 15 + bob, 25, 'rgba(13,7,14,.45)');
  if (state.level) {
    const flicker = Math.floor(animationTime / 130) % 2;
    rect(player.x-34,player.y-51+bob,8,25,'#d94b2d');rect(player.x+26,player.y-47+bob,8,25,'#f07c32');
    rect(player.x-12,player.y-71+bob,6,7,'#ffcf52');rect(player.x-3,player.y-76+bob,6,12,'#ff8c35');rect(player.x+6,player.y-71+bob,6,7,'#ffcf52');
    if (flicker) { rect(player.x-43,player.y-35+bob,5,9,'#ffbd42');rect(player.x+38,player.y-42+bob,5,9,'#ffbd42'); }
  }
  const art = walkFrames[frame];
  if (art.complete && art.naturalWidth) ctx.drawImage(art, player.x - 46, player.y - 78 + bob, 92, 92);
  else { rect(player.x-15,player.y-22+bob,30,42,'#b83c2b'); circle(player.x,player.y-29+bob,18,'#ffc05b'); }
  if (animationTime < levelBurstUntil) {
    const progress = 1 - (levelBurstUntil - animationTime) / 3200;
    for (let i=0;i<12;i++) { const angle=i*Math.PI/6; const distance=18+progress*96; const x=Math.round(player.x+Math.cos(angle)*distance); const y=Math.round(player.y-30+Math.sin(angle)*distance); rect(x,y,7,7,i%2?'#ffcf52':'#f2532d'); }
  }
}
function loop(time) {
  const dt = Math.min(32,time-last||16); last=time; animationTime=time; player.moving=false;
  if (!locked) {
    const dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
    const dy=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
    if(dx||dy) { const distance=Math.hypot(dx,dy); const speed=.19*dt; player.x=Math.max(35,Math.min(W-35,player.x+dx/distance*speed));player.y=Math.max(130,Math.min(H-30,player.y+dy/distance*speed));player.walkClock+=dt;player.moving=true; }
  }
  updateGuidance();
  ctx.setTransform(.5,0,0,.5,0,0); drawWorld(); ctx.setTransform(1,0,0,1,0,0);
  requestAnimationFrame(loop);
}

document.addEventListener('keydown', event => {
  const key=event.key.toLowerCase();
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key)) event.preventDefault();
  if(key==='escape'){ if(!startScreen.classList.contains('hidden')) return; dialogOpen?close():menu(); return; }
  if(key==='b' && startScreen.classList.contains('hidden') && !dialogOpen) { backpack(); return; }
  if(key==='e'||key===' ') interact();
  keys.add(key);
});
document.addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));
document.querySelector('#menu-button').onclick = () => !startScreen.classList.contains('hidden') ? null : (dialogOpen ? close() : menu());
document.querySelector('#bag-button').onclick = () => !startScreen.classList.contains('hidden') && !dialogOpen ? backpack() : null;
document.querySelector('#start-button').onclick = () => { state.name=nameInput.value.trim()||'小魔法師';persist();updateHUD();startScreen.classList.add('hidden');locked=false;if(!state.intro) intro(); };
nameInput.value=state.name;updateHUD();requestAnimationFrame(loop);
