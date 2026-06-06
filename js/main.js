/* ==========================================================================
   RS Artistry - site interactions
   Progressive enhancement: every feature checks for its target first so
   pages without a given module are unaffected.
   ========================================================================== */
(function () {
  "use strict";

  /* ----------------------------------------------------------------------
     Mobile navigation toggle
     ---------------------------------------------------------------------- */
  var navToggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll(".nav-link").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ----------------------------------------------------------------------
     Scroll reveal (gentle fade + rise)
     ---------------------------------------------------------------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    if ("IntersectionObserver" in window) {
      var revealObserver = new IntersectionObserver(
        function (entries, obs) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      );
      revealEls.forEach(function (el) {
        revealObserver.observe(el);
      });
    } else {
      revealEls.forEach(function (el) {
        el.classList.add("is-visible");
      });
    }
  }

  /* ----------------------------------------------------------------------
     Form field focus state
     ---------------------------------------------------------------------- */
  document.querySelectorAll(".field input, .field select, .field textarea").forEach(function (input) {
    var field = input.closest(".field");
    if (!field) return;
    input.addEventListener("focus", function () {
      field.classList.add("is-focused");
    });
    input.addEventListener("blur", function () {
      field.classList.remove("is-focused");
    });
  });

  /* ----------------------------------------------------------------------
     Testimonial rotator
     ---------------------------------------------------------------------- */
  var testimonialEl = document.querySelector("[data-testimonials]");
  if (testimonialEl) {
    var quoteEl = testimonialEl.querySelector(".testimonial__quote");
    var citeEl = testimonialEl.querySelector(".testimonial__cite");
    var items = [
      {
        quote: "Silvia has an incredible eye for detail. She did not just do my makeup; she created an experience that made me feel like the most refined version of myself.",
        author: "Isabella M."
      },
      {
        quote: "The only studio I trust for high profile events. Their minimalist approach is unparalleled and always results in a flawless, camera ready finish.",
        author: "Julianne R."
      },
      {
        quote: "A transformative bridal experience. They captured my vision perfectly while adding their own editorial touch. Truly world class artistry.",
        author: "Sophie T."
      }
    ];
    var current = 0;
    setInterval(function () {
      quoteEl.style.opacity = "0";
      quoteEl.style.transform = "translateY(-12px)";
      setTimeout(function () {
        current = (current + 1) % items.length;
        quoteEl.textContent = "“" + items[current].quote + "”";
        citeEl.textContent = items[current].author;
        quoteEl.style.transform = "translateY(12px)";
        requestAnimationFrame(function () {
          quoteEl.style.opacity = "1";
          quoteEl.style.transform = "translateY(0)";
        });
      }, 600);
    }, 7000);
  }

  /* ----------------------------------------------------------------------
     Gallery piece count (editorial masthead)
     ---------------------------------------------------------------------- */
  var galleryCount = document.querySelector("[data-gallery-count]");
  if (galleryCount) {
    var count = document.querySelectorAll(".masonry__item").length;
    var words = ["zero", "one", "two", "three", "four", "five", "six", "seven",
      "eight", "nine", "ten", "eleven", "twelve"];
    galleryCount.textContent = (words[count] || count) + (count === 1 ? " look" : " looks");
  }

  /* ----------------------------------------------------------------------
     Lightbox: layout-agnostic, arrow + keyboard + swipe + focus trap
     ---------------------------------------------------------------------- */
  var lightbox = document.getElementById("lightbox");
  if (lightbox) {
    var lbImg = lightbox.querySelector(".lightbox__img");
    var lbTitle = lightbox.querySelector(".lightbox__caption-title");
    var lbCat = lightbox.querySelector(".lightbox__caption-cat");
    var lbClose = lightbox.querySelector(".lightbox__close");
    var lbPrev = lightbox.querySelector(".lightbox__prev");
    var lbNext = lightbox.querySelector(".lightbox__next");
    var triggers = Array.prototype.slice.call(document.querySelectorAll(".plate, .gallery-card"));
    var lbIndex = 0;
    var lastFocused = null;
    var decoder = document.createElement("textarea");
    function decode(s) { decoder.innerHTML = s || ""; return decoder.value; }

    function show(index) {
      if (!triggers.length) return;
      lbIndex = (index + triggers.length) % triggers.length;
      var trg = triggers[lbIndex];
      var img = trg.querySelector("img");
      lbImg.src = img.getAttribute("data-full") || img.src;
      lbImg.alt = img.alt || "";
      lbTitle.textContent = decode(trg.getAttribute("data-title"));
      lbCat.textContent = decode(trg.getAttribute("data-cat"));
    }

    function openLb(trg) {
      lastFocused = document.activeElement;
      show(triggers.indexOf(trg));
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      lbClose.focus();
    }

    function closeLb() {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    triggers.forEach(function (trg) {
      trg.addEventListener("click", function () { openLb(trg); });
      trg.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLb(trg); }
      });
    });

    lbClose.addEventListener("click", closeLb);
    lbPrev.addEventListener("click", function () { show(lbIndex - 1); });
    lbNext.addEventListener("click", function () { show(lbIndex + 1); });
    lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeLb(); });

    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") { closeLb(); return; }
      if (e.key === "ArrowLeft") { show(lbIndex - 1); return; }
      if (e.key === "ArrowRight") { show(lbIndex + 1); return; }
      if (e.key === "Tab") {
        var f = [lbClose, lbPrev, lbNext];
        var i = f.indexOf(document.activeElement);
        if (i === -1) i = 0;
        e.preventDefault();
        f[e.shiftKey ? (i - 1 + f.length) % f.length : (i + 1) % f.length].focus();
      }
    });

    var touchStartX = 0;
    lightbox.addEventListener("touchstart", function (e) {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });
    lightbox.addEventListener("touchend", function (e) {
      var delta = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(delta) > 50) show(delta < 0 ? lbIndex + 1 : lbIndex - 1);
    }, { passive: true });
  }

})();
