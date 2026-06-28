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
     Hero slideshow (auto-advancing crossfade carousel)
     ---------------------------------------------------------------------- */
  var heroSlides = document.querySelectorAll("#hero-slides .hero__slide");
  var heroDots = document.querySelectorAll("#hero-dots .hero__dot");
  if (heroSlides.length > 1) {
    var heroIndex = 0;
    var heroInterval = 4000;
    var heroTimer = null;

    function showHeroSlide(next) {
      heroSlides[heroIndex].classList.remove("is-active");
      if (heroDots[heroIndex]) {
        heroDots[heroIndex].classList.remove("is-active");
        heroDots[heroIndex].setAttribute("aria-selected", "false");
      }
      heroIndex = (next + heroSlides.length) % heroSlides.length;
      heroSlides[heroIndex].classList.add("is-active");
      if (heroDots[heroIndex]) {
        heroDots[heroIndex].classList.add("is-active");
        heroDots[heroIndex].setAttribute("aria-selected", "true");
      }
    }
    function startHero() {
      if (heroTimer) return;
      heroTimer = window.setInterval(function () {
        showHeroSlide(heroIndex + 1);
      }, heroInterval);
    }
    function stopHero() {
      window.clearInterval(heroTimer);
      heroTimer = null;
    }

    function goToHero(next) {
      showHeroSlide(next);
      stopHero();
      startHero();
    }

    /* Dash indicators: jump to a look and restart the timer */
    heroDots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        if (i === heroIndex) return;
        goToHero(i);
      });
    });

    /* Touch swipe (mobile): left = next, right = previous */
    var heroStage = document.getElementById("hero-slides");
    if (heroStage) {
      var touchX = 0, touchY = 0, swiping = false;
      heroStage.addEventListener("touchstart", function (e) {
        if (e.touches.length !== 1) { swiping = false; return; }
        touchX = e.touches[0].clientX;
        touchY = e.touches[0].clientY;
        swiping = true;
      }, { passive: true });
      heroStage.addEventListener("touchend", function (e) {
        if (!swiping) return;
        swiping = false;
        var dx = e.changedTouches[0].clientX - touchX;
        var dy = e.changedTouches[0].clientY - touchY;
        /* ignore vertical scrolls and tiny movements */
        if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
        goToHero(dx < 0 ? heroIndex + 1 : heroIndex - 1);
      }, { passive: true });
    }

    startHero();

    /* Pause when the tab is hidden, resume on return */
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { stopHero(); } else { startHero(); }
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
    var lbCounter = lightbox.querySelector(".lightbox__counter");
    var triggers = Array.prototype.slice.call(document.querySelectorAll(".plate, .gallery-card"));
    var lbIndex = 0;
    var lastFocused = null;
    var decoder = document.createElement("textarea");
    function decode(s) { decoder.innerHTML = s || ""; return decoder.value; }
    function fullSrc(trg) {
      var img = trg.querySelector("img");
      return img.getAttribute("data-full") || img.src;
    }
    function pad(n) { return n < 10 ? "0" + n : "" + n; }

    function show(index) {
      if (!triggers.length) return;
      lbIndex = (index + triggers.length) % triggers.length;
      var trg = triggers[lbIndex];
      var img = trg.querySelector("img");
      var src = fullSrc(trg);

      // Captions and counter update immediately
      lbTitle.textContent = decode(trg.getAttribute("data-title"));
      lbCat.textContent = decode(trg.getAttribute("data-cat"));
      if (lbCounter) lbCounter.textContent = pad(lbIndex + 1) + " / " + pad(triggers.length);

      // Fade out current, swap once the new image is decoded, fade in
      lbImg.classList.add("is-loading");
      var loader = new Image();
      loader.onload = function () {
        lbImg.src = src;
        lbImg.alt = img.alt || "";
        lbImg.classList.remove("is-loading");
      };
      loader.src = src;

      // Preload the neighbours so prev/next feels instant
      new Image().src = fullSrc(triggers[(lbIndex + 1) % triggers.length]);
      new Image().src = fullSrc(triggers[(lbIndex - 1 + triggers.length) % triggers.length]);
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
