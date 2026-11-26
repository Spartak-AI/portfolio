/* SPARTAK LAB — первый экран как в референсе: облёт камеры, шар из сайтов,
   разлёт, сайт летит в камеру и возвращается. Всё это — один сгенерированный ролик,
   нарезанный на кадры; кадры листает прокрутка (как в бургерной KÖMIR).
   Включается флагом heroNovo в config.js (иначе работает старый экран из app.js). */
(() => {
  const S = window.SITE || {};
  const raiz = document.querySelector("[data-eu]");
  if (!raiz) return;
  if (!S.heroNovo) { raiz.remove(); return; }
  raiz.hidden = false;

  const reduzir = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lim = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  const SEQ = { pasta: "assets/eu/seq/", n: 142, ext: "webp", ar: 720 / 1296 };
  const tela = raiz.querySelector("[data-quadros]");
  const fundo = raiz.querySelector("[data-fundo]");
  const ctx = tela.getContext("2d");
  const ctxF = fundo.getContext("2d");
  const momentos = [...raiz.querySelectorAll(".momento")];

  // кадры: сначала первые 24 (чтобы экран сразу ожил), затем остальные по порядку
  const quadros = new Array(SEQ.n);
  const url = (i) => `${SEQ.pasta}${String(i + 1).padStart(3, "0")}.${SEQ.ext}`;
  let W = 0, H = 0, ultimoQ = -1, alvoQ = 0;
  const carregar = (i) => new Promise((ok) => {
    const im = new Image(); im.decoding = "async";
    im.onload = im.onerror = () => { quadros[i] = im; ok(); if (i === alvoQ) desenhar(true); };
    im.src = url(i);
  });

  const medir = () => {
    W = raiz.clientWidth; H = innerHeight;
    const dpr = Math.min(2, devicePixelRatio || 1);
    // кадр вписан по высоте; на узком экране — заполняет ширину (обрезка по бокам)
    let ch = H, cw = ch * SEQ.ar;
    if (cw < W && W / H < 0.75) { cw = W; ch = cw / SEQ.ar; }
    tela.style.cssText = `width:${cw}px;height:${ch}px;left:${(W - cw) / 2}px;top:${(H - ch) / 2}px`;
    tela.width = Math.round(cw * dpr); tela.height = Math.round(ch * dpr);
    // по бокам на широком экране — тот же кадр, размытый, во всю ширину
    const largo = cw < W - 2;
    fundo.hidden = !largo;
    if (largo) { fundo.width = 64; fundo.height = Math.round(64 * H / W); }
    ultimoQ = -1;
  };

  const progresso = () => lim(-raiz.getBoundingClientRect().top / ((raiz.offsetHeight - innerHeight) || 1));
  function desenhar(forca) {
    const p = reduzir ? 0.22 : progresso();
    alvoQ = Math.round(p * (SEQ.n - 1));
    // ближайший уже загруженный кадр
    let q = alvoQ;
    for (let d = 0; d < SEQ.n && !(quadros[q] && quadros[q].naturalWidth); d++) q = lim(alvoQ - d, 0, SEQ.n - 1);
    const im = quadros[q];
    if (im && im.naturalWidth && (q !== ultimoQ || forca)) {
      ctx.drawImage(im, 0, 0, tela.width, tela.height);
      if (!fundo.hidden) {
        const fw = fundo.width, fh = fundo.height, s = Math.max(fw / im.naturalWidth, fh / im.naturalHeight);
        ctxF.drawImage(im, (fw - im.naturalWidth * s) / 2, (fh - im.naturalHeight * s) / 2, im.naturalWidth * s, im.naturalHeight * s);
      }
      ultimoQ = q;
    }
    momentos.forEach((m) => {
      const de = +m.dataset.de, ate = +m.dataset.ate;
      m.classList.toggle("ativo", p >= de && (p < ate || ate >= 1));
    });
  }

  let pendente = false;
  addEventListener("scroll", () => { if (!pendente) { pendente = true; requestAnimationFrame(() => { pendente = false; desenhar(); }); } }, { passive: true });
  addEventListener("resize", () => { medir(); desenhar(true); });
  medir();
  desenhar(true);
  (async () => {
    const primeiros = Math.min(24, SEQ.n);
    await Promise.all(Array.from({ length: primeiros }, (_, i) => carregar(i)));
    for (let i = primeiros; i < SEQ.n; i += 6) await Promise.all(Array.from({ length: Math.min(6, SEQ.n - i) }, (_, k) => carregar(i + k)));
  })();
})();
