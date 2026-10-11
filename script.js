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

  function init() {
    buildTicks();
    bindEvents();
    render();
    el.year.textContent = new Date().getFullYear();
  }

  init();
})();
