/* =========================================================
   DELLI Detailing Lab — конфигуратор тонировки (Vanilla JS)
   ========================================================= */
(() => {
  "use strict";

  /* ---------- Конфигурация ---------- */

  // Шаги ползунка (позиции распределены равномерно, как в макете)
  const TINT_STEPS = [5, 20, 33, 50, 70, 95];

  // Изображения для каждого ракурса. Замените пути на свои фото:
  // car — фото автомобиля, glass — маска стёкол того же размера.
  const ANGLES = {
    side:     { label: "Сбоку",   car: "assets/car-ferrari.jpg", glass: "assets/car-ferrari-glass.png" },
    front:    { label: "Спереди", car: "assets/car-ferrari.jpg", glass: "assets/car-ferrari-glass.png" },
    rear:     { label: "Сзади",   car: "assets/car-ferrari.jpg", glass: "assets/car-ferrari-glass.png" },
    interior: { label: "Салон",   car: "assets/car-ferrari.jpg", glass: "assets/car-ferrari-glass.png" },
  };

  // Оттенок плёнки (CSS-фильтр для слоя стёкол)
  const FILMS = {
    ceramic: { label: "Керамическая", filter: "sepia(1) hue-rotate(180deg) saturate(1.6)" },
    carbon:  { label: "Карбоновая",   filter: "sepia(0.8) saturate(1.2) brightness(0.85)" },
  };

  const DEFAULTS = Object.freeze({
    tint: 20,          // значение на ползунке
    film: "ceramic",   // выбранная плёнка
    applied: { tint: 0, film: "ceramic" }, // что сейчас показано на авто
    angle: "side",
    compare: false,
  });

  /* ---------- Состояние ---------- */
  let state = structuredCloneSafe(DEFAULTS);

  /* ---------- DOM ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const el = {
    range: $("#tintRange"),
    ticks: $("#tintTicks"),
    value: $("#tintValue"),
    presets: $$("#presets .preset"),
    films: $$("#films .film"),
    applyBtn: $("#applyBtn"),
    resetBtn: $("#resetBtn"),
    angles: $$("#angles .chip"),
    compare: $("#compareToggle"),
    car: $("#heroCar"),
    carImg: $("#carImg"),
    carGlass: $("#carGlass"),
    caption: $("#stageCaption"),
    shots: $$(".gallery .shot"),
    toast: $("#toast"),
    burger: $("#burger"),
    nav: $("#nav"),
    year: $("#year"),
  };

  /* ---------- Утилиты ---------- */
  function structuredCloneSafe(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  const stepIndexOf = (tint) => TINT_STEPS.indexOf(tint);

  let toastTimer;
  function showToast(message) {
    el.toast.textContent = message;
    el.toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.remove("is-visible"), 2600);
  }

  function setActive(items, predicate, ariaAttr = "aria-pressed") {
    items.forEach((item) => {
      const on = predicate(item);
      item.classList.toggle("is-active", on);
      item.setAttribute(ariaAttr, String(on));
    });
  }

  /* ---------- Рендер ---------- */
  function renderControls() {
    const idx = Math.max(0, stepIndexOf(state.tint));
    const fill = (idx / (TINT_STEPS.length - 1)) * 100;

    el.range.value = idx;
    el.range.style.setProperty("--fill", `${fill}%`);
    el.range.setAttribute("aria-valuetext", `${state.tint}%`);

    if (el.value.textContent !== `${state.tint}%`) {
      el.value.textContent = `${state.tint}%`;
      el.value.classList.remove("bump");
      void el.value.offsetWidth; // перезапуск анимации
      el.value.classList.add("bump");
    }

    $$(".range__tick", el.ticks).forEach((tick) =>
      tick.classList.toggle("is-active", Number(tick.dataset.value) === state.tint)
    );

    setActive(el.presets, (p) => Number(p.dataset.value) === state.tint);
    setActive(el.films, (f) => f.dataset.film === state.film, "aria-checked");

    const pending = state.tint !== state.applied.tint || state.film !== state.applied.film;
    el.applyBtn.classList.toggle("is-pending", pending);
  }

  function renderCar() {
    const { tint, film } = state.applied;
    el.car.style.setProperty("--tint", tint);
    el.car.style.setProperty("--film-filter", FILMS[film].filter);
    el.car.dataset.compare = String(state.compare);

    const angleLabel = ANGLES[state.angle].label;
    el.caption.textContent = tint
      ? `${FILMS[film].label} · ${tint}% · ${angleLabel}`
      : `Без тонировки · ${angleLabel}`;

    setActive(el.shots, (s) => Number(s.dataset.tint) === tint);
  }

  function renderAngle() {
    setActive(el.angles, (a) => a.dataset.angle === state.angle, "aria-checked");
  }

  function render() {
    renderControls();
    renderCar();
    renderAngle();
    el.compare.checked = state.compare;
  }

  /* ---------- Действия ---------- */
  function setTint(tint) {
    if (stepIndexOf(tint) === -1) return;
    state.tint = tint;
    renderControls();
  }

  function setFilm(film) {
    if (!FILMS[film]) return;
    state.film = film;
    renderControls();
  }

  function applyFilm() {
    state.applied = { tint: state.tint, film: state.film };
    renderControls();
    renderCar();
    showToast(`Плёнка применена: ${FILMS[state.film].label}, ${state.tint}%`);
  }

  function reset() {
    state = structuredCloneSafe(DEFAULTS);
    swapAngleImages(state.angle, false);
    render();
    showToast("Настройки сброшены");
  }

  function swapAngleImages(angle, animate = true) {
    const { car, glass } = ANGLES[angle];
    const swap = () => {
      el.carImg.src = car;
      el.carGlass.src = glass;
    };
    if (!animate) return swap();

    el.car.classList.add("is-switching");
    setTimeout(() => {
      swap();
      el.car.classList.remove("is-switching");
    }, 250);
  }

  function setAngle(angle) {
    if (!ANGLES[angle] || angle === state.angle) return;
    state.angle = angle;
    renderAngle();
    swapAngleImages(angle);
    renderCar();
  }

  /* ---------- Инициализация ---------- */
  function buildTicks() {
    el.ticks.innerHTML = "";
    TINT_STEPS.forEach((value) => {
      const tick = document.createElement("button");
      tick.type = "button";
      tick.className = "range__tick";
      tick.dataset.value = value;
      tick.textContent = `${value}%`;
      tick.setAttribute("aria-label", `Затемнение ${value}%`);
      el.ticks.appendChild(tick);
    });
  }

  function bindEvents() {
    // Ползунок: процент меняется при перетаскивании
    el.range.addEventListener("input", () => setTint(TINT_STEPS[Number(el.range.value)]));

    // Клик по подписям шкалы
    el.ticks.addEventListener("click", (e) => {
      const tick = e.target.closest(".range__tick");
      if (tick) setTint(Number(tick.dataset.value));
    });

    // Популярные варианты → двигают ползунок
    el.presets.forEach((p) => p.addEventListener("click", () => setTint(Number(p.dataset.value))));

    // Тип плёнки
    el.films.forEach((f) => f.addEventListener("click", () => setFilm(f.dataset.film)));

    el.applyBtn.addEventListener("click", applyFilm);
    el.resetBtn.addEventListener("click", reset);

    // Ракурс
    el.angles.forEach((a) => a.addEventListener("click", () => setAngle(a.dataset.angle)));

    // Стрелки в группе ракурсов (паттерн radiogroup)
    $("#angles").addEventListener("keydown", (e) => {
      if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
      const keys = Object.keys(ANGLES);
      const dir = e.key === "ArrowRight" ? 1 : -1;
      const next = keys[(keys.indexOf(state.angle) + dir + keys.length) % keys.length];
      setAngle(next);
      el.angles.find((a) => a.dataset.angle === next).focus();
    });

    // До / После
    el.compare.addEventListener("change", () => {
      state.compare = el.compare.checked;
      renderCar();
      if (state.compare && state.applied.tint === 0) {
        showToast("Выберите и примените плёнку, чтобы увидеть разницу");
      }
    });

    // Галерея: выбор варианта сразу применяет его к авто
    el.shots.forEach((shot) =>
      shot.addEventListener("click", () => {
        const tint = Number(shot.dataset.tint);
        if (tint > 0) state.tint = tint;
        state.applied = { tint, film: state.film };
        renderControls();
        renderCar();
      })
    );

    // Мобильное меню
    el.burger.addEventListener("click", () => {
      const open = el.nav.classList.toggle("is-open");
      el.burger.setAttribute("aria-expanded", String(open));
      el.burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    });
    el.nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) {
        el.nav.classList.remove("is-open");
        el.burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* =========================================================
     Остальные разделы сайта
     ========================================================= */

  // Появление блоков при скролле
  function initReveal() {
    const items = $$(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach((i) => i.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-visible");
        io.unobserve(e.target);
      }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    items.forEach((i) => io.observe(i));
  }

  // Подсветка пункта меню текущего раздела
  function initScrollSpy() {
    const links = $$(".nav__link[data-spy]");
    const sections = links
      .map((l) => document.getElementById(l.dataset.spy))
      .filter((s) => s && s.tagName === "SECTION");
    if (!("IntersectionObserver" in window) || !sections.length) return;

    const setCurrent = (id) => links.forEach((l) => {
      const on = l.dataset.spy === id;
      l.classList.toggle("is-active", on);
      if (on) l.setAttribute("aria-current", "true");
      else l.removeAttribute("aria-current");
    });

    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setCurrent(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => io.observe(s));
  }

  // Фильтр портфолио
  function initPortfolio() {
    const chips = $$("#portfolioFilter .chip");
    const works = $$("#works .work");
    chips.forEach((chip) => chip.addEventListener("click", () => {
      const filter = chip.dataset.filter;
      setActive(chips, (c) => c === chip);
      works.forEach((w) => {
        const show = filter === "all" || w.dataset.category.split(" ").includes(filter);
        w.classList.toggle("is-hidden", !show);
        if (show) w.classList.add("is-visible");
      });
    }));
  }

  // Счётчики в блоке «О студии»
  function initCounters() {
    const counters = $$(".stat__value[data-count]");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const format = (n, el) => {
      const decimals = Number(el.dataset.decimals || 0);
      const str = decimals ? n.toFixed(decimals).replace(".", ",") : Math.round(n).toLocaleString("ru-RU");
      return str + (el.dataset.suffix || "");
    };

    const run = (el) => {
      const target = Number(el.dataset.count);
      if (reduce) { el.textContent = format(target, el); return; }
      const start = performance.now();
      const duration = 1400;
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration);
        el.textContent = format(target * (1 - Math.pow(1 - p, 3)), el);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (!("IntersectionObserver" in window)) return counters.forEach(run);
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      run(e.target);
      io.unobserve(e.target);
    }), { threshold: 0.6 });
    counters.forEach((c) => io.observe(c));
  }

  // Форма записи
  function initBookingForm() {
    const form = $("#booking");
    const phone = $("#fPhone");
    const service = $("#fService");
    const comment = $("#fComment");

    // Маска телефона: +7 (999) 999-99-99
    const formatPhone = (value) => {
      let d = value.replace(/\D/g, "");
      if (d.startsWith("8")) d = "7" + d.slice(1);
      if (!d.startsWith("7")) d = "7" + d;
      d = d.slice(0, 11);
      const p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)];
      let out = "+7";
      if (p[0]) out += ` (${p[0]}`;
      if (p[0].length === 3) out += ")";
      if (p[1]) out += ` ${p[1]}`;
      if (p[2]) out += `-${p[2]}`;
      if (p[3]) out += `-${p[3]}`;
      return out;
    };
    phone.addEventListener("input", () => {
      phone.value = phone.value ? formatPhone(phone.value) : "";
    });

    const selectService = (name) => {
      const option = [...service.options].find((o) => o.text === name);
      if (option) service.value = option.value;
    };

    // Кнопки «Записаться» в карточках услуг выбирают услугу в форме
    $$("[data-service]").forEach((btn) =>
      btn.addEventListener("click", () => selectService(btn.dataset.service))
    );

    // «Записаться на тонировку» переносит выбранную плёнку в комментарий
    $("#bookBtn").addEventListener("click", () => {
      selectService("Тонировка стёкол");
      const { tint, film } = state.tint === state.applied.tint && state.applied.tint
        ? state.applied
        : { tint: state.tint, film: state.film };
      comment.value = `Конфигуратор: ${FILMS[film].label} плёнка, ${tint}%`;
    });

    const fields = {
      name: { input: $("#fName"), valid: (v) => v.trim().length >= 2 },
      phone: { input: phone, valid: (v) => v.replace(/\D/g, "").length === 11 },
    };
    const agree = $("#fAgree");

    const validate = () => {
      let firstInvalid = null;
      Object.values(fields).forEach(({ input, valid }) => {
        const ok = valid(input.value);
        input.closest(".field").classList.toggle("is-invalid", !ok);
        input.setAttribute("aria-invalid", String(!ok));
        if (!ok && !firstInvalid) firstInvalid = input;
      });
      agree.closest(".check").classList.toggle("is-invalid", !agree.checked);
      if (!agree.checked && !firstInvalid) firstInvalid = agree;
      if (firstInvalid) firstInvalid.focus();
      return !firstInvalid;
    };

    Object.values(fields).forEach(({ input, valid }) =>
      input.addEventListener("input", () => {
        if (valid(input.value)) input.closest(".field").classList.remove("is-invalid");
      })
    );
    agree.addEventListener("change", () => agree.closest(".check").classList.remove("is-invalid"));

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate()) return;

      // Здесь подключается отправка: fetch на ваш сервер, Telegram-бот, Formspree и т.п.
      const data = Object.fromEntries(new FormData(form));
      console.info("Заявка:", data);

      form.reset();
      showToast("Заявка отправлена! Мы перезвоним в ближайшее время.");
    });
  }

  function init() {
    buildTicks();
    bindEvents();
    render();
    initReveal();
    initScrollSpy();
    initPortfolio();
    initCounters();
    initBookingForm();
    el.year.textContent = new Date().getFullYear();
  }

  init();
})();
