(() => {
  const body = document.body;
  const header = document.querySelector("[data-site-header]");
  const menuButton = document.querySelector("[data-menu-button]");
  const menu = document.querySelector("[data-site-menu]");
  const scrim = document.querySelector("[data-menu-scrim]");
  const year = document.querySelector("[data-current-year]");

  const setMenu = (open) => {
    if (!menuButton || !menu) return;
    body.classList.toggle("menu-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    menu.setAttribute("aria-hidden", String(!open));
  };

  menuButton?.addEventListener("click", () => {
    setMenu(!body.classList.contains("menu-open"));
  });

  scrim?.addEventListener("click", () => setMenu(false));

  menu?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
  });

  const updateHeader = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 24);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const revealItems = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.13 }
    );
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  if (year) year.textContent = new Date().getFullYear();
})();
