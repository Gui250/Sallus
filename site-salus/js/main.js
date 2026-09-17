(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Mobile nav ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var navPrimary = document.getElementById("nav-primary");
  var navbar = document.querySelector(".navbar");

  if (navToggle && navPrimary) {
    function setNavOpen(isOpen, returnFocus) {
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
      navPrimary.classList.toggle("is-open", isOpen);
      document.body.classList.toggle("nav-open", isOpen);
      if (!isOpen && returnFocus) navToggle.focus();
    }

    navToggle.addEventListener("click", function () {
      setNavOpen(navToggle.getAttribute("aria-expanded") !== "true", false);
    });

    navPrimary.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setNavOpen(false, false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && navPrimary.classList.contains("is-open")) {
        setNavOpen(false, true);
      }
    });

    document.addEventListener("click", function (event) {
      if (!navPrimary.classList.contains("is-open")) return;
      if (navbar && event.target instanceof Node && !navbar.contains(event.target)) {
        setNavOpen(false, false);
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1120 && navPrimary.classList.contains("is-open")) {
        setNavOpen(false, false);
      }
    });
  }

  /* ---------- Header shadow on scroll ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Profundidade coordenada da hero ---------- */
  var tiltStage = document.querySelector("[data-tilt-stage]");
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  if (tiltStage && finePointer && !reduceMotion) {
    var tiltFrame = 0;

    function resetTilt() {
      tiltStage.classList.remove("is-tilting");
      tiltStage.style.setProperty("--tilt-x", "0deg");
      tiltStage.style.setProperty("--tilt-y", "0deg");
    }

    tiltStage.addEventListener("pointermove", function (event) {
      var pointerTarget = event.target;
      if (pointerTarget instanceof Element && pointerTarget.closest(".proposal-card")) {
        if (tiltStage.classList.contains("is-tilting")) resetTilt();
        return;
      }

      cancelAnimationFrame(tiltFrame);
      tiltFrame = requestAnimationFrame(function () {
        var rect = tiltStage.getBoundingClientRect();
        var x = (event.clientX - rect.left) / rect.width - 0.5;
        var y = (event.clientY - rect.top) / rect.height - 0.5;
        tiltStage.classList.add("is-tilting");
        tiltStage.style.setProperty("--tilt-x", (-y * 3).toFixed(2) + "deg");
        tiltStage.style.setProperty("--tilt-y", (x * 4).toFixed(2) + "deg");
      });
    }, { passive: true });

    tiltStage.addEventListener("pointerleave", resetTilt);
    tiltStage.addEventListener("focusin", resetTilt);
  }

  /* ---------- Active section in primary nav ---------- */
  var sectionLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  if (sectionLinks.length && "IntersectionObserver" in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        sectionLinks.forEach(function (link) {
          var isCurrent = link.getAttribute("href") === "#" + entry.target.id;
          if (isCurrent) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-22% 0px -68%", threshold: 0 });

    sectionLinks.forEach(function (link) {
      var section = document.querySelector(link.getAttribute("href"));
      if (section) sectionObserver.observe(section);
    });
  }

  /* ---------- Contadores (anos no hero, prazos de carência) ---------- */
  function countUp(el, target, suffix) {
    var start = null;
    var duration = 1200;
    function tick(timestamp) {
      if (!start) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  var sinceNumber = document.querySelector(".hero__since-number");
  if (sinceNumber) {
    var sinceTarget = parseInt(sinceNumber.getAttribute("data-count-to"), 10) || 0;
    if (reduceMotion) sinceNumber.textContent = sinceTarget;
    else countUp(sinceNumber, sinceTarget, "");
  }

  // "180 dias" -> conta 0..180 e mantém " dias". Sem JS/IO, o texto final fica como está.
  var periods = document.querySelectorAll(".timeline__period");
  if (periods.length && !reduceMotion && "IntersectionObserver" in window) {
    var periodObserver = new IntersectionObserver(function (entries) {
      entries.filter(function (entry) { return entry.isIntersecting; }).forEach(function (entry, i) {
        var el = entry.target;
        periodObserver.unobserve(el);
        setTimeout(function () {
          countUp(el, el._countTarget, el._countSuffix);
        }, i * 120); // cascata só entre os cards que entram juntos na tela
      });
    }, { threshold: 0.6 });

    periods.forEach(function (el) {
      var match = el.textContent.match(/^(\d+)(.*)$/);
      if (!match) return;
      // Leitor de tela ouve o valor final, nunca "0 dias".
      var srText = document.createElement("span");
      srText.className = "visually-hidden";
      srText.textContent = el.textContent;
      el.after(srText);
      el.setAttribute("aria-hidden", "true");
      el._countTarget = parseInt(match[1], 10);
      el._countSuffix = match[2];
      el.textContent = "0" + match[2];
      periodObserver.observe(el);
    });
  }

  /* ---------- Tracking (GTM/GA4 lê window.dataLayer quando instalado) ---------- */
  function track(event, params) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: event }, params));
  }

  document.addEventListener("click", function (event) {
    var clickTarget = event.target;
    if (!(clickTarget instanceof Element)) return;
    var link = clickTarget.closest("a[href]");
    if (!link) return;
    var href = link.getAttribute("href");
    if (href.indexOf("https://wa.me/") === 0) track("click_whatsapp", { link_location: link.className || "inline" });
    else if (href.indexOf("tel:") === 0) track("click_tel", { phone: href.slice(4) });
  });

  /* CTAs que saltam para o formulário pré-selecionam o plano e entregam o contexto ao leitor de tela. */
  var proposalTitle = document.getElementById("proposta-title");
  document.querySelectorAll('a[href="#proposta"]').forEach(function (link) {
    link.addEventListener("click", function () {
      var plano = link.getAttribute("data-plano");
      if (plano) {
        var radio = document.querySelector('input[name="your-plan"][value="' + plano + '"]');
        if (radio) radio.checked = true;
        track("plan_cta_click", { plano: plano });
      }

      if (!proposalTitle) return;
      requestAnimationFrame(function () {
        proposalTitle.focus({ preventScroll: true });
      });
    });
  });

  /* ---------- WhatsApp flutuante: some enquanto o formulário está visível ---------- */
  var whatsappFloat = document.querySelector(".whatsapp-float");
  var proposalForm = document.getElementById("contact-form");
  if (whatsappFloat && proposalForm && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      whatsappFloat.classList.toggle("is-hidden", entries[0].isIntersecting);
    }).observe(proposalForm);
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("current-year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* ---------- Fade-in sections ---------- */
  var fadeEls = document.querySelectorAll(".fade-in");
  if (fadeEls.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      fadeEls.forEach(function (el) {
        el.classList.add("is-visible");
      });
    } else {
      var fadeObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              fadeObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      fadeEls.forEach(function (el) {
        fadeObserver.observe(el);
      });
    }
  }

  /* ---------- Contact form -> WhatsApp ---------- */
  var form = document.getElementById("contact-form");
  var formStatus = document.getElementById("form-status");
  var phoneInput = document.getElementById("your-tel");

  // Número de vendas Salús (Advocacia Sergipana), com WhatsApp direto.
  var SALUS_WHATSAPP_NUMBER = "5579988295335";

  // Endpoint que recebe o lead (planilha, CRM, e-mail) ANTES de abrir o WhatsApp,
  // para não perder quem desiste de enviar a mensagem. Vazio = desligado.
  var LEAD_WEBHOOK_URL = "";

  function formatPhone(value) {
    var digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return "(" + digits.slice(0, 2) + ") " + digits.slice(2);
    if (digits.length <= 10) {
      return "(" + digits.slice(0, 2) + ") " + digits.slice(2, 6) + "-" + digits.slice(6);
    }
    return "(" + digits.slice(0, 2) + ") " + digits.slice(2, 7) + "-" + digits.slice(7);
  }

  if (phoneInput) {
    phoneInput.addEventListener("input", function () {
      phoneInput.value = formatPhone(phoneInput.value);
    });
  }

  if (form && formStatus) {
    var requiredFields = form.querySelectorAll("input[required]");

    function validateField(field) {
      var error = document.getElementById(field.id + "-error");
      var message = "";

      if (!field.validity.valid) {
        if (field.validity.valueMissing) {
          message = field.id === "your-tel" ? "Informe seu telefone com WhatsApp." : "Informe seu nome.";
        } else if (field.validity.tooShort) {
          message = field.id === "your-tel" ? "Digite o telefone com DDD." : "Digite pelo menos 3 caracteres.";
        } else {
          message = "Revise este campo.";
        }
      }

      field.setAttribute("aria-invalid", String(Boolean(message)));
      if (error) error.textContent = message;
      return !message;
    }

    requiredFields.forEach(function (field) {
      field.addEventListener("invalid", function (event) {
        event.preventDefault();
        validateField(field);
      });
      field.addEventListener("input", function () {
        validateField(field);
        if (formStatus.dataset.state === "error") {
          formStatus.textContent = "";
          delete formStatus.dataset.state;
        }
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!form.checkValidity()) {
        formStatus.dataset.state = "error";
        formStatus.textContent = "Revise os campos destacados para continuar.";
        var firstInvalid = form.querySelector("input:invalid");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var data = new FormData(form);
      var name = data.get("your-name") || "";
      var phone = data.get("your-tel") || "";
      var plano = data.get("your-plan") || "Ainda não sei";
      var submitButton = form.querySelector("button[type='submit']");

      track("generate_lead", { plano: plano });
      if (LEAD_WEBHOOK_URL && navigator.sendBeacon) {
        navigator.sendBeacon(LEAD_WEBHOOK_URL, new URLSearchParams({
          nome: name, telefone: phone, plano: plano, pagina: location.href
        }));
      }

      formStatus.dataset.state = "loading";
      formStatus.textContent = "Abrindo uma conversa segura no WhatsApp…";
      form.setAttribute("aria-busy", "true");
      if (submitButton) submitButton.disabled = true;

      var text =
        "Ola, Salus! Meu nome e " + name +
        ". Plano de interesse: " + plano +
        ". Telefone: " + phone +
        ". Gostaria de receber uma proposta de plano de saude.";

      var url = "https://wa.me/" + SALUS_WHATSAPP_NUMBER + "?text=" + encodeURIComponent(text);
      // Sem "noopener" nas features: com ele, window.open sempre retorna null
      // e o sucesso era reportado como erro. O opener é cortado manualmente.
      var opened = window.open(url, "_blank");
      if (opened) opened.opener = null;

      if (opened) {
        formStatus.dataset.state = "success";
        formStatus.textContent = "WhatsApp aberto. Envie a mensagem para concluir sua solicitação.";
      } else {
        formStatus.dataset.state = "error";
        formStatus.textContent = "O WhatsApp não abriu. ";
        var fallbackLink = document.createElement("a");
        fallbackLink.href = url;
        fallbackLink.textContent = "Abrir o WhatsApp nesta aba";
        formStatus.appendChild(fallbackLink);
        formStatus.append(" ou ligue para (79) 98829-5335.");
      }

      form.removeAttribute("aria-busy");
      if (submitButton) submitButton.disabled = false;
    });
  }
})();
