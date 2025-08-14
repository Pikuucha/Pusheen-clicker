/*****************************************************************
 * Pusheen Clicker 0.6 - Small fixes per user request
 * - Different sound for upgrades
 * - Kiki now +6 BPS
 * - Lottery: 20% no-prize, rest prizes (weighted)
 * - Game-over banner image changed
 * - Mafia max arrival reduced by 5s
 *****************************************************************/

// --- Configuration ---
const PUSHEEN_IMG_URL = 'https://i.postimg.cc/MKMFBXTh/Chat-GPT-Image-12-sie-2025-14-21-36.png';
const WATER_IMG_URL = 'https://i.postimg.cc/DwvGF6vP/Chat-GPT-Image-Aug-12.png';
const MAFIA_BANNER_URL = 'https://i.postimg.cc/RF1WtJGT/chatgpt-homiki.png';
const GOLDEN_BEAN_IMG = 'https://i.postimg.cc/fLpnGgTL/Chat-GPT-Image-Aug-13-2025-03-12-55-PM.png';
const GAME_OVER_BANNER_URL = 'https://i.postimg.cc/RZLCJg8W/Chat-GPT-Image-Aug-13-2025-05-17-39-PM.png'; // updated per user

// --- Global pause flag ---
let isGamePaused = false;

// --- Player & progression state ---
let playerScore = 0;
let playerLevel = 1;
let playerXP = 0;
let mafiaHasArrived = false;
let goldenBeans = 0;

// track mafia arrivals for progression
let mafiaArrivalTotal = 0;
let mafiaArrivalsSinceLevelUp = 0;

// XP thresholds
const levelThresholds = [0,500,2000,7500,4000,10000,25000,60000,150000,400000];

// --- Game state ---
const state = {
  score: 0,
  basePPC: 1,
  moreLevel: 0,
  pillowLevel: 0,
  kikiLevel: 0,
  snackLevel: 0,
  floorLevel: 0,
  costs: { floor:10, kiki:130, more:220, pillow:700, snack:1200 },
  clickCostMultiplier: 1.25,
  autoCostMultiplier: 1.15,
  mafiaPaused: false,
  activeEvents: {},
  ultimateBuffActive: false,
  bpsBuffMultiplier: 1
};

// Hydration state
let waterLevel = 100;
const baseDepletionMs = 2000/6;
let waterDepletionMultiplier = 1;
let waterPauseTimeout = null;
let waterInvulTimeout = null;

// XP accumulators
let clickBeansSinceXP = 0;
let passiveBeansSinceXP = 0;

// Achievement & stats
let totalClicks = 0;
let totalBeansEarned = 0;
let mafiaSurvivedCount = 0;
let waterRefillCount = 0;
let goldenCaughtCount = 0;

const achievements = [ /* same as before - omitted for brevity in code snippet */
  { id:'click100', name:'Click Apprentice', desc:'Click Pusheen 100 times', type:'clicks', target:100, reward:1, completed:false, claimed:false },
  { id:'click500', name:'Click Enthusiast', desc:'Click Pusheen 500 times', type:'clicks', target:500, reward:1, completed:false, claimed:false },
  { id:'novice', name:'Novice Clicker', desc:'Click Pusheen 1,000 times', type:'clicks', target:1000, reward:1, completed:false, claimed:false },
  { id:'click5k', name:'Click Veteran', desc:'Click Pusheen 5,000 times', type:'clicks', target:5000, reward:2, completed:false, claimed:false },
  { id:'click10k', name:'Click Master', desc:'Click Pusheen 10,000 times', type:'clicks', target:10000, reward:3, completed:false, claimed:false },
  { id:'adept', name:'Adept Clicker', desc:'Click Pusheen 25,000 times', type:'clicks', target:25000, reward:2, completed:false, claimed:false },
  { id:'collector', name:'Bean Collector', desc:'Earn 50,000 total Jelly Beans', type:'beans', target:50000, reward:1, completed:false, claimed:false },
  { id:'baron', name:'Bean Baron', desc:'Earn 1,000,000 total Jelly Beans', type:'beans', target:1000000, reward:3, completed:false, claimed:false },
  { id:'first', name:'First Deal', desc:'Survive your first Mafia visit', type:'mafia', target:1, reward:1, completed:false, claimed:false },
  { id:'regular', name:'Regular Customer', desc:'Survive 10 Mafia visits', type:'mafia', target:10, reward:2, completed:false, claimed:false },
  { id:'hydration', name:'Hydration Expert', desc:'Refill the water bowl 10 times', type:'refill', target:10, reward:1, completed:false, claimed:false },
  { id:'lvl5', name:'Level Up!', desc:'Reach Level 5', type:'level', target:5, reward:1, completed:false, claimed:false },
  { id:'maxlvl', name:'Max Level', desc:'Reach Level 10', type:'level', target:10, reward:3, completed:false, claimed:false },
  { id:'funny', name:'Funny Number', desc:'Reach exactly 69 Beans per Click', type:'ppc', target:69, reward:2, completed:false, claimed:false },
  { id:'goldtouch', name:'Golden Touch', desc:'Catch 10 random on-screen Golden Beans', type:'gold', target:10, reward:2, completed:false, claimed:false }
];

// --- DOM cache ---
const scoreEl = document.getElementById('score');
const ppcEl = document.getElementById('ppc');
const ppsEl = document.getElementById('pps');
const pusheenTarget = document.getElementById('pusheenTarget');
const pusheenImg = document.getElementById('pusheenImg');
const pusheenFallback = document.getElementById('pusheenFallback');

const buyFloorBtn = document.getElementById('buyFloor');
const buyMoreBtn = document.getElementById('buyMore');
const buyPillowBtn = document.getElementById('buyPillow');
const buyKikiBtn = document.getElementById('buyKiki');
const buySnackBtn = document.getElementById('buySnack');

const eventBanners = document.getElementById('eventBanners');
const zzzEl = document.getElementById('zzz');
const levelDisplay = document.getElementById('levelDisplay');
const scoreboardEl = document.getElementById('playerScore');
const finalScoreEl = document.getElementById('finalScore');
const goldenCounterEl = document.getElementById('goldenBeans');

// Mafia elements
const mafiaWarningEl = document.getElementById('mafiaWarning');
const mafiaCountdownEl = document.getElementById('mafiaCountdown');
const mafiaOverlay = document.getElementById('mafiaOverlay');
const bribeAmountEl = document.getElementById('bribeAmount');
const payBribeBtn = document.getElementById('payBribeBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const mafiaGameOver = document.getElementById('mafiaGameOver');
const mafiaBannerImg = document.getElementById('mafiaBannerImg');

// Achievements elements
const achvBtn = document.getElementById('achvBtn');
const achvOverlay = document.getElementById('achvOverlay');
const achvList = document.getElementById('achvList');
const exchangeOneBtn = document.getElementById('exchangeOne');
const exchangeAllBtn = document.getElementById('exchangeAll');
const closeAchvBtn = document.getElementById('closeAchv');

// Lottery elements
const slotLeft = document.getElementById('slotLeft');
const slotMid = document.getElementById('slotMid');
const slotRight = document.getElementById('slotRight');
const spinBtn = document.getElementById('spinBtn');

// Heat overlay
const heatOverlay = document.getElementById('heatOverlay');

// Game over overlay
const gameOverOverlay = document.getElementById('gameOverOverlay');
const gameOverPlayBtn = document.getElementById('gameOverPlayBtn');
const gameOverBannerImg = document.getElementById('gameOverBannerImg');

// Hydration UI
const hydrationUI = document.getElementById('hydrationUI');
const waterBowl = document.getElementById('waterBowl');
const waterBar = document.getElementById('waterBar');
const waterFill = document.getElementById('waterFill');

/*********************
 * Pausable utilities
 *********************/
class PausableTimer {
  constructor(){ this.id = null; this.callback = null; this.remaining = 0; this.startTime = 0; }
  start(delay, cb){ this.clear(); this.callback = cb; this.remaining = delay; this.startTime = Date.now(); this.id = setTimeout(()=>{ this.id = null; this.callback && this.callback(); }, this.remaining); }
  pause(){ if(this.id){ clearTimeout(this.id); this.id = null; this.remaining -= (Date.now() - this.startTime); if(this.remaining < 0) this.remaining = 0; } }
  resume(){ if(this.id || !this.callback) return; this.startTime = Date.now(); this.id = setTimeout(()=>{ this.id = null; this.callback && this.callback(); }, this.remaining); }
  clear(){ if(this.id){ clearTimeout(this.id); this.id = null; } this.callback = null; this.remaining = 0; this.startTime = 0; }
  isActive(){ return this.id !== null; }
}

class PausableRepeater {
  // schedules repeated ticks using PausableTimer between ticks; preserves remaining to next tick when paused
  constructor(tickMs, tickCb){ this.tickMs = tickMs; this.tickCb = tickCb; this.timer = new PausableTimer(); this.running = false; }
  _scheduleNext(ms){ this.timer.start(ms, ()=>{ if(this.running){ try{ this.tickCb(); }catch(e){} this._scheduleNext(this.tickMs); } }); }
  start(){ if(this.running) return; this.running = true; this._scheduleNext(this.tickMs); }
  pause(){ if(!this.running) return; this.timer.pause(); }
  resume(){ if(!this.running) return; this.timer.resume(); }
  stop(){ this.running = false; this.timer.clear(); }
}

/*********************
 * Helpers
 *********************/
function randomInt(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }
function weightedRandom(items){ // items: [{weight, value},...]
  const sum = items.reduce((s,i)=>s+i.weight,0); let r = Math.random()*sum; for(const it of items){ if(r < it.weight) return it.value; r -= it.weight; } return items[items.length-1].value; }
// scaledCost now accepts an optional key to special-case certain upgrades (e.g. snack)
function scaledCost(base, level, isClickUpgrade, key){ let mult = isClickUpgrade ? state.clickCostMultiplier : state.autoCostMultiplier; if(key === 'snack') mult = 1.35; return Math.ceil(base * Math.pow(mult, level)); }

// compute ppc/pps from upgraded levels and buffs
function currentPPC(){ return state.basePPC + (state.moreLevel * 1) + (state.pillowLevel * 5); }
function currentPPS(){ const base = (state.floorLevel * 1) + (state.kikiLevel * 6) + (state.snackLevel * 100); return Math.floor(base * state.bpsBuffMultiplier); } // Kiki is +6 now

function updateScoreboard(){ scoreboardEl.textContent = playerScore; goldenCounterEl.textContent = goldenBeans; }

// centralized way to add Jelly Beans so we can track totals for achievements
function addJellyBeans(amount){ if(amount <= 0) return; state.score += amount; totalBeansEarned += amount; updateDisplay(); }

// --- New helpers that were missing and caused runtime errors ---
function isUnlocked(upgradeId){ const el = document.getElementById(upgradeId); if(!el) return false; const required = parseInt(el.getAttribute('data-unlock')||'1',10); if(required <= 1) return true; return (playerLevel >= required) && mafiaHasArrived; }

function addXP(amount){ if(amount <= 0) return; playerXP += amount; if(!mafiaHasArrived) { updateDisplay(); return; } checkLevelUp(); updateDisplay(); }

function grantLevelUp() {
  if (playerLevel >= 10) return;
  playerLevel += 1;
  // ZMIANA: Bonus za awans został zmniejszony o 50%
  const bonus = playerLevel * 250;
  state.score += bonus;
  totalBeansEarned += bonus;
  playLevelUpSound();
  mafiaArrivalsSinceLevelUp = 0;
  renderAchievementsList();
  updateDisplay();
}
function checkLevelUp(){ let leveled = false; while(playerLevel < 10 && playerXP >= levelThresholds[playerLevel]){ playerLevel += 1; leveled = true; const bonus = playerLevel * 500; state.score += bonus; totalBeansEarned += bonus; playLevelUpSound(); } if(leveled) renderAchievementsList(); updateDisplay(); }

function tryLevelUpByMafia() {
  mafiaArrivalTotal += 1;
  mafiaArrivalsSinceLevelUp += 1;

  let shouldLevelUp = false;

  if (playerLevel < 4) {
    shouldLevelUp = true;
  } else if (playerLevel === 4) {
    if (mafiaArrivalsSinceLevelUp >= 2 || playerXP >= levelThresholds[playerLevel]) {
      shouldLevelUp = true;
    }
  } else if (playerLevel >= 5) {
    if (mafiaArrivalsSinceLevelUp >= 3 || playerXP >= levelThresholds[playerLevel]) {
      shouldLevelUp = true;
    }
  }

  // ZMIANA: Dodano opóźnienie i baner informacyjny
  if (shouldLevelUp) {
    // Pokaż graczowi informację, że zaraz awansuje
    showTempBanner(`LEVEL UP IMMINENT! Preparing bonus...`);
    
    const delay = randomInt(2000, 10000); // Losowe opóźnienie od 2 do 10 sekund
    
    setTimeout(() => {
      grantLevelUp();
      showTempBanner(`Congratulations! You are now LVL: ${playerLevel}!`);
    }, delay);
  }
}
function randomizeAccentColor(){ const h = randomInt(0,360); document.documentElement.style.setProperty('--accent', `hsl(${h}deg 80% 55%)`); }

function checkAchievements(){ achievements.forEach(a => { if(a.claimed) return; let progress = 0; if(a.type === 'clicks') progress = totalClicks; if(a.type === 'beans') progress = totalBeansEarned; if(a.type === 'mafia') progress = mafiaSurvivedCount; if(a.type === 'refill') progress = waterRefillCount; if(a.type === 'level') progress = playerLevel; if(a.type === 'ppc') progress = currentPPC(); if(a.type === 'gold') progress = goldenCaughtCount; if(progress >= a.target){ a.completed = true; } }); renderAchievementsList(); updateScoreboard(); }

function renderAchievementsList(){ achvList.innerHTML = ''; achievements.forEach(a => { const div = document.createElement('div'); div.className = 'achv-item'; let progress = 0; if(a.type === 'clicks') progress = totalClicks; if(a.type === 'beans') progress = totalBeansEarned; if(a.type === 'mafia') progress = mafiaSurvivedCount; if(a.type === 'refill') progress = waterRefillCount; if(a.type === 'level') progress = playerLevel; if(a.type === 'ppc') progress = currentPPC(); if(a.type === 'gold') progress = goldenCaughtCount; const left = document.createElement('div'); left.innerHTML = `<div style="font-weight:800">${a.name}</div><div class="small">${a.desc}</div><div style="margin-top:6px">Progress: ${progress}/${a.target} &nbsp; Reward: ${a.reward} GB</div>`; const right = document.createElement('div'); if(a.completed && !a.claimed){ const btn = document.createElement('button'); btn.className = 'claim-btn'; btn.textContent = 'CLAIM'; btn.dataset.id = a.id; btn.addEventListener('click', ()=>{ if(a.claimed) return; a.claimed = true; a.completed = true; goldenBeans += a.reward; updateScoreboard(); btn.textContent = 'CLAIMED'; btn.classList.add('claimed'); btn.disabled = true; renderAchievementsList(); }); right.appendChild(btn); } else if(a.claimed){ const done = document.createElement('div'); done.style.fontWeight = '800'; done.style.color = 'green'; done.textContent = 'CLAIMED'; right.appendChild(done); } div.appendChild(left); div.appendChild(right); achvList.appendChild(div); }); }

function updateDisplay(){ scoreEl.innerHTML = `<b>Jelly Beans: ${Math.floor(state.score)}</b>`; ppcEl.innerHTML = `<b>Beans per Click: ${Math.floor(currentPPC())}</b>`; ppsEl.innerHTML = `<b>Beans per Second: ${Math.floor(currentPPS())}</b>`; const floorCost = scaledCost(state.costs.floor, state.floorLevel, false, 'floor'); document.getElementById('buyFloor').textContent = `Buy Floor Beans (Cost: ${floorCost}) - Lvl: ${state.floorLevel}`; const kikiCost = scaledCost(state.costs.kiki, state.kikiLevel, false, 'kiki'); document.getElementById('buyKiki').textContent = `Buy Kiki (Cost: ${kikiCost}) - Lvl: ${state.kikiLevel}`; const moreCost = scaledCost(state.costs.more, state.moreLevel, true, 'more'); document.getElementById('buyMore').textContent = `Buy More Jelly Beans (Cost: ${moreCost}) - Lvl: ${state.moreLevel}`; const pillowCost = scaledCost(state.costs.pillow, state.pillowLevel, true, 'pillow'); document.getElementById('buyPillow').textContent = `Buy Comfy Pillow (Cost: ${pillowCost}) - Lvl: ${state.pillowLevel}`; const snackCost = scaledCost(state.costs.snack, state.snackLevel, false, 'snack'); document.getElementById('buySnack').textContent = `Buy Ultimate Snack (Cost: ${snackCost}) - Lvl: ${state.snackLevel}`; document.querySelectorAll('.upgrade').forEach(u => { const unlock = parseInt(u.getAttribute('data-unlock') || '1',10); const btn = u.querySelector('button'); let cost = 9999999; if(u.id === 'up-floor') cost = scaledCost(state.costs.floor, state.floorLevel, false, 'floor'); if(u.id === 'up-kiki') cost = scaledCost(state.costs.kiki, state.kikiLevel, false, 'kiki'); if(u.id === 'up-more') cost = scaledCost(state.costs.more, state.moreLevel, true, 'more'); if(u.id === 'up-pillow') cost = scaledCost(state.costs.pillow, state.pillowLevel, true, 'pillow'); if(u.id === 'up-snack') cost = scaledCost(state.costs.snack, state.snackLevel, false, 'snack'); u.classList.remove('locked','unaffordable','affordable'); if(!isUnlocked(u.id)){ u.classList.add('locked'); btn.disabled = true; } else { if(state.score >= cost && !isGamePaused){ u.classList.add('affordable'); btn.disabled = false; } else { u.classList.add('unaffordable'); btn.disabled = true; } } }); waterFill.style.height = Math.max(0, Math.min(100, waterLevel)) + '%'; if(waterLevel <= 10){ waterBar.classList.add('water-low'); } else { waterBar.classList.remove('water-low'); } if(state.ultimateBuffActive){ document.getElementById('buySnack').classList.add('rainbow-text'); ppsEl.classList.add('rainbow-text'); } else { document.getElementById('buySnack').classList.remove('rainbow-text'); ppsEl.classList.remove('rainbow-text'); } const textNode = levelDisplay.childNodes[0]; if(textNode) textNode.nodeValue = `LVL: ${playerLevel} `; updateScoreboard(); if(spinBtn) spinBtn.disabled = (goldenBeans <= 0); }

// --- Audio utils ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
function ensureAudio(){ try{ if(!audioCtx) audioCtx = new AudioCtx(); if(audioCtx.state === 'suspended') audioCtx.resume(); }catch(e){} }
function playBeep(freq=440, dur=0.12, type='sine'){ try{ ensureAudio(); if(!audioCtx) return; const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type = type; o.frequency.value = freq; g.gain.setValueAtTime(0.0001,audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.12,audioCtx.currentTime+0.01); o.connect(g); g.connect(audioCtx.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001,audioCtx.currentTime+dur); o.stop(audioCtx.currentTime+dur+0.02);}catch(e){} }
function playClickSound(){ playBeep(800,0.06,'square'); }
// NEW: distinct upgrade sound
function playUpgradeSound(){ playBeep(480,0.12,'triangle'); }
function playEventStart(){ playBeep(980,0.13,'sine'); }
function playLevelUpSound(){ try{ ensureAudio(); if(!audioCtx) return; const freqs = [440,660,880,1100]; let now = audioCtx.currentTime; freqs.forEach((f,i)=>{ const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type='sine'; o.frequency.value = f; g.gain.value = 0.0001; o.connect(g); g.connect(audioCtx.destination); o.start(now + i*0.12); g.gain.exponentialRampToValueAtTime(0.18, now + i*0.12 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, now + i*0.12 + 0.12); o.stop(now + i*0.12 + 0.14); }); }catch(e){} }

// White noise for water pouring
let noiseSource = null;
let noiseGain = null;
function startWhiteNoise(){ try{ ensureAudio(); if(!audioCtx) return; const bufferSize = 2 * audioCtx.sampleRate; const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate); const data = buffer.getChannelData(0); for(let i=0;i<bufferSize;i++){ data[i] = (Math.random()*2-1)*0.08; } noiseSource = audioCtx.createBufferSource(); noiseSource.buffer = buffer; noiseSource.loop = true; noiseGain = audioCtx.createGain(); noiseGain.gain.value = 0.06; noiseSource.connect(noiseGain); noiseGain.connect(audioCtx.destination); noiseSource.start(); }catch(e){} }
function stopWhiteNoise(){ try{ if(noiseSource){ noiseSource.stop(); noiseSource.disconnect(); noiseSource = null; } if(noiseGain){ noiseGain.disconnect(); noiseGain = null; } }catch(e){} }

// --- Pusheen image setup and click effect handlers ---
function setPusheenImage(url){ if(!url){ pusheenImg.style.display='none'; pusheenFallback.style.display='flex'; return; } pusheenFallback.style.display='none'; pusheenImg.style.display='block'; pusheenImg.src = url; }
setPusheenImage(PUSHEEN_IMG_URL);

// Image error fallback
pusheenImg.addEventListener('error', ()=>{ console.warn('Pusheen image failed to load — showing fallback.'); pusheenImg.style.display='none'; pusheenFallback.style.display='flex'; });

function addClickVisual(){ pusheenImg.classList.add('clicked'); }
function removeClickVisual(){ pusheenImg.classList.remove('clicked'); }
pusheenImg.addEventListener('mousedown', ()=>{ addClickVisual(); });
document.addEventListener('mouseup', ()=>{ setTimeout(removeClickVisual,100); });
pusheenImg.addEventListener('touchstart', ()=>{ addClickVisual(); });
document.addEventListener('touchend', ()=>{ setTimeout(removeClickVisual,120); });

// --- Click handler: respects global pause and nap event (now supports multiple events) ---
pusheenImg.addEventListener('click', () => {
  if(isGamePaused) return; // global pause
  if(state.activeEvents['nap']) return; // nap disables clicks
  const multiplier = state.activeEvents['sugar'] ? 3 : 1; // sugar triple
  const amount = currentPPC() * multiplier;
  addJellyBeans(amount);
  totalClicks += 1;
  clickBeansSinceXP += amount;
  const gained = Math.floor(clickBeansSinceXP / 25);
  if(gained > 0){ addXP(gained); clickBeansSinceXP -= gained * 25; }
  if(currentPPC() === 69) checkAchievements();
  checkAchievements();
  updateDisplay(); playClickSound();
});

// --- Upgrade buttons: now use distinct upgrade sound ---
buyFloorBtn.addEventListener('click', () => { const cost = scaledCost(state.costs.floor, state.floorLevel, false, 'floor'); if(state.score >= cost && !isGamePaused && isUnlocked('up-floor')){ state.score -= cost; state.floorLevel += 1; updateDisplay(); playUpgradeSound(); } });
buyKikiBtn.addEventListener('click', () => { const cost = scaledCost(state.costs.kiki, state.kikiLevel, false, 'kiki'); if(state.score >= cost && !isGamePaused && isUnlocked('up-kiki')){ state.score -= cost; state.kikiLevel += 1; updateDisplay(); playUpgradeSound(); } });
buyMoreBtn.addEventListener('click', () => { const cost = scaledCost(state.costs.more, state.moreLevel, true, 'more'); if(state.score >= cost && !isGamePaused && isUnlocked('up-more')){ state.score -= cost; state.moreLevel += 1; updateDisplay(); playUpgradeSound(); } });
buyPillowBtn.addEventListener('click', () => { const cost = scaledCost(state.costs.pillow, state.pillowLevel, true, 'pillow'); if(state.score >= cost && !isGamePaused && isUnlocked('up-pillow')){ state.score -= cost; state.pillowLevel += 1; updateDisplay(); playUpgradeSound(); } });
buySnackBtn.addEventListener('click', () => { const cost = scaledCost(state.costs.snack, state.snackLevel, false, 'snack'); if(state.score >= cost && !isGamePaused && isUnlocked('up-snack')){ state.score -= cost; state.snackLevel += 1; triggerUltimateSnackBuff(); randomizeAccentColor(); updateDisplay(); playUpgradeSound(); } });

// --- Passive income loop (1s) using addJellyBeans so achievements & XP track correctly ---
let ppsRepeater = null;
function startPassiveIncome(){ if(ppsRepeater) return; ppsRepeater = new PausableRepeater(1000, ()=>{ if(isGamePaused) return; const pps = currentPPS(); if(pps>0){ addJellyBeans(pps); passiveBeansSinceXP += pps; const gained = Math.floor(passiveBeansSinceXP / 50); if(gained > 0){ addXP(gained); passiveBeansSinceXP -= gained * 50; } checkAchievements(); } }); ppsRepeater.start(); }

// --- Mafia timers (warning 6s, arrival 15-55s) (now pausable) ---
const mafiaTimers = { arrival: new PausableTimer(), warning: new PausableTimer(), warningCountdownRunning:false, warningSecondsRemaining:0, warningIntervalId:null };
const mafiaWarningDuration = 6; // seconds

function startWarningCountdown(seconds){ mafiaTimers.warningSecondsRemaining = seconds; mafiaWarningEl.style.display = 'block'; mafiaCountdownEl.textContent = mafiaTimers.warningSecondsRemaining; playBeep(360,0.12,'sawtooth');
  if(mafiaTimers.warningIntervalId) clearInterval(mafiaTimers.warningIntervalId);
  mafiaTimers.warningIntervalId = setInterval(()=>{ if(isGamePaused) return; mafiaTimers.warningSecondsRemaining -= 1; mafiaCountdownEl.textContent = mafiaTimers.warningSecondsRemaining; if(mafiaTimers.warningSecondsRemaining <= 3 && mafiaTimers.warningSecondsRemaining > 0) playBeep(640,0.06,'sine'); if(mafiaTimers.warningSecondsRemaining <= 0){ clearInterval(mafiaTimers.warningIntervalId); mafiaTimers.warningIntervalId = null; } },1000);
}

function clearMafiaTimers(){ mafiaTimers.arrival.clear(); mafiaTimers.warning.clear(); if(mafiaTimers.warningIntervalId){ clearInterval(mafiaTimers.warningIntervalId); mafiaTimers.warningIntervalId=null; } mafiaWarningEl.style.display = 'none'; mafiaCountdownEl.textContent = mafiaWarningDuration; }

function mafiaArrive(){ if(mafiaTimers.warningIntervalId){ clearInterval(mafiaTimers.warningIntervalId); mafiaTimers.warningIntervalId = null; } mafiaWarningEl.style.display = 'none'; // pause global game
  isGamePaused = true; state.mafiaPaused = true; // pause other timers - handled centrally
  pauseAllTimers(); updateDisplay(); playBeep(200,0.35,'sawtooth');
  mafiaHasArrived = true; // mark first arrival
  tryLevelUpByMafia(); // apply mafia-based leveling rules

  // New bribe formula: weight PPC more than PPS (scaled to PPC)
  const bribe = Math.max(10, Math.floor(currentPPC() * 18 + currentPPS() * 4 + 30));
  bribeAmountEl.textContent = bribe; mafiaGameOver.style.display = 'none'; playAgainBtn.style.display = 'none'; payBribeBtn.style.display = '';
  mafiaOverlay.style.display = 'flex'; mafiaOverlay.setAttribute('aria-hidden','false');
  if(mafiaBannerImg){ mafiaBannerImg.style.display = 'block'; mafiaBannerImg.src = MAFIA_BANNER_URL; }
  if(state.score >= bribe){ payBribeBtn.disabled = false; } else { payBribeBtn.disabled = true; mafiaGameOver.style.display = ''; playAgainBtn.style.display = ''; state.score = 0; pusheenTarget.style.opacity = '0.35'; pusheenTarget.style.pointerEvents = 'none'; updateDisplay(); playBeep(120,0.5,'sine'); }
}

function startMafiaTimer(){ clearMafiaTimers(); if(isGamePaused) return; const delaySec = randomInt(15,55); // reduced max by 5s
  mafiaTimers.arrival.start(delaySec*1000, ()=>{ if(!isGamePaused) mafiaArrive(); });
  const warnDelay = Math.max(0,(delaySec - mafiaWarningDuration));
  mafiaTimers.warning.start(warnDelay*1000, ()=>{ if(!isGamePaused) startWarningCountdown(mafiaWarningDuration); });
}

payBribeBtn.addEventListener('click', ()=>{ const bribe = parseInt(bribeAmountEl.textContent,10) || 0; if(state.score >= bribe){ state.score -= bribe; playerScore += bribe; addXP(bribe); mafiaSurvivedCount += 1; checkAchievements(); updateScoreboard(); mafiaOverlay.style.display = 'none'; mafiaOverlay.setAttribute('aria-hidden','true'); if(mafiaBannerImg) mafiaBannerImg.style.display = 'none'; isGamePaused = false; state.mafiaPaused = false; playBeep(1100,0.08,'sine'); updateDisplay(); resumeAllTimers(); startMafiaTimer(); scheduleNextEvent(); } });
playAgainBtn.addEventListener('click', ()=>{ resetGame(); mafiaOverlay.style.display='none'; mafiaOverlay.setAttribute('aria-hidden','true'); if(mafiaBannerImg) mafiaBannerImg.style.display = 'none'; isGamePaused = false; startMafiaTimer(); scheduleNextEvent(); resumeAllTimers(); });

// --- Game over Play Again: ensure it works when water runs out ---
gameOverPlayBtn.addEventListener('click', ()=>{
  gameOverOverlay.style.display = 'none'; gameOverOverlay.setAttribute('aria-hidden','true'); if(gameOverBannerImg) gameOverBannerImg.style.display = 'none'; resetGame(); isGamePaused = false; startMafiaTimer(); scheduleNextEvent(); resumeAllTimers(); startWaterDepletion();
});

function resetGame(){ state.score = 0; state.basePPC = 1; state.moreLevel = 0; state.pillowLevel = 0; state.kikiLevel = 0; state.snackLevel = 0; state.floorLevel = 0; state.mafiaPaused = false; pusheenTarget.style.opacity = ''; pusheenTarget.style.pointerEvents = ''; mafiaGameOver.style.display = 'none'; playAgainBtn.style.display = 'none'; waterLevel = 100; playerScore = 0; playerLevel = 1; playerXP = 0; mafiaHasArrived = false; clickBeansSinceXP = 0; passiveBeansSinceXP = 0; totalClicks = 0; totalBeansEarned = 0; mafiaSurvivedCount = 0; waterRefillCount = 0; goldenCaughtCount = 0; goldenBeans = 0; mafiaArrivalTotal = 0; mafiaArrivalsSinceLevelUp = 0; achievements.forEach(a=>{ a.claimed=false; a.completed=false; }); if(mafiaBannerImg) mafiaBannerImg.style.display = 'none'; updateDisplay(); renderAchievementsList(); }

// --- Random events system (pausable & allow overlapping) ---
const eventsTimer = new PausableTimer();
const activeEventTimers = {};

function scheduleNextEvent(){ if(isGamePaused) return; const delay = randomInt(45,75); eventsTimer.start(delay*1000, ()=>{ if(!isGamePaused) triggerRandomEvent(); }); }
function cancelScheduledEvent(){ eventsTimer.clear(); }
function triggerRandomEvent(){ if(isGamePaused) return; const pickSeed = Math.random(); const pick = pickSeed < 0.33 ? 'sugar' : (pickSeed < 0.66 ? 'nap' : 'heat'); startEvent(pick); }

function createEventBanner(type,text){ const el = document.createElement('div'); el.className = `event-banner ${type}`; el.textContent = text; el.dataset.type = type; eventBanners.appendChild(el); return el; }

function startEvent(type){ if(isGamePaused) return; if(type === 'sugar'){ const text = 'SUGAR RUSH! All clicks are worth triple for 6 seconds!'; const banner = createEventBanner('sugar', text); state.activeEvents['sugar'] = (state.activeEvents['sugar']||0) + 1; document.body.classList.add('sugar-rush'); playEventStart(); const t = new PausableTimer(); const key = 'sugar_'+Date.now(); activeEventTimers[key] = { timer:t, banner:banner, type:'sugar' }; t.start(6000, ()=>{ if(banner && banner.parentNode) banner.remove(); if(activeEventTimers[key]) delete activeEventTimers[key]; state.activeEvents['sugar'] -= 1; if(state.activeEvents['sugar']<=0){ delete state.activeEvents['sugar']; document.body.classList.remove('sugar-rush'); } scheduleNextEvent(); }); }
  else if(type === 'nap'){ const text = 'Pusheen is napping! No clicking for 10 seconds.'; const banner = createEventBanner('nap', text); state.activeEvents['nap'] = (state.activeEvents['nap']||0) + 1; document.body.classList.add('nap-mode'); zzzEl.style.display = 'block'; playEventStart(); const t = new PausableTimer(); const key = 'nap_'+Date.now(); activeEventTimers[key] = { timer:t, banner:banner, type:'nap' }; t.start(10000, ()=>{ if(banner && banner.parentNode) banner.remove(); if(activeEventTimers[key]) delete activeEventTimers[key]; state.activeEvents['nap'] -= 1; if(state.activeEvents['nap']<=0){ delete state.activeEvents['nap']; document.body.classList.remove('nap-mode'); zzzEl.style.display = 'none'; } scheduleNextEvent(); }); }
  else if(type === 'heat'){ const text = 'HEAT WAVE! Water is depleting much faster for 10s!'; const banner = createEventBanner('heat', text); state.activeEvents['heat'] = (state.activeEvents['heat']||0) + 1; document.body.classList.add('heat-wave'); waterDepletionMultiplier *= 4; restartWaterInterval(); playEventStart(); const t = new PausableTimer(); const key = 'heat_'+Date.now(); activeEventTimers[key] = { timer:t, banner:banner, type:'heat' }; t.start(10000, ()=>{ if(banner && banner.parentNode) banner.remove(); if(activeEventTimers[key]) delete activeEventTimers[key]; state.activeEvents['heat'] -= 1; if(state.activeEvents['heat']<=0){ delete state.activeEvents['heat']; document.body.classList.remove('heat-wave'); waterDepletionMultiplier = Math.max(1, waterDepletionMultiplier/4); restartWaterInterval(); } scheduleNextEvent(); }); }
}

// --- Water depletion using PausableTimer repeating ticks ---
let waterNextTimer = null;
function scheduleWaterTick(delayMs){ if(waterNextTimer) waterNextTimer.clear(); waterNextTimer = new PausableTimer(); waterNextTimer.start(delayMs, ()=>{ if(isGamePaused) return; if(waterInvulTimeout) { scheduleWaterTick(Math.max(100, Math.floor(baseDepletionMs / waterDepletionMultiplier))); return; } waterLevel -= 1; if(waterLevel <= 0){ waterLevel = 0; updateDisplay(); handleWaterGameOver(); return; } updateDisplay(); scheduleWaterTick(Math.max(100, Math.floor(baseDepletionMs / waterDepletionMultiplier))); }); }
function restartWaterInterval(){ if(isGamePaused) return; scheduleWaterTick(Math.max(100, Math.floor(baseDepletionMs / waterDepletionMultiplier))); }
function startWaterDepletion(){ if(isGamePaused) return; if(waterNextTimer && waterNextTimer.isActive()) return; restartWaterInterval(); }
function stopWaterDepletion(){ if(waterNextTimer){ waterNextTimer.pause(); } }

// --- Pause/Resume orchestration ---
function pauseAllTimers(){ try{ eventsTimer.pause(); Object.values(activeEventTimers).forEach(o=>o.timer.pause()); if(waterNextTimer) waterNextTimer.pause(); mafiaTimers.arrival.pause(); mafiaTimers.warning.pause(); if(ppsRepeater) ppsRepeater.pause(); if(goldenSpawnTimer) goldenSpawnTimer.pause(); }catch(e){} }
function resumeAllTimers(){ try{ eventsTimer.resume(); Object.values(activeEventTimers).forEach(o=>o.timer.resume()); if(waterNextTimer) waterNextTimer.resume(); mafiaTimers.arrival.resume(); mafiaTimers.warning.resume(); if(ppsRepeater) ppsRepeater.resume(); if(goldenSpawnTimer) goldenSpawnTimer.resume(); }catch(e){} }

// --- handle water game over ---
function handleWaterGameOver(){ isGamePaused = true; stopWaterDepletion(); eventsTimer.pause(); mafiaTimers.arrival.pause(); mafiaTimers.warning.pause(); gameOverOverlay.style.display = 'flex'; gameOverOverlay.setAttribute('aria-hidden','false'); finalScoreEl.textContent = `Final Score: ${playerScore}`; if(gameOverBannerImg){ gameOverBannerImg.src = GAME_OVER_BANNER_URL; gameOverBannerImg.style.display = 'block'; } }

// refill logic
let refillIntervalId = null;
function startRefilling(){ if(isGamePaused) return; if(refillIntervalId) return; startWhiteNoise(); refillIntervalId = setInterval(()=>{ if(isGamePaused) return; const prev = waterLevel; waterLevel = Math.min(100, waterLevel + 2); updateDisplay(); if(prev < 100 && waterLevel === 100){ waterRefillCount += 1; checkAchievements(); stopWaterDepletion(); if(waterPauseTimeout) clearTimeout(waterPauseTimeout); waterPauseTimeout = setTimeout(()=>{ waterPauseTimeout = null; if(!isGamePaused && !waterInvulTimeout) startWaterDepletion(); },4000); } },100); }
function stopRefilling(){ if(refillIntervalId){ clearInterval(refillIntervalId); refillIntervalId = null; } stopWhiteNoise(); }

waterBowl.addEventListener('mousedown', (e)=>{ e.preventDefault(); startRefilling(); });
document.addEventListener('mouseup', ()=>{ stopRefilling(); });
waterBowl.addEventListener('touchstart', (e)=>{ e.preventDefault(); startRefilling(); });
document.addEventListener('touchend', ()=>{ stopRefilling(); });

// --- Ultimate Snack buff ---
function triggerUltimateSnackBuff(){ if(state.ultimateBuffActive) return; state.ultimateBuffActive = true; state.bpsBuffMultiplier = 3; updateDisplay(); setTimeout(()=>{ state.ultimateBuffActive = false; state.bpsBuffMultiplier = 1; updateDisplay(); },5000); }

// --- Events: Golden Bean spawn (now slightly more frequent: 20-80s) ---
let goldenSpawnTimer = new PausableTimer();
let goldenVisibleTimer = null; let goldenElem = null;
function scheduleNextGoldenSpawn(){ if(isGamePaused) return; const delay = randomInt(20,80); goldenSpawnTimer.start(delay*1000, ()=>{ if(isGamePaused) return; showGoldenBean(); scheduleNextGoldenSpawn(); }); }
function showGoldenBean(){ if(goldenElem) { goldenElem.remove(); goldenElem = null; }
  goldenElem = document.createElement('img'); goldenElem.src = GOLDEN_BEAN_IMG; goldenElem.className = 'golden-bean'; const vw = Math.max(200, window.innerWidth - 200); const vh = Math.max(200, window.innerHeight - 200); const x = randomInt(80, vw - 80); const y = randomInt(120, vh - 120); goldenElem.style.left = x + 'px'; goldenElem.style.top = y + 'px'; document.body.appendChild(goldenElem);
  goldenElem.addEventListener('click', ()=>{ goldenBeans += 1; goldenCaughtCount += 1; checkAchievements(); updateScoreboard(); if(goldenElem){ goldenElem.remove(); goldenElem = null; } if(goldenVisibleTimer){ clearTimeout(goldenVisibleTimer); goldenVisibleTimer = null; } });
  goldenVisibleTimer = setTimeout(()=>{ if(goldenElem){ goldenElem.remove(); goldenElem = null; } },1000);
}

// --- Achievements UI handlers ---
achvBtn.addEventListener('click', ()=>{ achvOverlay.style.display = 'flex'; achvOverlay.setAttribute('aria-hidden','false'); isGamePaused = true; pauseAllTimers(); renderAchievementsList(); });
closeAchvBtn.addEventListener('click', ()=>{ achvOverlay.style.display='none'; achvOverlay.setAttribute('aria-hidden','true'); isGamePaused = false; resumeAllTimers(); });

exchangeOneBtn.addEventListener('click', ()=>{ if(goldenBeans <= 0) return; goldenBeans -= 1; const beansValue = Math.floor(currentPPS() * 60); addJellyBeans(beansValue); updateScoreboard(); checkAchievements(); });
exchangeAllBtn.addEventListener('click', ()=>{ if(goldenBeans <= 0) return; const count = goldenBeans; goldenBeans = 0; const beansValue = Math.floor(currentPPS() * 60 * count); addJellyBeans(beansValue); updateScoreboard(); checkAchievements(); });

// --- Lottery: now 20% chance nothing, otherwise weighted prize categories. Visual shows 3 matching emojis for the prize. ---
const lotteryCategories = [
  { key:'common', weight:60, emoji:'🍬' },
  { key:'common_med', weight:25, emoji:'🍪' },
  { key:'rare', weight:10, emoji:'🍫' },
  { key:'water', weight:3, emoji:'🍭' },
  { key:'jackpot', weight:1, emoji:'🌟' },
  { key:'negative', weight:1, emoji:'💥' }
];

const lotteryHandlers = {
  '🍬': ()=>{ const seconds=30; const value = Math.floor(currentPPS()*seconds); addJellyBeans(value); showTempBanner(`Common: +${value} JB (${seconds}s of BPS)`); },
  '🍪': ()=>{ const seconds=90; const value = Math.floor(currentPPS()*seconds); addJellyBeans(value); showTempBanner(`Medium: +${value} JB (${seconds}s of BPS)`); },
  '🍫': ()=>{ const seconds=300; const value = Math.floor(currentPPS()*seconds); addJellyBeans(value); showTempBanner(`Large: +${value} JB (${seconds}s of BPS)`); },
  '🍭': ()=>{ waterLevel = 100; updateDisplay(); if(waterInvulTimeout) clearTimeout(waterInvulTimeout); stopWaterDepletion(); waterInvulTimeout = setTimeout(()=>{ waterInvulTimeout = null; if(!isGamePaused) startWaterDepletion(); },20000); mafiaTimers.arrival.pause(); setTimeout(()=>{ mafiaTimers.arrival.resume(); },20000); showTempBanner('Lucky: Full water refill + 20s invulnerability'); },
  '🌟': ()=>{ goldenBeans += 5; updateScoreboard(); showTempBanner('JACKPOT! +5 Golden Beans'); },
  '💥': ()=>{ const neg = randomInt(1,4); if(neg===1){ state.score = 0; updateDisplay(); showTempBanner('Oh no! You lost all your Jelly Beans!'); } else if(neg===2){ const possible = ['moreLevel','pillowLevel','kikiLevel','floorLevel','snackLevel']; const chosen = possible[randomInt(0,possible.length-1)]; if(state[chosen] > 0){ state[chosen] -= 1; updateDisplay(); showTempBanner('An upgrade was downgraded by 1 level!'); } else showTempBanner('Nothing to downgrade.'); } else if(neg===3){ mafiaArrive(); showTempBanner('Mafia arrives instantly!'); } else { showTempBanner('No effect.'); } }
};

spinBtn.addEventListener('click', ()=>{
  if(goldenBeans <= 0) return; goldenBeans -= 1; updateScoreboard(); spinBtn.disabled = true; let ticks = 24; const symbols = lotteryCategories.map(c=>c.emoji);
  const spinInterval = setInterval(()=>{ slotLeft.textContent = symbols[randomInt(0,symbols.length-1)]; slotMid.textContent = symbols[randomInt(0,symbols.length-1)]; slotRight.textContent = symbols[randomInt(0,symbols.length-1)]; ticks--; if(ticks<=0){ clearInterval(spinInterval);
        // decide if nothing (20%)
        if(Math.random() < 0.20){ slotLeft.textContent = '❌'; slotMid.textContent = '❌'; slotRight.textContent = '❌'; showTempBanner('No prize — 20% chance.'); spinBtn.disabled = false; return; }
        // choose category weighted
        const category = weightedRandom(lotteryCategories.map(c=>({ weight:c.weight, value:c }))) ;
        // show 3 matching emojis for clarity
        slotLeft.textContent = category.emoji; slotMid.textContent = category.emoji; slotRight.textContent = category.emoji;
        // execute handler
        const h = lotteryHandlers[category.emoji]; if(h) h(); spinBtn.disabled = false; } },80);
});

function showTempBanner(text){ const b = document.createElement('div'); b.className='event-banner'; b.textContent = text; eventBanners.appendChild(b); setTimeout(()=>{ b.remove(); },4000); }

// --- Golden bean initial schedule ---
scheduleNextGoldenSpawn();

// --- Start services ---
startPassiveIncome();

// Start mafia timer and event timer
startMafiaTimer(); scheduleNextEvent(); startWaterDepletion();

// Achievements rendering
renderAchievementsList();

// Accessibility: allow keyboard activation
pusheenImg.setAttribute('tabindex','0');
pusheenImg.addEventListener('keydown',(e)=>{ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); pusheenImg.click(); } });

// expose helpers for debugging
window.setPusheenImage = setPusheenImage; window.state = state; window.scheduleNextEvent = scheduleNextEvent; window.playerScore = playerScore; window.playerLevel = playerLevel; window.playerXP = playerXP; window.goldenBeans = goldenBeans;
