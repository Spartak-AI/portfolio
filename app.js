/* SPARTAK LAB · поведение страницы */
(() => {
  const S = window.SITE || {};
  const reduzir = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const celular = () => matchMedia("(max-width: 760px)").matches;
  const lim = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ── WhatsApp ───────────────────────────────────────── */
  const num = String((S.whatsapp && S.whatsapp.numero) || "").replace(/\D/g, "");
  const wa = (txt) => `https://wa.me/${num}?text=${encodeURIComponent(txt || (S.whatsapp && S.whatsapp.mensagem) || "")}`;
  const prepararWhats = (raiz = document) => raiz.querySelectorAll(".js-whats").forEach((a) => {
    a.href = wa(a.dataset.msg);
    a.target = "_blank";
    a.rel = "noopener";
  });

  const ease = (t) => t * t * (3 - 2 * t);
  const seg = (v, a, b) => lim((v - a) / (b - a));
  const mix = (a, b, t) => a + (b - a) * t;

  /* ── 0 · Первый экран: веер окон с настоящими сайтами ─ */
  const abertura = document.querySelector(".abertura");
  const leque = document.querySelector("[data-leque]");
  if (abertura && leque) {
    const lista = (S.casos || []).slice(0, 6);
    leque.innerHTML = lista.map((c, i) => `
      <div class="mini" style="z-index:${20 - i}">
        <div class="janela-barra"><span class="janela-pontos"><i></i><i></i><i></i></span><span class="janela-url">${esc(c.url.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</span></div>
        <div class="mini-tela"><video muted loop playsinline preload="none" poster="${esc(c.poster)}"><source src="${esc(c.video)}" type="video/mp4"></video></div>
      </div>`).join("");
    const minis = [...leque.querySelectorAll(".mini")];
    const videos = minis.map((m) => m.querySelector("video"));
    const momentos = [...abertura.querySelectorAll(".momento")];
    const duelo = abertura.querySelector("[data-duelo]");
    const vDuelo = duelo && duelo.querySelector("video");
    const n = minis.length;
    let A = [], B = [], mw = 0, mh = 0;

    const medir = () => {
      const W = abertura.clientWidth, H = innerHeight, cel = celular();
      mw = cel ? W * 0.8 : Math.min(W * 0.42, 640);
      mh = mw * 562 / 1280 + 28;
      leque.style.setProperty("--mw", mw + "px");
      // «до/после» и вопрос под ним — одной группой по центру экрана
      const pd = abertura.querySelector(".momento--duelo");
      if (duelo && pd) {
        const topoH = (document.querySelector(".topo") || {}).offsetHeight || 0;
        const gap = cel ? 28 : 36;
        const total = duelo.offsetHeight + gap + pd.offsetHeight;
        const ini = topoH + Math.max(8, (H - topoH - total) / 2);
        duelo.style.top = ini + "px";
        pd.style.top = (ini + duelo.offsetHeight + gap) + "px";
        pd.style.bottom = "auto";
      }
      A = []; B = [];
      // на телефоне окна стоят в свободном месте над текстом, а не прижаты к верху
      const tH = (document.querySelector(".topo") || {}).offsetHeight || 0;
      const passo = mh * 0.56 + 12;
      // окна + текст под ними — одной группой по центру экрана
      const grupo = (altura, m) => {
        if (!cel || !m) return null;
        const gap = 28, ph = m.offsetHeight, total = altura + gap + ph;
        const ini = tH + Math.max(12, (H - tH - total) / 2);
        m.style.top = (ini + altura + gap) + "px"; m.style.bottom = "auto";
        return ini + altura / 2;
      };
      momentos.slice(0, 2).forEach((m) => { if (!cel) { m.style.top = ""; m.style.bottom = ""; } });
      const hA = mh + 42, hB = 2 * passo + mh * 0.56;
      const cA = (grupo(hA, momentos[0]) || 0) + 21;
      const cB = grupo(hB, momentos[1]) || 0;
      for (let i = 0; i < n; i++) {
        // начало: колода окон, первое сверху
        A.push(cel
          ? { x: W * 0.5 + i * 7, y: cA - i * 14, r: -2 + i * 2, s: 1 - i * 0.04, o: i < 4 ? 1 : 0 }
          : { x: W * 0.7 + i * 26, y: H * 0.5 - i * 26, r: -3 + i * 2.6, s: 1 - i * 0.035, o: 1 });
        // конец: окна разъезжаются в стену из сайтов
        const c = cel ? i % 2 : i % 3, l = cel ? Math.floor(i / 2) : Math.floor(i / 3);
        B.push(cel
          ? { x: W * (0.27 + c * 0.46), y: cB + (l - 1) * passo, r: 0, s: 0.56, o: 0.95 }
          : { x: W * (0.2 + c * 0.3), y: H * (0.3 + l * 0.4), r: (c - 1) * 1.5, s: 0.6, o: 0.95 });
      }
    };
    const progresso = () => {
      const r = abertura.getBoundingClientRect();
      return lim(-r.top / ((abertura.offsetHeight - innerHeight) || 1));
    };
    const desenhar = (p) => {
      const t = ease(seg(p, 0.06, 0.62));
      minis.forEach((m, i) => {
        const a = A[i], b = B[i], d = ease(lim(t * 1.25 - i * 0.05));
        const x = mix(a.x, b.x, d), y = mix(a.y, b.y, d), r = mix(a.r, b.r, d), s = mix(a.s, b.s, d);
        const o = mix(a.o, b.o, d) * (1 - ease(seg(p, 0.6, 0.72)));
        m.style.transform = `translate(${(x - mw / 2).toFixed(1)}px, ${(y - mh / 2).toFixed(1)}px) rotate(${r.toFixed(2)}deg) scale(${s.toFixed(3)})`;
        m.style.opacity = o.toFixed(3);
      });
      if (duelo) {
        const k = ease(seg(p, 0.66, 0.8));
        duelo.style.opacity = k.toFixed(3);
        duelo.style.transform = `translateX(-50%) translateY(${((1 - k) * 50).toFixed(1)}px)`;
        if (vDuelo) {
          if (k > 0.05 && !reduzir) {
            if (vDuelo.preload === "none") { vDuelo.preload = "auto"; vDuelo.load(); }
            if (vDuelo.paused) vDuelo.play().catch(() => {});
          } else if (!vDuelo.paused) vDuelo.pause();
        }
      }
      momentos.forEach((m) => {
        const de = +m.dataset.de, ate = +m.dataset.ate;
        m.classList.toggle("ativo", p >= de && (p < ate || ate >= 1));
      });
      abertura.classList.toggle("andou", p > 0.02);
    };
    let ultimo = -1, visivel = true;
    const tick = () => {
      if (visivel) { const p = progresso(); if (Math.abs(p - ultimo) > 0.0005) { desenhar(p); ultimo = p; } }
      requestAnimationFrame(tick);
    };
    // видео: на компьютере играют все окна, на телефоне — только верхнее
    new IntersectionObserver(([e]) => {
      visivel = e.isIntersecting;
      videos.forEach((v, i) => {
        if (!visivel || reduzir || (celular() && i > 0)) return v.pause();
        if (v.preload === "none") { v.preload = "auto"; v.load(); }
        v.play().catch(() => {});
      });
    }).observe(abertura);
    addEventListener("resize", () => { medir(); desenhar(progresso()); });
    addEventListener("load", () => { medir(); desenhar(progresso()); });
    medir();
    desenhar(progresso());
    if (reduzir) addEventListener("scroll", () => desenhar(progresso()), { passive: true });
    else requestAnimationFrame(tick);
  }

  const topoEl = document.querySelector(".topo");
  const medirTopo = () => topoEl && document.documentElement.style.setProperty("--topo-h", topoEl.offsetHeight + "px");
  addEventListener("resize", medirTopo);
  medirTopo();

  /* ── 02 · Как мы работаем: горизонтальная лента ────── */
  const etapas = document.querySelector(".etapas");
  if (etapas) {
    const trilho = etapas.querySelector("[data-trilho]");
    const cards = [...trilho.querySelectorAll(".etapa")];
    const barra = etapas.querySelector("[data-prog]");
    const cont = etapas.querySelector("[data-cont]");
    const video = etapas.querySelector(".vis-lanc video");
    const n = cards.length;
    let dist = 0, atualE = -1, naTela = false;
    const medir = () => {
      const ult = cards[n - 1];
      const pad = parseFloat(getComputedStyle(trilho).paddingLeft) || 0;
      dist = Math.max(0, ult.offsetLeft + ult.offsetWidth + pad - trilho.clientWidth);
      etapas.style.height = Math.round(innerHeight * 1.5 + dist * 1.1) + "px";
    };
    const tocar = () => {
      if (!video) return;
      if (naTela && atualE === n - 1 && !reduzir) {
        if (video.preload === "none") { video.preload = "auto"; video.load(); }
        video.play().catch(() => {});
      } else video.pause();
    };
    const desenhar = () => {
      const p = lim(-etapas.getBoundingClientRect().top / ((etapas.offsetHeight - innerHeight) || 1));
      const t = seg(p, 0.08, 0.92);
      trilho.style.transform = `translateX(${(-dist * t).toFixed(1)}px)`;
      barra.style.transform = `scaleX(${t.toFixed(4)})`;
      const i = Math.round(t * (n - 1));
      if (i !== atualE) {
        atualE = i;
        cards.forEach((c, k) => {
          c.classList.toggle("ativo", k === i);
          const v = c.querySelector(".vis");
          if (v) v.classList.toggle("ativo", k === i);
        });
        cont.textContent = `${String(i + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;
        tocar();
      }
    };
    new IntersectionObserver(([e]) => { naTela = e.isIntersecting; tocar(); }).observe(etapas);
    addEventListener("scroll", desenhar, { passive: true });
    addEventListener("resize", () => { medir(); desenhar(); });
    addEventListener("load", () => { medir(); desenhar(); });
    medir();
    desenhar();
  }

  /* ── 01 · Работы ────────────────────────────────────── */
  const casos = S.casos || [];
  const pilha = document.querySelector("[data-casos]");
  if (pilha) {
    pilha.innerHTML = casos.map((c, i) => {
      const dominio = c.url ? c.url.replace(/^https?:\/\//, "").replace(/\/$/, "") : "скоро";
      const msg = `Здравствуйте! Хочу сайт для ниши «${c.nicho}», как ${c.nome}.`;
      return `
      <article class="caso" id="caso-${esc(c.id)}" style="--i:${i}">
        <div class="janela">
          <div class="janela-barra" aria-hidden="true">
            <span class="janela-pontos"><i></i><i></i><i></i></span>
            <span class="janela-url">${esc(dominio)}</span>
          </div>
          <div class="janela-tela">
            <video muted loop playsinline preload="none" poster="${esc(c.poster)}" aria-label="Запись прокрутки сайта ${esc(c.nome)}">
              <source src="${esc(c.video)}" type="video/mp4">
            </video>
          </div>
        </div>
        <div class="caso-info">
          <span class="caso-nicho">${String(i + 1).padStart(2, "0")} · ${esc(c.nicho)}</span>
          <h3>${esc(c.nome)}<span class="caso-demo">демо</span></h3>
          <dl class="caso-dl">
            <div><dt>Задача клиента (JTBD)</dt><dd>${esc(c.jtbd)}</dd></div>
            <div><dt>Что закрывает сайт (CJM)</dt><dd>${esc(c.cjm)}</dd></div>
          </dl>
          <div class="caso-acoes">
            ${c.url ? `<a class="botao botao--linha" href="${esc(c.url)}" target="_blank" rel="noopener">Открыть сайт ↗</a>` : ""}
            <a class="botao botao--escuro js-whats" href="#contato" data-msg="${esc(msg)}">Хочу такой же</a>
          </div>
        </div>
      </article>`;
    }).join("");

    // видео играет, только пока карточка на экране
    const vio = new IntersectionObserver((es) => es.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting) {
        if (v.preload === "none") { v.preload = "auto"; v.load(); }
        if (!reduzir) v.play().catch(() => {});
      } else v.pause();
    }), { threshold: 0.25 });
    pilha.querySelectorAll("video").forEach((v) => vio.observe(v));
  }

  /* ── 03 · Ниши ──────────────────────────────────────── */
  const lista = document.querySelector("[data-nichos]");
  const previa = document.querySelector("[data-previa]");
  if (lista) {
    lista.innerHTML = casos.map((c) => `<li><a href="#caso-${esc(c.id)}" data-poster="${esc(c.poster)}">${esc(c.nichoCurto || c.nicho)} <small>${esc(c.nome)} · ${esc(c.nicho)}</small></a></li>`).join("");
    const links = [...lista.querySelectorAll("a")];
    const ativar = (a) => {
      links.forEach((l) => l.classList.toggle("ativo", l === a));
      if (previa && a) { previa.style.opacity = 0; setTimeout(() => { previa.src = a.dataset.poster; previa.style.opacity = 1; }, 120); }
    };
    links.forEach((a) => { a.addEventListener("mouseenter", () => ativar(a)); a.addEventListener("focus", () => ativar(a)); });
    if (links[0]) { links[0].classList.add("ativo"); if (previa) previa.src = links[0].dataset.poster; }
  }

  /* ── 05 · Форма → WhatsApp ──────────────────────────── */
  const sel = document.querySelector("[data-opcoes]");
  if (sel) casos.forEach((c) => sel.insertAdjacentHTML("beforeend", `<option>${esc(c.nome)} — ${esc(c.nicho)}</option>`));
  const form = document.querySelector(".form");
  if (form) {
    const status = form.querySelector(".form-status");
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      let ok = true;
      form.querySelectorAll("[required]").forEach((c) => {
        const bom = c.value.trim().length > 1;
        c.closest(".campo").classList.toggle("erro", !bom);
        if (!bom) ok = false;
      });
      if (!ok) { status.textContent = "Заполните имя и пару слов о бизнесе."; return; }
      const d = Object.fromEntries(new FormData(form));
      const linhas = [
        "Здравствуйте! Хочу себе такой же сайт.",
        `Меня зовут: ${d.nome.trim()}`,
        `Бизнес: ${d.negocio.trim()}`,
        d.exemplo ? `Понравился сайт: ${d.exemplo}` : "",
        d.extra && d.extra.trim() ? `Город / сайт: ${d.extra.trim()}` : "",
      ].filter(Boolean);
      status.textContent = "Открываем WhatsApp…";
      window.open(wa(linhas.join("\n")), "_blank", "noopener");
    });
  }

  prepararWhats();

  /* ── Шапка, кнопка WhatsApp, появление ──────────────── */
  const topo = document.querySelector(".topo");
  const whats = document.querySelector(".whats");
  let contatoNaTela = false;
  const aoRolar = () => {
    topo && topo.classList.toggle("rolou", scrollY > 30);
    whats && whats.classList.toggle("visivel", scrollY > innerHeight * 0.8 && !contatoNaTela);
  };
  const contato = document.querySelector(".contato");
  if (contato) new IntersectionObserver(([e]) => { contatoNaTela = e.isIntersecting; aoRolar(); }, { rootMargin: "0px 0px -30% 0px" }).observe(contato);
  addEventListener("scroll", aoRolar, { passive: true });
  aoRolar();

  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("visto"); io.unobserve(e.target); }
  }), { threshold: 0.15 });
  document.querySelectorAll(".secao-cabeca, .entrega-lista li, .contato-grade > *").forEach((el) => { el.classList.add("revelar"); io.observe(el); });
  // страховка: если что-то не сработало, через 4 с показываем всё
  setTimeout(() => document.querySelectorAll(".revelar").forEach((el) => el.classList.add("visto")), 4000);
  document.querySelectorAll("[data-ano]").forEach((el) => (el.textContent = new Date().getFullYear()));
})();
