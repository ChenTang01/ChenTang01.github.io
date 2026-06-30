(() => {
  const content = document.querySelector("#notes-content");
  const toc = document.querySelector("#notes-toc");
  const countLabel = document.querySelector("[data-note-count]");
  const timeLabel = document.querySelector("[data-reading-time]");
  const progress = document.querySelector("[data-reading-progress]");

  const slugify = (value) =>
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72);

  const decorateEntries = () => {
    const entries = Array.from(content.querySelectorAll(":scope > ul > li"));
    toc.innerHTML = "";

    entries.forEach((entry, index) => {
      const titleNode = entry.querySelector(":scope > p:first-child > strong:first-child");
      const title = titleNode?.textContent?.trim() || `Note ${index + 1}`;
      const id = `${String(index + 1).padStart(2, "0")}-${slugify(title)}`;
      entry.id = id;
      entry.dataset.noteNumber = String(index + 1).padStart(2, "0");

      const link = document.createElement("a");
      link.href = `#${id}`;
      link.textContent = title;
      toc.appendChild(link);
    });

    if (countLabel) {
      countLabel.textContent = `${entries.length} ${entries.length === 1 ? "note" : "notes"}`;
    }

    const tocLinks = Array.from(toc.querySelectorAll("a"));
    if ("IntersectionObserver" in window && entries.length) {
      const entryObserver = new IntersectionObserver(
        (observed) => {
          observed.forEach((item) => {
            if (!item.isIntersecting) return;
            tocLinks.forEach((link) => {
              link.classList.toggle("is-active", link.getAttribute("href") === `#${item.target.id}`);
            });
          });
        },
        { rootMargin: "-15% 0px -70%", threshold: 0 }
      );
      entries.forEach((entry) => entryObserver.observe(entry));
    }
  };

  const renderNotes = async () => {
    try {
      const response = await fetch("README.md");
      if (!response.ok) throw new Error(`Unable to load notes (${response.status})`);
      const source = await response.text();
      const collapseMathBlock = (_, indent, expression, open, close) => {
        const singleLine = expression.trim().replace(/\s*\n\s*/g, " ");
        return `${indent}${open}${singleLine}${close}`;
      };
      const normalizedMath = source
        .replace(
          /^([ \t]*)\$\$\s*\n([\s\S]*?)^\1\$\$\s*$/gm,
          (match, indent, expression) => collapseMathBlock(match, indent, expression, "$$", "$$")
        )
        .replace(
          /^([ \t]*)\\\[\s*\n([\s\S]*?)^\1\\\]\s*$/gm,
          (match, indent, expression) => collapseMathBlock(match, indent, expression, "$$", "$$")
        );
      const protectedMath = normalizedMath.replace(/\\([{}])/g, "\\\\$1");
      const withHighlights = protectedMath.replace(/==([\s\S]+?)==/g, "<mark>$1</mark>");

      marked.setOptions({ gfm: true, breaks: false });
      content.innerHTML = marked.parse(withHighlights);
      content.setAttribute("aria-busy", "false");

      content.querySelectorAll("a[href^='http']").forEach((link) => {
        link.target = "_blank";
        link.rel = "noreferrer";
      });

      content.querySelectorAll("pre code").forEach((block) => {
        if (window.hljs) window.hljs.highlightElement(block);
      });

      decorateEntries();

      const wordCount = source.trim().split(/\s+/).length;
      if (timeLabel) timeLabel.textContent = `${Math.max(1, Math.ceil(wordCount / 220))} min read`;

      if (window.MathJax?.typesetPromise) {
        await window.MathJax.typesetPromise([content]);
      }

      if (window.location.hash) {
        const target = document.getElementById(window.location.hash.slice(1));
        target?.scrollIntoView({ block: "start", inline: "nearest" });
      }
    } catch (error) {
      content.setAttribute("aria-busy", "false");
      content.innerHTML = `<div class="notes-error"><strong>The notebook could not be opened.</strong><br>${error.message}</div>`;
      if (toc) toc.innerHTML = "";
    }
  };

  const updateProgress = () => {
    if (!progress) return;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0;
    progress.style.width = `${ratio * 100}%`;
  };

  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();
  renderNotes();
})();
