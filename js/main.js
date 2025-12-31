const DigitalMira = (function () {
  "use strict";

  function init() {
    initHeader();
    initMobileMenu();
    initUserMenu();
    initScrollSpy(); // Added ScrollSpy
    initModals();
    initAnimations();
    updateAuthUI();
    initAccessibility();
  }

  // Improved ScrollSpy for Active Link Highlighting
  function initScrollSpy() {
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll(".nav-link");

    // Helper to remove active class from all links
    function removeActiveClasses() {
      navLinks.forEach((link) => link.classList.remove("active"));
    }

    // Helper to add active class by href
    function addActiveClass(id) {
      const link =
        document.querySelector(`.nav-link[href="#${id}"]`) ||
        document.querySelector(`.nav-link[href="index.html#${id}"]`);
      if (link) link.classList.add("active");
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            removeActiveClasses();
            addActiveClass(entry.target.getAttribute("id"));
          }
        });
      },
      {
        rootMargin: "-50% 0px -50% 0px", // Trigger when section is in middle of viewport
        threshold: 0,
      }
    );

    sections.forEach((section) => observer.observe(section));

    // highlight Home if at top (ONLY on Landing Page)
    window.addEventListener("scroll", () => {
      // Only apply this logic if we are on the landing page (has hero)
      if (!document.querySelector(".hero")) return;

      if (window.scrollY < 100) {
        removeActiveClasses();
        const homeLink = document.querySelector('.nav-link[href="index.html"]');
        if (homeLink) homeLink.classList.add("active");
      }
    });
  }

  function initHeader() {
    const header = document.querySelector(".header");
    if (!header) return;

    // Check if we are on a page with a Hero section
    const hasHero = document.querySelector(".hero");
    if (!hasHero) {
      header.classList.add("solid-header");
    }

    let lastScroll = 0;

    window.addEventListener("scroll", function () {
      const currentScroll = window.pageYOffset;

      if (currentScroll > 50) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }

      lastScroll = currentScroll;
    });
  }

  function initMobileMenu() {
    const hamburger = document.querySelector(".hamburger");
    const mobileMenu = document.querySelector(".mobile-menu");
    const closeBtn = document.querySelector(".menu-close-btn"); // Select new close button

    if (!hamburger || !mobileMenu) return;

    function toggleMenu() {
      const isActive = hamburger.classList.contains("active");

      if (!isActive) {
        // Opening
        hamburger.classList.add("active");
        mobileMenu.classList.add("active");
        document.body.style.overflow = "hidden";
        hamburger.setAttribute("aria-expanded", "true");
      } else {
        // Closing
        closeMenu();
      }

      // Remove focus from hamburger to prevent sticky state
      hamburger.blur();
    }

    function closeMenu() {
      hamburger.classList.remove("active");
      mobileMenu.classList.remove("active");
      document.body.style.overflow = "";
      hamburger.setAttribute("aria-expanded", "false");
    }

    hamburger.addEventListener("click", function (e) {
      e.stopPropagation(); // vital for click-outside logic
      toggleMenu();
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        closeMenu();
      });
    }

    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    // Modified Click Outside Logic
    document.addEventListener("click", function (e) {
      const isMenuOpen = mobileMenu.classList.contains("active");
      const clickedInsideMenu = mobileMenu.contains(e.target);
      const clickedHamburger = hamburger.contains(e.target);

      // If menu is open, and click is NOT inside menu (content) AND NOT hamburger
      // Note: mobileMenu includes the sidebar. The ::before pseudo-element is NOT part of 'contains' check usually
      // BUT if the user clicks the overlay area, depending on DOM structure, it might register as mobileMenu or Body.
      // Since we used transform on mobileMenu and fixed positioning, e.target might be mobileMenu if clicked on padding?
      // Actually, standard behavior: pseudo-elements don't capture events separately, they bubble to parent.
      // If parent (mobileMenu) is 70% width, clicking left 30% hits BODY.

      if (isMenuOpen && !clickedInsideMenu && !clickedHamburger) {
        closeMenu();
      }

      // Explicitly check for overlay click if the overlay is part of the element bounds (e.g. ::before covering screen)
      // Since ::before covers the screen, clicking it sets target to mobileMenu.
      if (isMenuOpen && e.target === mobileMenu) {
        closeMenu();
      }
    });

    // Handle Escape key
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mobileMenu.classList.contains("active")) {
        closeMenu();
      }
    });
  }

  function initUserMenu() {
    const userAvatar = document.querySelector(".user-avatar");
    const userDropdown = document.querySelector(".user-dropdown");

    if (!userAvatar || !userDropdown) return;

    // Use event delegation for better reliability
    document.addEventListener("click", function (e) {
      // Toggle if clicking avatar
      if (e.target.closest(".user-avatar")) {
        e.stopPropagation();
        userDropdown.classList.toggle("active");
        return;
      }

      // Close if clicking outside
      if (
        !e.target.closest(".user-dropdown") &&
        userDropdown.classList.contains("active")
      ) {
        userDropdown.classList.remove("active");
      }

      // Handle Logout
      if (e.target.closest(".logout") || e.target.closest(".logout-btn")) {
        e.preventDefault();
        if (typeof AuthSimulator !== "undefined") {
          AuthSimulator.logout();
          window.location.href = "index.html";
        }
      }
    });

    // Keyboard support (Single listener)
    userAvatar.addEventListener("keypress", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        userDropdown.classList.toggle("active");
      }
    });
  }

  function initModals() {
    document.addEventListener("click", function (e) {
      if (e.target.classList.contains("modal-overlay")) {
        closeModal(e.target);
      }

      if (e.target.closest(".modal-close")) {
        const modal = e.target.closest(".modal-overlay");
        if (modal) {
          closeModal(modal);
        }
      }

      const trigger = e.target.closest("[data-modal]");
      if (trigger) {
        const modalId = trigger.dataset.modal;
        const modal = document.getElementById(modalId);
        if (modal) {
          openModal(modal);
        }
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        const activeModal = document.querySelector(".modal-overlay.active");
        if (activeModal) {
          closeModal(activeModal);
        }
      }
    });
  }

  function openModal(modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";

    const focusable = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length) {
      focusable[0].focus();
    }
  }

  function closeModal(modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }

  function initAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in");
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document
      .querySelectorAll(".card, .feature-card, .module-card, .stat-item")
      .forEach(function (el) {
        el.style.opacity = "0";
        el.style.transform = "translateY(20px)";
        el.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        observer.observe(el);
      });

    const style = document.createElement("style");
    style.textContent =
      ".animate-in { opacity: 1 !important; transform: translateY(0) !important; }";
    document.head.appendChild(style);
  }

  function updateAuthUI() {
    const isAuthenticated =
      typeof AuthSimulator !== "undefined" && AuthSimulator.isAuthenticated();
    const session = isAuthenticated ? AuthSimulator.getSession() : null;

    document.querySelectorAll(".auth-only").forEach(function (el) {
      el.style.display = isAuthenticated ? "" : "none";
    });

    document.querySelectorAll(".guest-only").forEach(function (el) {
      el.style.display = isAuthenticated ? "none" : "";
    });

    if (isAuthenticated && session) {
      document.querySelectorAll(".user-name").forEach(function (el) {
        el.textContent = session.name;
      });

      document.querySelectorAll(".user-email").forEach(function (el) {
        el.textContent = session.email;
      });

      document.querySelectorAll(".user-avatar").forEach(function (el) {
        if (!el.querySelector("img")) {
          el.textContent = session.name.charAt(0).toUpperCase();
        }
      });
    }

    const user =
      isAuthenticated && typeof AuthSimulator !== "undefined"
        ? AuthSimulator.getCurrentUser()
        : null;
    if (user && user.progress) {
      updateProgressBars(user.progress);
    }
  }

  function updateProgressBars(progress) {
    Object.keys(progress).forEach(function (module) {
      const bar = document.querySelector(
        '.progress-fill[data-module="' + module + '"]'
      );
      const label = document.querySelector(
        '.progress-label[data-module="' + module + '"]'
      );

      if (bar) {
        bar.style.width = progress[module] + "%";
      }

      if (label) {
        label.textContent = progress[module] + "% Complete";
      }
    });

    const totalProgress = Math.round(
      (progress.transit + progress.shield + progress.udyam) / 3
    );
    const totalLabel = document.querySelector(".total-progress");
    if (totalLabel) {
      totalLabel.textContent = totalProgress + "%";
    }
  }

  function initAccessibility() {
    document.addEventListener("keydown", function (e) {
      if (e.key === "Tab") {
        document.body.classList.add("keyboard-nav");
      }
    });

    document.addEventListener("mousedown", function () {
      document.body.classList.remove("keyboard-nav");
    });

    const style = document.createElement("style");
    style.textContent =
      "body:not(.keyboard-nav) *:focus { outline: none; }" +
      ".keyboard-nav *:focus { outline: 2px solid var(--primary-color); outline-offset: 2px; }";
    document.head.appendChild(style);
  }

  function smoothScroll(target) {
    const element = document.querySelector(target);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  function formatCurrency(amount, currency) {
    currency = currency || "INR";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  }

  function debounce(func, wait) {
    let timeout;
    return function () {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function () {
        func.apply(context, args);
      }, wait);
    };
  }

  function throttle(func, limit) {
    let inThrottle;
    return function () {
      const context = this;
      const args = arguments;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(function () {
          inThrottle = false;
        }, limit);
      }
    };
  }

  return {
    init: init,
    updateAuthUI: updateAuthUI,
    smoothScroll: smoothScroll,
    formatCurrency: formatCurrency,
    formatDate: formatDate,
    debounce: debounce,
    throttle: throttle,
    openModal: openModal,
    closeModal: closeModal,
  };
})();

document.addEventListener("DOMContentLoaded", function () {
  DigitalMira.init();
});
