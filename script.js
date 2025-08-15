/*****************************************************************
 * Pusheen Clicker 0.7 - Kornel's Challenge Update
 *****************************************************************/

// --- Configuration ---
const PUSHEEN_IMG_URL = 'https://i.postimg.cc/MKMFBXTh/Chat-GPT-Image-12-sie-2025-14-21-36.png';
const WATER_IMG_URL = 'https://i.postimg.cc/DwvGF6vP/Chat-GPT-Image-Aug-12.png';
const MAFIA_BANNER_URL = 'https://i.postimg.cc/RF1WtJGT/chatgpt-homiki.png';
const GOLDEN_BEAN_IMG = 'https://i.postimg.cc/fLpnGgTL/Chat-GPT-Image-Aug-13-2025-03-12-55-PM.png';
const GAME_OVER_BANNER_URL = 'https://i.postimg.cc/RZLCJg8W/Chat-GPT-Image-Aug-13-2025-05-17-39-PM.png';

// --- Global pause flag ---
let isGamePaused = false;
let kornelChallengeActive = false;
let isMarketBlocked = false;
let salePurchasesLeft = 0;
let ppcBuffMultiplier = 1; // Mnożnik dla Beans per Click (dla "Super-Pazura")

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

// NOWE ODWOŁANIA DO DOM DLA KORNELA
const upgradesDiv = document.querySelector('.upgrades');
const kornelChallengeDiv = document.getElementById('kornelChallenge');
const kornelClickTargetEl = document.getElementById('kornelClickTarget');
const kornelProgressBar = document.getElementById('kornelProgressBar');
const kornelTimerEl = document.getElementById('kornelTimer');


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
function weightedRandom(items){
  const sum = items.reduce((s,i)=>s+i.weight,0); let r = Math.random()*sum; for(const it of items){ if(r < it.weight) return it.value; r -= it.weight; } return items[items.length-1].value; }
function scaledCost(base, level, isClickUpgrade, key){ let mult = isClickUpgrade ? state.clickCostMultiplier : state.autoCostMultiplier; if(key === 'snack') mult = 1.35; return Math.ceil(base * Math.pow(mult, level)); }

function currentPPC(){ return state.basePPC + (state.moreLevel * 1) + (state.pillowLevel * 5); }
function currentPPS(){ const base = (state.floorLevel * 1) + (state.kikiLevel * 6) + (state.snackLevel * 100); return Math.floor(base * state.bpsBuffMultiplier); }

function updateScoreboard(){ scoreboardEl.textContent = playerScore; goldenCounterEl.textContent = goldenBeans; }

function addJellyBeans(amount){ if(amount <= 0) return; state.score += amount; totalBeansEarned += amount; updateDisplay(); }

function isUnlocked(upgradeId){ const el = document.getElementById(upgradeId); if(!el) return false; const required = parseInt(el.getAttribute('data-unlock')||'1',10); if(required <= 1) return true; return (playerLevel >= required); }

function addXP(amount){ if(amount <= 0) return; playerXP += amount; updateDisplay(); }

function grantLevelUp() {
  if (playerLevel >= 10) return;
  playerLevel += 1;
  const bonus = playerLevel * 250;
  state.score += bonus;
  totalBeansEarned += bonus;
  playLevelUpSound();
  mafiaArrivalsSinceLevelUp = 0;
  renderAchievementsList();
  updateDisplay();
}

function tryLevelUpByMafia() {
  mafiaArrivalTotal += 1;
  mafiaArrivalsSinceLevelUp += 1;
  let shouldLevelUp = false;

  if (playerLevel < 4) {
    shouldLevelUp = true;
  } else if (playerLevel === 4) {
    if (mafiaArrivalsSinceLevelUp >= 2) {
      shouldLevelUp = true;
    }
  } else if (playerLevel >= 5) {
    if (mafiaArrivalsSinceLevelUp >= 3) {
      shouldLevelUp = true;
    }
  }

  if (shouldLevelUp && playerLevel < 10) {
    showTempBanner(`LEVEL UP IMMINENT! Preparing bonus...`);
    const delay = randomInt(2000, 10000);
    setTimeout(() => {
      grantLevelUp();
      showTempBanner(`Congratulations! You are now LVL: ${playerLevel}!`);
    }, delay);
  }
}

function randomizeAccentColor(){ const h = randomInt(0,360); document.documentElement.style.setProperty('--accent', `hsl(${h}deg 80% 55%)`); }

function checkAchievements(){ achievements.forEach(a => { if(a.claimed) return; let progress = 0; if(a.type === 'clicks') progress = totalClicks; if(a.type === 'beans') progress = totalBeansEarned; if(a.type === 'mafia') progress = mafiaSurvivedCount; if(a.type === 'refill') progress = waterRefillCount; if(a.type === 'level') progress = playerLevel; if(a.type === 'ppc') progress = currentPPC(); if(a.type === 'gold') progress = goldenCaughtCount; if(progress >= a.target){ a.completed = true; } }); if(achvOverlay.style.display === 'flex') {renderAchievementsList();} }

function renderAchievementsList(){ achvList.innerHTML = ''; achievements.forEach(a => { const div = document.createElement('div'); div.className = 'achv-item'; let progress = 0; if(a.type === 'clicks') progress = totalClicks; if(a.type === 'beans') progress = totalBeansEarned; if(a.type === 'mafia') progress = mafiaSurvivedCount; if(a.type === 'refill') progress = waterRefillCount; if(a.type === 'level') progress = playerLevel; if(a.type === 'ppc') progress = currentPPC(); if(a.type === 'gold') progress = goldenCaughtCount; const left = document.createElement('div'); left.innerHTML = `<div style="font-weight:800">${a.name}</div><div class="small">${a.desc}</div><div style="margin-top:6px">Progress: ${Math.min(progress, a.target)}/${a.target} &nbsp; Reward: ${a.reward} GB</div>`; const right = document.createElement('div'); if(a.completed && !a.claimed){ const btn = document.createElement('button'); btn.className = 'claim-btn'; btn.textContent = 'CLAIM'; btn.dataset.id = a.id; btn.addEventListener('click', ()=>{ if(a.claimed) return; a.claimed = true; a.completed = true; goldenBeans += a.reward; updateScoreboard(); btn.textContent = 'CLAIMED'; btn.classList.add('claimed'); btn.disabled = true; }); right.appendChild(btn); } else if(a.claimed){ const done = document.createElement('div'); done.className = 'claim-btn claimed'; done.textContent = 'CLAIMED'; right.appendChild(done); } div.appendChild(left); div.appendChild(right); achvList.appendChild(div); }); }

function updateDisplay(){ scoreEl.innerHTML = `<b>Jelly Beans: ${Math.floor(state.score)}</b>`; ppcEl.innerHTML = `<b>Beans per Click: ${Math.floor(currentPPC())}</b>`; ppsEl.innerHTML = `<b>Beans per Second: ${Math.floor(currentPPS())}</b>`; const floorCost = scaledCost(state.costs.floor, state.floorLevel, false, 'floor'); document.getElementById('buyFloor').textContent = `Buy Floor Beans (Cost: ${floorCost}) - Lvl: ${state.floorLevel}`; const kikiCost = scaledCost(state.costs.kiki, state.kikiLevel, false, 'kiki'); document.getElementById('buyKiki').textContent = `Buy Kiki (Cost: ${kikiCost}) - Lvl: ${state.kikiLevel}`; const moreCost = scaledCost(state.costs.more, state.moreLevel, true, 'more'); document.getElementById('buyMore').textContent = `Buy More Jelly Beans (Cost: ${moreCost}) - Lvl: ${state.moreLevel}`; const pillowCost = scaledCost(state.costs.pillow, state.pillowLevel, true, 'pillow'); document.getElementById('buyPillow').textContent = `Buy Comfy Pillow (Cost: ${pillowCost}) - Lvl: ${state.pillowLevel}`; const snackCost = scaledCost(state.costs.snack, state.snackLevel, false, 'snack'); document.getElementById('buySnack').textContent = `Buy Ultimate Snack (Cost: ${snackCost}) - Lvl: ${state.snackLevel}`; document.querySelectorAll('.upgrade').forEach(u => { const unlock = parseInt(u.getAttribute('data-unlock') || '1',10); const btn = u.querySelector('button'); let cost = 9999999; if(u.id === 'up-floor') cost = scaledCost(state.costs.floor, state.floorLevel, false, 'floor'); if(u.id === 'up-kiki') cost = scaledCost(state.costs.kiki, state.kikiLevel, false, 'kiki'); if(u.id === 'up-more') cost = scaledCost(state.costs.more, state.moreLevel, true, 'more'); if(u.id === 'up-pillow') cost = scaledCost(state.costs.pillow, state.pillowLevel, true, 'pillow'); if(u.id === 'up-snack') cost = scaledCost(state.costs.snack, state.snackLevel, false, 'snack'); u.classList.remove('locked','unaffordable','affordable'); if(!isUnlocked(u.id)){ u.classList.add('locked'); btn.disabled = true; } else { if(state.score >= cost && !isGamePaused){ u.classList.add('affordable'); btn.disabled = false; } else { u.classList.add('unaffordable'); btn.disabled = true; } } }); waterFill.style.height = Math.max(0, Math.min(100, waterLevel)) + '%'; if(waterLevel <= 10){ waterBar.classList.add('water-low'); } else { waterBar.classList.remove('water-low'); } if(state.ultimateBuffActive){ document.getElementById('buySnack').classList.add('rainbow-text'); ppsEl.classList.add('rainbow-text'); } else { document.getElementById('buySnack').classList.remove('rainbow-text'); ppsEl.classList.remove('rainbow-text'); } const textNode = levelDisplay.childNodes[0]; if(textNode) textNode.nodeValue = `LVL: ${playerLevel} `; updateScoreboard(); if(spinBtn) spinBtn.disabled = (goldenBeans <= 0); }

// --- Audio utils ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
function ensureAudio(){ try{ if(!audioCtx) audioCtx = new AudioCtx(); if(audioCtx.state === 'suspended') audioCtx.resume(); }catch(e){} }
function playBeep(freq=440, dur=0.12, type='sine'){ try{ ensureAudio(); if(!audioCtx) return; const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type = type; o.frequency.value = freq; g.gain.setValueAtTime(0.0001,audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.12,audioCtx.currentTime+0.01); o.connect(g); g.connect(audioCtx.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001,audioCtx.currentTime+dur); o.stop(audioCtx.currentTime+dur+0.02);}catch(e){} }
function playClickSound(){ playBeep(800,0.06,'square'); }
function playUpgradeSound(){ playBeep(480,0.12,'triangle'); }
function playEventStart(){ playBeep(980,0.13,'sine'); }
function playLevelUpSound(){ try{ ensureAudio(); if(!audioCtx) return; const freqs = [440,660,880,1100]; let now = audioCtx.currentTime; freqs.forEach((f,i)=>{ const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type='sine'; o.frequency.value = f; g.gain.value = 0.0001; o.connect(g); g.connect(audioCtx.destination); o.start(now + i*0.12); g.gain.exponentialRampToValueAtTime(0.18, now + i*0.12 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, now + i*0.12 + 0.12); o.stop(now + i*0.12 + 0.14); }); }catch(e){} }

let noiseSource = null;
let noiseGain = null;
function startWhiteNoise(){ try{ ensureAudio(); if(!audioCtx) return; const bufferSize = 2 * audioCtx.sampleRate; const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate); const data = buffer.getChannelData(0); for(let i=0;i<bufferSize;i++){ data[i] = (Math.random()*2-1)*0.08; } noiseSource = audioCtx.createBufferSource(); noiseSource.buffer = buffer; noiseSource.loop = true; noiseGain = audioCtx.createGain(); noiseGain.gain.value = 0.06; noiseSource.connect(noiseGain); noiseGain.connect(audioCtx.destination); noiseSource.start(); }catch(e){} }
function stopWhiteNoise(){ try{ if(noiseSource){ noiseSource.stop(); noiseSource.disconnect(); noiseSource = null; } if(noiseGain){ noiseGain.disconnect(); noiseGain = null; } }catch(e){} }

function setPusheenImage(url){ if(!url){ pusheenImg.style.display='none'; pusheenFallback.style.display='flex'; return; } pusheenFallback.style.display='none'; pusheenImg.style.display='block'; pusheenImg.src = url; }
setPusheenImage(PUSHEEN_IMG_URL);

pusheenImg.addEventListener('error', ()=>{ console.warn('Pusheen image failed to load — showing fallback.'); pusheenImg.style.display='none'; pusheenFallback.style.display='flex'; });

function addClickVisual(){ pusheenImg.classList.add('clicked'); }
function removeClickVisual(){ pusheenImg.classList.remove('clicked'); }
pusheenImg.addEventListener('mousedown', ()=>{ addClickVisual(); });
document.addEventListener('mouseup', ()=>{ setTimeout(removeClickVisual,100); });
pusheenImg.addEventListener('touchstart', ()=>{ addClickVisual(); });
document.addEventListener('touchend', ()=>{ setTimeout(removeClickVisual,120); });

pusheenImg.addEventListener('click', () => {
  if(isGamePaused) return;
  if(state.activeEvents['nap']) return;
  const multiplier = state.activeEvents['sugar'] ? 3 : 1;
  const amount = currentPPC() * multiplier;
  addJellyBeans(amount);
  totalClicks += 1;
  clickBeansSinceXP += amount;
  const gained = Math.floor(clickBeansSinceXP / 25);
  if(gained > 0){ addXP(gained); clickBeansSinceXP -= gained * 25; }
  checkAchievements();
  updateDisplay(); playClickSound();
});

buyFloorBtn.addEventListener('click', () => { const cost = scaledCost(state.costs.floor, state.floorLevel, false, 'floor'); if(state.score >= cost && !isGamePaused && isUnlocked('up-floor')){ state.score -= cost; state.floorLevel += 1; updateDisplay(); playUpgradeSound(); } });
buyKikiBtn.addEventListener('click', () => { const cost = scaledCost(state.costs.kiki, state.kikiLevel, false, 'kiki'); if(state.score >= cost && !isGamePaused && isUnlocked('up-kiki')){ state.score -= cost; state.kikiLevel += 1; updateDisplay(); playUpgradeSound(); } });
buyMoreBtn.addEventListener('click', () => { const cost = scaledCost(state.costs.more, state.moreLevel, true, 'more'); if(state.score >= cost && !isGamePaused && isUnlocked('up-more')){ state.score -= cost; state.moreLevel += 1; updateDisplay(); playUpgradeSound(); } });
buyPillowBtn.addEventListener('click', () => { const cost = scaledCost(state.costs.pillow, state.pillowLevel, true, 'pillow'); if(state.score >= cost && !isGamePaused && isUnlocked('up-pillow')){ state.score -= cost; state.pillowLevel += 1; updateDisplay(); playUpgradeSound(); } });
buySnackBtn.addEventListener('click', () => { const cost = scaledCost(state.costs.snack, state.snackLevel, false, 'snack'); if(state.score >= cost && !isGamePaused && isUnlocked('up-snack')){ state.score -= cost; state.snackLevel += 1; triggerUltimateSnackBuff(); randomizeAccentColor(); updateDisplay(); playUpgradeSound(); } });

let ppsRepeater = null;
function startPassiveIncome(){ if(ppsRepeater) return; ppsRepeater = new PausableRepeater(1000, ()=>{ if(isGamePaused) return; const pps = currentPPS(); if(pps>0){ addJellyBeans(pps); passiveBeansSinceXP += pps; const gained = Math.floor(passiveBeansSinceXP / 50); if(gained > 0){ addXP(gained); passiveBeansSinceXP -= gained * 50; } checkAchievements(); } }); ppsRepeater.start(); }

const mafiaTimers = { arrival: new PausableTimer(), warning: new PausableTimer() };
const mafiaWarningDuration = 6;

function startWarningCountdown(seconds){ 
    let remaining = seconds;
    mafiaWarningEl.style.display = 'block';
    mafiaCountdownEl.textContent = remaining;
    playBeep(360,0.12,'sawtooth');
    
    const intervalId = setInterval(() => {
        if(isGamePaused) return;
        remaining--;
        mafiaCountdownEl.textContent = remaining;
        if(remaining <= 0) {
            clearInterval(intervalId);
        } else if (remaining <= 3) {
            playBeep(640,0.06,'sine');
        }
    }, 1000);
    mafiaTimers.warning.id = intervalId; // store to clear if needed
}

function clearMafiaTimers(){
    mafiaTimers.arrival.clear();
    mafiaTimers.warning.clear();
    if (mafiaTimers.warning.id) clearInterval(mafiaTimers.warning.id);
    mafiaWarningEl.style.display = 'none';
}

function mafiaArrive() {
  clearMafiaTimers();
  isGamePaused = true;
  pauseAllTimers();
  updateDisplay();
  playBeep(200, 0.35, 'sawtooth');
  mafiaHasArrived = true;
  tryLevelUpByMafia();

  // ZMIANA: Poniżej znajduje się nowa, łatwiejsza formuła obliczania haraczu
  const bribe = Math.floor(((currentPPS() * 4) + (currentPPC() * 7) + 30) * (1 + (playerLevel * 0.35)));

  bribeAmountEl.textContent = bribe;
  mafiaGameOver.style.display = 'none';
  playAgainBtn.style.display = 'none';
  payBribeBtn.style.display = 'inline-block';
  payBribeBtn.disabled = state.score < bribe;

  mafiaOverlay.style.display = 'flex';

  if (state.score < bribe) {
    mafiaGameOver.style.display = 'block';
    playAgainBtn.style.display = 'inline-block';
  }
}

function startMafiaTimer(){ 
  clearMafiaTimers(); 
  if(isGamePaused) return; 
  const delaySec = randomInt(15,60);
  mafiaTimers.arrival.start(delaySec * 1000, mafiaArrive);
  if(delaySec > mafiaWarningDuration) {
      mafiaTimers.warning.start((delaySec - mafiaWarningDuration) * 1000, () => {
          startWarningCountdown(mafiaWarningDuration);
      });
  }
}

payBribeBtn.addEventListener('click', ()=>{ 
    const bribe = parseInt(bribeAmountEl.textContent,10) || 0;
    if(state.score >= bribe){ 
        state.score -= bribe;
        playerScore += bribe;
        addXP(bribe); 
        mafiaSurvivedCount += 1;
        checkAchievements(); 
        updateScoreboard(); 
        mafiaOverlay.style.display = 'none';
        isGamePaused = false;
        playBeep(1100,0.08,'sine');
        resumeAllTimers(); 
        startMafiaTimer(); 
        scheduleNextEvent(); 
    }
});
playAgainBtn.addEventListener('click', ()=>{ resetGame(); mafiaOverlay.style.display='none'; isGamePaused = false; resumeAllTimers(); });

gameOverPlayBtn.addEventListener('click', ()=>{
  gameOverOverlay.style.display = 'none';
  resetGame();
  isGamePaused = false;
  resumeAllTimers();
});

function resetGame(){ 
    state.score = 0;
    state.basePPC = 1;
    state.moreLevel = 0; state.pillowLevel = 0; state.kikiLevel = 0; state.snackLevel = 0; state.floorLevel = 0;
    waterLevel = 100;
    playerScore = 0; playerLevel = 1; playerXP = 0; goldenBeans = 0;
    mafiaArrivalTotal = 0; mafiaArrivalsSinceLevelUp = 0;
    totalClicks = 0; totalBeansEarned = 0; mafiaSurvivedCount = 0; waterRefillCount = 0; goldenCaughtCount = 0;
    achievements.forEach(a=>{ a.claimed=false; a.completed=false; });

    clearMafiaTimers();
    eventsTimer.clear();
    Object.values(activeEventTimers).forEach(o => o.timer.clear());
    kornelEventTimer.clear();
    
    startMafiaTimer();
    scheduleNextEvent();
    startWaterDepletion();
    scheduleNextGoldenSpawn();
    scheduleNextKornelEvent();

    updateDisplay();
    renderAchievementsList();
}

const eventsTimer = new PausableTimer();
const activeEventTimers = {};

function scheduleNextEvent() {
  if (isGamePaused) return;
  // ZMIANA: Czas pojawiania się eventów to teraz 1-50 sekund
  const delay = randomInt(1, 50);
  eventsTimer.start(delay * 1000, () => {
    if (!isGamePaused) triggerRandomEvent();
  });
}
function triggerRandomEvent(){ 
    if(isGamePaused || kornelChallengeActive) return;
    const activeKeys = Object.keys(state.activeEvents);
    if(activeKeys.length >= 2) { scheduleNextEvent(); return; } // prevent more than 2 events
    let availableEvents = ['sugar','nap','heat'];
    if(activeKeys.includes('sugar')) availableEvents = ['nap','heat'];
    if(activeKeys.includes('nap')) availableEvents = ['sugar', 'heat'];
    if(activeKeys.includes('heat')) availableEvents = ['sugar', 'nap'];
    if(availableEvents.length === 0) { scheduleNextEvent(); return; }
    startEvent(availableEvents[randomInt(0, availableEvents.length-1)]); 
}

function createEventBanner(type,text){ const el = document.createElement('div'); el.className = `event-banner ${type}`; el.textContent = text; el.dataset.type = type; eventBanners.appendChild(el); return el; }

function startEvent(type){ 
  if(isGamePaused) return; 
  if(type === 'sugar'){ 
      const banner = createEventBanner('sugar', 'SUGAR RUSH! All clicks are worth triple for 6 seconds!'); 
      state.activeEvents['sugar'] = true; 
      document.body.classList.add('sugar-rush'); 
      playEventStart(); 
      const t = new PausableTimer(); 
      activeEventTimers['sugar'] = { timer: t, banner: banner };
      t.start(6000, ()=>{ 
          delete state.activeEvents['sugar']; 
          document.body.classList.remove('sugar-rush');
          if(banner.parentNode) banner.remove();
          delete activeEventTimers['sugar'];
          scheduleNextEvent(); 
      });
  } else if(type === 'nap'){ 
      const banner = createEventBanner('nap', 'Pusheen is napping! No clicking for 10 seconds.'); 
      state.activeEvents['nap'] = true; 
      document.body.classList.add('nap-mode'); 
      zzzEl.style.display = 'block'; 
      playEventStart(); 
      const t = new PausableTimer();
      activeEventTimers['nap'] = { timer: t, banner: banner };
      t.start(10000, ()=>{ 
          delete state.activeEvents['nap'];
          document.body.classList.remove('nap-mode');
          zzzEl.style.display = 'none'; 
          if(banner.parentNode) banner.remove();
          delete activeEventTimers['nap'];
          scheduleNextEvent(); 
      }); 
  } else if(type === 'heat'){ 
      const banner = createEventBanner('heat', 'HEAT WAVE! Water is depleting much faster for 10s!'); 
      state.activeEvents['heat'] = true; 
      waterDepletionMultiplier = 4;
      restartWaterInterval(); 
      playEventStart(); 
      const t = new PausableTimer();
      activeEventTimers['heat'] = { timer: t, banner: banner };
      t.start(10000, ()=>{ 
          delete state.activeEvents['heat'];
          waterDepletionMultiplier = 1;
          restartWaterInterval(); 
          if(banner.parentNode) banner.remove();
          delete activeEventTimers['heat'];
          scheduleNextEvent(); 
      }); 
  }
}

let waterNextTimer = new PausableTimer();
function restartWaterInterval(){ 
    waterNextTimer.clear();
    if(isGamePaused || waterInvulTimeout) return;
    const delay = baseDepletionMs / waterDepletionMultiplier;
    waterNextTimer.start(delay, ()=>{
        waterLevel -= 1;
        if(waterLevel <= 0){
            waterLevel = 0;
            updateDisplay();
            handleWaterGameOver();
            return;
        }
        updateDisplay();
        restartWaterInterval();
    });
}
function startWaterDepletion(){ if(!waterNextTimer.isActive()) restartWaterInterval(); }
function stopWaterDepletion(){ waterNextTimer.pause(); }

function pauseAllTimers(){ 
    eventsTimer.pause();
    Object.values(activeEventTimers).forEach(o=>o.timer.pause());
    waterNextTimer.pause();
    mafiaTimers.arrival.pause();
    mafiaTimers.warning.pause();
    if(ppsRepeater) ppsRepeater.pause();
    if(goldenSpawnTimer) goldenSpawnTimer.pause();
    kornelEventTimer.pause();
}
function resumeAllTimers(){ 
    eventsTimer.resume();
    Object.values(activeEventTimers).forEach(o=>o.timer.resume());
    if(!waterInvulTimeout) waterNextTimer.resume();
    mafiaTimers.arrival.resume();
    mafiaTimers.warning.resume();
    if(ppsRepeater) ppsRepeater.resume();
    if(goldenSpawnTimer) goldenSpawnTimer.resume();
    kornelEventTimer.resume();
}

function handleWaterGameOver(){ 
    isGamePaused = true;
    pauseAllTimers();
    gameOverOverlay.style.display = 'flex';
    finalScoreEl.textContent = `Final Score: ${playerScore}`;
    gameOverBannerImg.src = GAME_OVER_BANNER_URL;
    gameOverBannerImg.style.display = 'block';
}

let refillIntervalId = null;
function startRefilling(){ if(isGamePaused) return; if(refillIntervalId) return; startWhiteNoise(); refillIntervalId = setInterval(()=>{ if(isGamePaused) return; const prev = waterLevel; waterLevel = Math.min(100, waterLevel + 2); updateDisplay(); if(prev < 100 && waterLevel === 100){ waterRefillCount += 1; checkAchievements(); clearTimeout(waterPauseTimeout); waterNextTimer.clear(); waterPauseTimeout = setTimeout(()=>{ if(!isGamePaused && !waterInvulTimeout) restartWaterInterval(); },4000); } },100); }
function stopRefilling(){ if(refillIntervalId){ clearInterval(refillIntervalId); refillIntervalId = null; } stopWhiteNoise(); }

waterBowl.addEventListener('mousedown', (e)=>{ e.preventDefault(); startRefilling(); });
document.addEventListener('mouseup', ()=>{ stopRefilling(); });
waterBowl.addEventListener('touchstart', (e)=>{ e.preventDefault(); startRefilling(); });
document.addEventListener('touchend', ()=>{ stopRefilling(); });

function triggerUltimateSnackBuff(){ if(state.ultimateBuffActive) return; state.ultimateBuffActive = true; state.bpsBuffMultiplier = 3; updateDisplay(); setTimeout(()=>{ state.ultimateBuffActive = false; state.bpsBuffMultiplier = 1; updateDisplay(); },5000); }

let goldenSpawnTimer = new PausableTimer();
let goldenVisibleTimer = null; let goldenElem = null;
function scheduleNextGoldenSpawn(){ if(isGamePaused) return; const delay = randomInt(25,75); goldenSpawnTimer.start(delay*1000, ()=>{ if(isGamePaused) return; showGoldenBean(); }); }
function showGoldenBean(){ if(goldenElem) { goldenElem.remove(); goldenElem = null; }
  goldenElem = document.createElement('img'); goldenElem.src = GOLDEN_BEAN_IMG; goldenElem.className = 'golden-bean'; const vw = Math.max(200, window.innerWidth - 200); const vh = Math.max(200, window.innerHeight - 200); const x = randomInt(80, vw - 80); const y = randomInt(120, vh - 120); goldenElem.style.left = x + 'px'; goldenElem.style.top = y + 'px'; document.body.appendChild(goldenElem);
  goldenElem.addEventListener('click', ()=>{ goldenBeans += 1; goldenCaughtCount += 1; checkAchievements(); updateScoreboard(); if(goldenElem){ goldenElem.remove(); goldenElem = null; } clearTimeout(goldenVisibleTimer); scheduleNextGoldenSpawn(); });
  goldenVisibleTimer = setTimeout(()=>{ if(goldenElem){ goldenElem.remove(); goldenElem = null; } scheduleNextGoldenSpawn(); },1000);
}

achvBtn.addEventListener('click', ()=>{ achvOverlay.style.display = 'flex'; isGamePaused = true; pauseAllTimers(); renderAchievementsList(); });
closeAchvBtn.addEventListener('click', ()=>{ achvOverlay.style.display='none'; isGamePaused = false; resumeAllTimers(); });

exchangeOneBtn.addEventListener('click', ()=>{ if(goldenBeans <= 0) return; goldenBeans -= 1; const beansValue = Math.floor(currentPPS() * 60); addJellyBeans(beansValue); updateScoreboard(); });
exchangeAllBtn.addEventListener('click', ()=>{ if(goldenBeans <= 0) return; const count = goldenBeans; goldenBeans = 0; const beansValue = Math.floor(currentPPS() * 60 * count); addJellyBeans(beansValue); updateScoreboard(); });

// NOWA, ZBALANSOWANA PULA NAGRÓD W RULETCE
const lotteryCategories = [
  // POZYTYWNE (razem 50%)
  { prize: 'jackpot',     text: 'JACKPOT! +5 Golden Beans',         type: 'jackpot',   weight: 2 },
  { prize: 'sale',        text: 'SALE! -50% on next 3 upgrades',    type: 'positive',  weight: 5 },
  { prize: 'superClaw',   text: 'Super-Claw! x3 BPC for 10s',       type: 'positive',  weight: 8 },
  { prize: 'waterBonus',  text: 'Water Bonus! Full & immune for 20s', type: 'positive',  weight: 8 },
  { prize: 'snackBuff',   text: 'Free Snack Buff! x3 BPS for 5s',     type: 'positive',  weight: 7 },
  { prize: 'mediumBeans', text: 'Medium Jelly Bean Pack',           type: 'positive',  weight: 10 },
  { prize: 'smallBeans',  text: 'Small Jelly Bean Pack',            type: 'positive',  weight: 10 },

  // NEUTRALNY (10%)
  { prize: 'nothing',     text: 'Nothing...',                       type: 'neutral',   weight: 10 },

  // NEGATYWNE (razem 40%)
  { prize: 'mafia',       text: 'Oh no! The Mafia arrives now!',    type: 'negative',  weight: 10 },
  { prize: 'loseWater',   text: 'Drought! Lose 50% of your water',  type: 'negative',  weight: 8 },
  { prize: 'marketBlock', text: 'Market Block! No upgrades for 15s',type: 'negative',  weight: 10 },
  { prize: 'lazyDay',     text: 'Lazy Day! BPS halved for 30s',     type: 'negative',  weight: 7 },
  { prize: 'softPaws',    text: 'Soft Paws! BPC set to 1 for 10s',   type: 'negative',  weight: 5 }
];

// NOWA FUNKCJA POMOCNICZA DLA UNOSZĄCEGO SIĘ TEKSTU
function showFloatingText(text, element) {
    const container = document.getElementById('floatingTextContainer');
    if (!container) return;

    const textEl = document.createElement('span');
    textEl.className = 'floating-text';
    textEl.textContent = text;
    
    container.appendChild(textEl);

    setTimeout(() => {
        textEl.remove();
    }, 2000); // Czas życia tekstu (2 sekundy)
}
// ZMIANA: Uwzględnia teraz mnożnik dla BPC (Super-Pazur / Miękkie Poduszeczki)
function currentPPC() {
  const base = state.basePPC + (state.moreLevel * 1) + (state.pillowLevel * 5);
  if (ppcBuffMultiplier !== 1 && state.activeEvents['softPaws']) {
      return 1; // Jeśli działają "Miękkie Poduszeczki", BPC to zawsze 1
  }
  return base * ppcBuffMultiplier;
}

// ZMIANA: Uwzględnia teraz efekt "Leniwego Dnia"
function currentPPS() {
  const base = (state.floorLevel * 1) + (state.kikiLevel * 6) + (state.snackLevel * 100);
  return Math.floor(base * state.bpsBuffMultiplier);
}

// ZMIANA: Uwzględnia teraz "Wyprzedaż"
function scaledCost(base, level, isClickUpgrade, key) {
  let mult = isClickUpgrade ? state.clickCostMultiplier : state.autoCostMultiplier;
  if (key === 'snack') mult = 1.35;
  let finalCost = Math.ceil(base * Math.pow(mult, level));
  
  // Aplikuje zniżkę, jeśli jest aktywna
  if (salePurchasesLeft > 0) {
    finalCost = Math.ceil(finalCost * 0.5);
  }
  
  return finalCost;
}
// NOWA, KOMPLETNA LOGIKA RULETKI I NAGRÓD
const lotteryButton = document.getElementById('lotteryButton');
const lotteryDisplay = document.getElementById('lotteryDisplay');
let isSpinning = false;
let finalPrize = null;
let shuffleIntervalId = null;

lotteryButton.addEventListener('click', () => {
    // Pierwsze kliknięcie - START
    if (!isSpinning) {
        if (goldenBeans <= 0 || isGamePaused) return;

        goldenBeans -= 1;
        updateScoreboard();

        isSpinning = true;
        lotteryButton.src = 'https://i.postimg.cc/L8r93yTM/loteria-wlaczona.png';
        lotteryButton.classList.add('disabled');

        // Losujemy wynik na samym początku
        finalPrize = weightedRandom(lotteryCategories);

        // Animacja tasowania
        shuffleIntervalId = setInterval(() => {
            const randomPrize = lotteryCategories[randomInt(0, lotteryCategories.length - 1)];
            lotteryDisplay.textContent = randomPrize.text;
            lotteryDisplay.className = 'neutral';
        }, 50);

        // Odblokuj przycisk, aby można było zatrzymać
        setTimeout(() => {
            lotteryButton.classList.remove('disabled');
        }, 500);

    // Drugie kliknięcie - STOP
    } else {
        isSpinning = false;
        lotteryButton.classList.add('disabled');

        clearInterval(shuffleIntervalId);

        // Efekt zwalniania
        setTimeout(() => { lotteryDisplay.textContent = lotteryCategories[randomInt(0, lotteryCategories.length - 1)].text; }, 150);
        setTimeout(() => { lotteryDisplay.textContent = lotteryCategories[randomInt(0, lotteryCategories.length - 1)].text; }, 350);
        setTimeout(() => {
            if (finalPrize.prize === 'nothing') {
                lotteryDisplay.textContent = 'Nothing...';
                lotteryDisplay.className = 'neutral';
            } else {
                lotteryDisplay.textContent = finalPrize.text;
                lotteryDisplay.className = finalPrize.type;
            }

            // Logika nagrody/kary
            handleLotteryWin(finalPrize.prize);

            lotteryButton.src = 'https://i.postimg.cc/brQkqDwZ/loteria-wylaczona.png';

            // Reset przycisku po chwili, aby można było zagrać ponownie
            setTimeout(() => {
                lotteryButton.classList.remove('disabled');
            }, 1000);
        }, 600);
    }
});


function handleLotteryWin(prize) {
  let val;
  switch (prize) {
    case 'smallBeans':
      val = Math.floor(currentPPS() * 15 + 25);
      addJellyBeans(val);
      showFloatingText(`+${val}`, scoreEl);
      break;
    case 'mediumBeans':
      val = Math.floor(currentPPS() * 35 + 75);
      addJellyBeans(val);
      showFloatingText(`+${val}`, scoreEl);
      break;
    case 'waterBonus':
      waterLevel = 100;
      if (waterInvulTimeout) clearTimeout(waterInvulTimeout);
      waterNextTimer.clear();
      waterInvulTimeout = setTimeout(() => { waterInvulTimeout = null; restartWaterInterval(); }, 20000);
      break;
    case 'snackBuff':
      triggerUltimateSnackBuff();
      break;
    case 'jackpot':
      goldenBeans += 5;
      break;
    case 'nothing':
      // Nic się nie dzieje
      break;
    case 'loseBeans':
      state.score = 0;
      break;
    case 'loseWater':
      waterLevel = Math.max(0, waterLevel - 50);
      break;
    case 'marketBlock':
      isMarketBlocked = true;
      showTempBanner('Market blocked! You cannot buy upgrades for 15s.');
      setTimeout(() => { isMarketBlocked = false; showTempBanner('The market is open again!'); }, 15000);
      break;
    case 'mafia':
      mafiaArrive();
      break;
    case 'sale':
      salePurchasesLeft = 3;
      showTempBanner('SALE! Your next 3 upgrades are 50% off!');
      break;
    case 'superClaw':
      ppcBuffMultiplier = 3;
      state.activeEvents['superClaw'] = true;
      showTempBanner('Super-Claw! x3 BPC for 10s!');
      setTimeout(() => { ppcBuffMultiplier = 1; delete state.activeEvents['superClaw']; }, 10000);
      break;
    case 'lazyDay':
      state.bpsBuffMultiplier = 0.5;
      state.activeEvents['lazyDay'] = true;
      showTempBanner('Lazy Day! BPS halved for 30s.');
      setTimeout(() => { state.bpsBuffMultiplier = 1; delete state.activeEvents['lazyDay']; }, 30000);
      break;
    case 'softPaws':
      state.activeEvents['softPaws'] = true;
      showTempBanner('Soft Paws! BPC set to 1 for 10s.');
      setTimeout(() => { delete state.activeEvents['softPaws']; }, 10000);
      break;
  }
  updateDisplay();
}


function showTempBanner(text){ const b = document.createElement('div'); b.className='event-banner'; b.textContent = text; eventBanners.appendChild(b); setTimeout(()=>{ b.remove(); },4000); }

let kornelEventTimer = new PausableTimer();

// --- Start services ---
startPassiveIncome();
startMafiaTimer(); 
scheduleNextEvent(); 
startWaterDepletion();
scheduleNextGoldenSpawn();

renderAchievementsList();
updateDisplay();
pusheenImg.setAttribute('tabindex','0');
pusheenImg.addEventListener('keydown',(e)=>{ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); pusheenImg.click(); } });