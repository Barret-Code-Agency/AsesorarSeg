/* java.js — Lógica unificada y accesible para:
   - Modal de contacto (index.html)
   - Modal de CV / visor (nosotros.html)
   - Rotador (mejor manejo accesible)
   - Scroll suave y manejo de hash
   - Accesibilidad (focus trap, ESC, click fuera)
   - Descarga de CVs
*/

(function () {
  'use strict';

  /* ---------------------------
     Utilidades pequeñas
  ----------------------------*/

  const $ = (selector, ctx = document) => ctx.querySelector(selector);
  const $$ = (selector, ctx = document) => Array.from(ctx.querySelectorAll(selector));

  // Detect prefers-reduced-motion
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Simple focusable selector used in focus trap
  const FOCUSABLE = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

  /* ---------------------------
     Common modal helpers
  ----------------------------*/

  function openModal(modalEl, panelSelector = '.modal-panel') {
    if (!modalEl) return;
    modalEl.classList.add('open');
    modalEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // focus first focusable element inside the panel, or the panel itself
    const panel = modalEl.querySelector(panelSelector) || modalEl;
    const first = panel.querySelector(FOCUSABLE);
    (first || panel).focus();
    // attach focus trap
    trapFocus(modalEl, panel);
  }

  function closeModal(modalEl, panelSelector = '.modal-panel') {
    if (!modalEl) return;
    modalEl.classList.remove('open');
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // remove iframe src if any to stop loading
    const iframes = modalEl.querySelectorAll('iframe');
    iframes.forEach(ifr => (ifr.src = ''));
    releaseFocusTrap(modalEl);
  }

  // Focus trap implementation attached via dataset
  function trapFocus(modalEl, panel) {
    if (!modalEl) return;
    // store previously focused element to restore on close
    modalEl.__previouslyFocused = document.activeElement;
    // find focusable elements within panel
    const nodes = Array.from(panel.querySelectorAll(FOCUSABLE));
    modalEl.__focusables = nodes;
    // keydown handler to keep focus inside
    const handler = function (e) {
      if (e.key !== 'Tab') return;
      const focusables = modalEl.__focusables || [];
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    };
    modalEl.__trapHandler = handler;
    document.addEventListener('keydown', handler);
  }

  function releaseFocusTrap(modalEl) {
    if (!modalEl) return;
    if (modalEl.__trapHandler) {
      document.removeEventListener('keydown', modalEl.__trapHandler);
      delete modalEl.__trapHandler;
    }
    // restore focus
    try {
      const prev = modalEl.__previouslyFocused;
      if (prev && typeof prev.focus === 'function') prev.focus();
    } catch (err) { /* ignore */ }
  }

  /* ---------------------------
     CONTACT MODAL (index.html)
  ----------------------------*/

  function initContactModal() {
    // Possible element names across files:
    const modal = document.getElementById('contactModal') || $('.modal.contact') || null;
    // Trigger in nav
    const openFromNav = document.getElementById('openContactModalFromNav') || $('[data-open-contact]') || null;
    // close button inside modal (class .btn-close)
    const closeBtn = modal ? modal.querySelector('.btn-close') : null;
    const form = modal ? modal.querySelector('#modal-contact-form') : null;

    if (!modal) return;

    // Open function
    function open() {
      openModal(modal);
      // mark aria-expanded on trigger if exists
      if (openFromNav) openFromNav.setAttribute('aria-expanded', 'true');
    }

    // Close function
    function close() {
      closeModal(modal);
      if (openFromNav) openFromNav.setAttribute('aria-expanded', 'false');
      if (form) form.reset();
    }

    // Click open from nav
    if (openFromNav) {
      openFromNav.addEventListener('click', (e) => {
        e.preventDefault();
        open();
      });
      // ensure accessibility attributes
      openFromNav.setAttribute('role', 'button');
      if (!openFromNav.hasAttribute('aria-expanded')) openFromNav.setAttribute('aria-expanded', 'false');
    }

    // Click close
    if (closeBtn) closeBtn.addEventListener('click', close);

    // Click outside panel to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });

    // ESC to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) close();
    });

    // Optional: handle form submission gracefully (example: prevent default and show simple ack)
    if (form) {
      form.addEventListener('submit', (e) => {
        // default behavior left to server; if you want to handle via fetch/AJAX, do it here.
        // For now we'll prevent default and show a small accessible confirmation, then close.
        e.preventDefault();
        // Simple accessible confirmation (could be replaced by toast)
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;
        // simulate success
        setTimeout(() => {
          if (submitBtn) submitBtn.disabled = false;
          close();
          // optional: alert for screen readers
          const sr = document.createElement('div');
          sr.setAttribute('role', 'status');
          sr.style.position = 'absolute';
          sr.style.left = '-9999px';
          sr.textContent = 'Formulario enviado. Gracias.';
          document.body.appendChild(sr);
          setTimeout(() => sr.remove(), 2000);
        }, 700);
      });
    }
  }

  /* ---------------------------
     TEAM / CV MODAL (nosotros.html)
  ----------------------------*/

  function initTeamModal() {
    // Support several ID variants used in your HTMLs:
    const modal = document.getElementById('cvModal') || document.getElementById('cv-modal') || document.querySelector('.modal-overlay#cvModal') || null;
    if (!modal) return;

    const iframe = modal.querySelector('#modalIframe') || modal.querySelector('#cv-iframe') || modal.querySelector('iframe');
    const titleEl = modal.querySelector('#modalTitle') || modal.querySelector('#modal-title') || modal.querySelector('.modal-title');
    const btnClose = modal.querySelector('#btnClose') || modal.querySelector('#btn-close') || modal.querySelector('.btn-close');
    const btnDownload = modal.querySelector('#btnDownload') || modal.querySelector('#btn-download') || modal.querySelector('.btn-download');
    const modalActions = modal.querySelector('.modal-actions') || modal.querySelector('.modal-actions') || null;

    // Cards that open CVs: selector '.card' inside .card-wrap
    const cardEls = $$('.card');

    function openCV(cvPath, name) {
      if (titleEl) titleEl.textContent = name ? `Currículo ${name}` : 'Currículo';
      if (iframe && cvPath) {
        // If it's a PDF or HTML, we set src. For PDF we keep download available.
        iframe.src = cvPath;
      }
      // Set download data
      if (btnDownload) {
        const isFile = typeof cvPath === 'string' && cvPath.toLowerCase().endsWith('.pdf');
        btnDownload.style.display = isFile ? 'inline-block' : 'inline-block'; // show regardless; controller below will set dataset
        btnDownload.dataset.href = cvPath || '';
      }
      openModal(modal, '.modal-panel');
    }

    function closeCV() {
      closeModal(modal, '.modal-panel');
    }

    // Wire cards
    cardEls.forEach((card) => {
      const cv = (card.getAttribute('data-cv') || '').trim();
      const name = card.getAttribute('data-name') || card.querySelector('h3')?.textContent || '';
      // click
      card.addEventListener('click', () => {
        if (cv) openCV(cv, name);
      });
      // keyboard accessibility (Enter / Space)
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
      // ensure it is announced as button
      card.setAttribute('role', 'button');
      if (!card.hasAttribute('tabindex')) card.setAttribute('tabindex', '0');
    });

    // Close button
    if (btnClose) btnClose.addEventListener('click', closeCV);

    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeCV();
    });

    // ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeCV();
    });

    // Download handling (delegation)
    if (modalActions) {
      modalActions.addEventListener('click', (e) => {
        const el = e.target;
        if (!el) return;
        if (el.classList.contains('btn-download') || el.classList.contains('btn-download')) {
          const href = el.dataset.href;
          if (href) {
            const a = document.createElement('a');
            a.href = href;
            // suggest filename if PDF
            a.download = '';
            a.rel = 'noopener';
            document.body.appendChild(a);
            a.click();
            a.remove();
          }
        }
      });
    } else if (btnDownload) {
      btnDownload.addEventListener('click', (e) => {
        const href = e.currentTarget.dataset.href;
        if (href) {
          const a = document.createElement('a');
          a.href = href;
          a.download = '';
          a.rel = 'noopener';
          document.body.appendChild(a);
          a.click();
          a.remove();
        }
      });
    }
  }

  /* ---------------------------
     ROTADOR (index.html) — accessible improvements
  ----------------------------*/

  function initRotator() {
    const rotator = document.querySelector('.rotator');
    if (!rotator) return;

    // If reduced motion, disable CSS animation by setting aria-hidden for items except first.
    if (REDUCED_MOTION) {
      const items = $$('.rotator .item', rotator);
      items.forEach((it, i) => {
        it.style.animation = 'none';
        it.style.opacity = i === 0 ? '1' : '0';
      });
      return;
    }

    // Pause animation when user hovers or focuses inside rotator to help screen reader users
    const items = $$('.rotator .item', rotator);
    function setPaused(paused) {
      items.forEach(it => {
        it.style.animationPlayState = paused ? 'paused' : 'running';
      });
    }
    rotator.addEventListener('mouseenter', () => setPaused(true));
    rotator.addEventListener('mouseleave', () => setPaused(false));
    rotator.addEventListener('focusin', () => setPaused(true));
    rotator.addEventListener('focusout', () => setPaused(false));
    // add aria-live region for screen readers (already present in HTML as aria-live on wrapper)
  }

  /* ---------------------------
     SCROLL + HASH handling (smooth, focus management)
  ----------------------------*/

  function initSmoothScroll() {
    // handle internal anchors: smooth scroll and focus heading
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', function (e) {
        // if anchor points to empty '#' ignore
        const href = this.getAttribute('href');
        if (!href || href === '#') return;
        const targetId = href.replace('#', '');
        const el = document.getElementById(targetId);
        if (!el) return;
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // focus the first heading inside section
        const heading = el.querySelector('h2, h1, h3');
        if (heading) {
          heading.setAttribute('tabindex', '-1');
          heading.focus();
        } else {
          el.setAttribute('tabindex', '-1');
          el.focus();
        }
        // update hash without jumping
        history.replaceState(null, '', '#' + targetId);
      });
    });

    // On load with hash
    window.addEventListener('load', () => {
      const hash = location.hash && location.hash.replace('#', '');
      if (!hash) return;
      const el = document.getElementById(hash);
      if (!el) return;
      // delay a tick so layout stabilizes
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    });
  }

  /* ---------------------------
     INIT
  ----------------------------*/

  function initAll() {
    try {
      initContactModal();
      initTeamModal();
      initRotator();
      initSmoothScroll();
      // global ESC behavior: close any open modal (extra safety)
      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const openModals = Array.from(document.querySelectorAll('.modal.open, .modal-overlay.open'));
        openModals.forEach(m => {
          closeModal(m);
        });
      });
    } catch (err) {
      // never break the page; log for debugging
      console.error('Error initializing site scripts:', err);
    }
  }

  // DOMContentLoaded vs immediate if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

})(); 
