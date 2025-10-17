"use strict";
(function () {
  const root = document.documentElement;
  const fileInput = document.getElementById("file-input");
  const dropzone = document.getElementById("dropzone");
  const browseBtn = document.getElementById("browse-btn");
  const gallery = document.getElementById("gallery");
  const themeToggle = document.getElementById("theme-toggle");

  // Theme setup
  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("theme", theme);
    } catch (_) {}
    themeToggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
  }
  function initTheme() {
    const saved = (() => {
      try { return localStorage.getItem("theme"); } catch (_) { return null; }
    })();
    if (saved) setTheme(saved);
    else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark');
    else setTheme('light');
  }
  themeToggle.addEventListener("click", () => {
    const current = root.getAttribute("data-theme") || "light";
    setTheme(current === "light" ? "dark" : "light");
  });
  initTheme();

  // Browse button focuses the native input
  browseBtn.addEventListener("click", () => fileInput.click());

  // Handle file input selection
  fileInput.addEventListener("change", (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) handleFiles(files);
    fileInput.value = ""; // reset so the same file can be selected again
  });

  // Drag & Drop behavior
  const preventDefaults = (e) => { e.preventDefault(); e.stopPropagation(); };
  ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
    dropzone.addEventListener(eventName, preventDefaults, false);
  });
  ["dragenter", "dragover"].forEach(eventName => {
    dropzone.addEventListener(eventName, () => dropzone.classList.add("is-dragover"), false);
  });
  ["dragleave", "drop"].forEach(eventName => {
    dropzone.addEventListener(eventName, () => dropzone.classList.remove("is-dragover"), false);
  });
  dropzone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    if (!dt) return;
    const files = Array.from(dt.files || []);
    if (files.length) handleFiles(files);
  });
  // Enter key on label triggers input
  dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });

  function handleFiles(files) {
    files.forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (!isImage && !isVideo) return; // skip unsupported
      const objectUrl = URL.createObjectURL(file);

      const card = document.createElement("article");
      card.className = "card enter";
      card.setAttribute("role", "listitem");

      const spinner = document.createElement("div");
      spinner.className = "spinner";

      let mediaEl;
      if (isImage) {
        const img = document.createElement("img");
        img.src = objectUrl;
        img.alt = file.name || "Uploaded image";
        img.addEventListener("load", () => {
          // Free blob URL after image is decoded
          try { URL.revokeObjectURL(objectUrl); } catch (_) {}
          spinner.remove();
        }, { once: true });
        mediaEl = img;
      } else {
        const video = document.createElement("video");
        video.src = objectUrl;
        video.controls = true;
        video.preload = "metadata";
        video.playsInline = true;
        video.muted = true;
        video.addEventListener("loadeddata", () => {
          spinner.remove();
        }, { once: true });
        // Save URL for cleanup on delete
        card.dataset.objectUrl = objectUrl;
        mediaEl = video;
      }

      const delBtn = document.createElement("button");
      delBtn.className = "delete-btn";
      delBtn.type = "button";
      delBtn.setAttribute("aria-label", "Remove item");
      delBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 7h12m-9 0v-.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V7m-7 0v11A2 2 0 0 0 10 20h4a2 2 0 0 0 2-2V7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M10 10v7m4-7v7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>`;

      delBtn.addEventListener("click", () => removeCard(card));

      card.appendChild(mediaEl);
      card.appendChild(spinner);
      card.appendChild(delBtn);
      gallery.prepend(card);

      // Trigger enter transition
      requestAnimationFrame(() => {
        card.classList.remove("enter");
      });
    });
  }

  function removeCard(card) {
    card.classList.add("leaving");
    const onDone = () => {
      // Cleanup blob URL if it belongs to a video
      const url = card.dataset.objectUrl;
      if (url) {
        try { URL.revokeObjectURL(url); } catch (_) {}
      }
      card.remove();
      card.removeEventListener("transitionend", onDone);
    };
    card.addEventListener("transitionend", onDone);
  }
})();
