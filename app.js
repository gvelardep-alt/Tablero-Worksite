/* =========================================================
   CONFIG — reemplaza cotizadorUrl con tus enlaces reales
   ========================================================= */
const CONFIG = {
  vehicular: {
    label: "Seguro Vehicular",
    videoUrl: "videos/vehicular.mp4",                 // (se incrusta automáticamente)
    cotizadorUrl: "#"             // ej: "https://tudominio.com/cotizar/vehicular"
  },
  hogar: {
    label: "Seguro Domiciliario",
    videoUrl: "videos/domiciliario.mp4",                 // (se incrusta automáticamente)
    cotizadorUrl: "#"             // ej: "https://tudominio.com/cotizar/hogar"
  }
};

/* ---------- Navegación entre vistas ---------- */
const app = document.getElementById('app');
const views = ['home','board','stage','quote'];
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;

function show(view){
  views.forEach(v => document.getElementById(v).hidden = (v !== view));
  app.dataset.view = view;
  window.scrollTo(0,0);
}

document.getElementById('open-board').addEventListener('click', e => { e.preventDefault(); show('board'); });

document.querySelectorAll('[data-go]').forEach(b =>
  b.addEventListener('click', () => {
    stopVideo();
    resetQuote();
    show(b.dataset.go);
  })
);

/* ---------- Video con audio automático + gate obligatorio ---------- */
const player    = document.getElementById('player');
const bigplay   = document.getElementById('bigplay');
const stageMsg  = document.getElementById('stage-msg');
const stageLabel= document.getElementById('stage-label');
let currentKey = null;

// Precarga el video al apretar (antes del click) para que "Ver y cotizar"
// reproduzca de inmediato con audio, sin necesitar un segundo toque.
document.querySelectorAll('.product').forEach(card => {
  card.addEventListener('pointerdown', () => preload(card.dataset.product));
  card.addEventListener('click', () => playProduct(card.dataset.product));
});

function preload(key){
  const want = CONFIG[key].videoUrl;
  if (player.getAttribute('src') !== want){
    player.onerror = null;          // evita falsos errores durante la precarga
    player.src = want;
    player.load();
  }
}

function playProduct(key){
  currentKey = key;
  const cfg = CONFIG[key];
  stageLabel.textContent = "Reproduciendo · " + cfg.label;
  stageMsg.textContent = "";
  bigplay.hidden = true;
  show('stage');

  if (player.getAttribute('src') !== cfg.videoUrl){
    player.src = cfg.videoUrl;     // si no alcanzó a precargarse, lo asigna ahora
  }
  player.muted = false;
  try { player.currentTime = 0; } catch(e){}
  player.onended = () => goToQuote(key);          // única vía hacia el cotizador
  player.onerror = onVideoError;

  // Intento de reproducir con audio dentro del gesto del click
  const p = player.play();
  if (p && p.then){
    p.then(() => { bigplay.hidden = true; })
     .catch(() => { bigplay.hidden = false; });   // bloqueado: mostrar play central
  }
}

// Play manual (gesto directo del usuario → audio garantizado)
bigplay.addEventListener('click', () => {
  player.muted = false;
  player.play().then(() => { bigplay.hidden = true; })
               .catch(() => { bigplay.hidden = false; });
});

function onVideoError(){
  // No avanza al cotizador si el video no corre
  bigplay.hidden = true;
  stageMsg.innerHTML = 'No se pudo cargar el video. ' +
    '<button class="retry" id="retry">Reintentar</button>';
  document.getElementById('retry').addEventListener('click', () => playProduct(currentKey));
}

function stopVideo(){
  try { player.pause(); player.removeAttribute('src'); player.load(); } catch(e){}
  bigplay.hidden = true;
  stageMsg.textContent = "";
}

/* ---------- Cotizador en la misma página (slide-up) ---------- */
const frame   = document.getElementById('quote-frame');
const ph      = document.getElementById('quote-ph');
const phTitle = document.getElementById('quote-ph-title');
const phText  = document.getElementById('quote-ph-text');
const qName   = document.getElementById('quote-name');
const qDot    = document.getElementById('quote-dot');
const quote   = document.getElementById('quote');

function goToQuote(key){
  stopVideo();
  const cfg = CONFIG[key];
  const isVeh = key === 'vehicular';

  qName.textContent = cfg.label;
  qDot.className = 'dot ' + (isVeh ? 'veh' : 'hog');

  const bHog=document.getElementById('quoter-hogar');
  const bVeh=document.getElementById('quoter-veh');
  if(bHog) bHog.hidden=true; if(bVeh) bVeh.hidden=true;
  if (key === 'hogar'){
    frame.style.display='none'; frame.removeAttribute('src'); ph.hidden=true;
    bHog.hidden=false; if(window.QHogar) QHogar.reset();
  } else if (key === 'vehicular'){
    frame.style.display='none'; frame.removeAttribute('src'); ph.hidden=true;
    bVeh.hidden=false; if(window.QVeh) QVeh.reset();
  } else if (cfg.cotizadorUrl && cfg.cotizadorUrl !== '#'){
    ph.hidden=true; frame.style.display='block'; frame.src=cfg.cotizadorUrl;
  } else {
    frame.style.display='none'; frame.removeAttribute('src');
    ph.hidden=false; phTitle.textContent="Cotizador de "+cfg.label;
    phText.innerHTML='Aquí se cargará tu cotizador dentro de esta misma página.';
  }

  // Deslizamiento hacia arriba sobre la pantalla del video
  quote.hidden = false;
  app.dataset.view = 'quote';
  if (reduce){
    quote.classList.add('up');
    document.getElementById('stage').hidden = true;
    window.scrollTo(0,0);
  } else {
    quote.classList.remove('up');
    requestAnimationFrame(() => requestAnimationFrame(() => quote.classList.add('up')));
    quote.addEventListener('transitionend', function done(){
      quote.removeEventListener('transitionend', done);
      document.getElementById('stage').hidden = true;
      window.scrollTo(0,0);
    });
  }
}

function resetQuote(){
  quote.classList.remove('up');
  quote.style.transform = '';
  frame.removeAttribute('src');
  const b=document.getElementById('quoter-hogar'); if(b) b.hidden=true;
  const bv=document.getElementById('quoter-veh'); if(bv) bv.hidden=true;
}
