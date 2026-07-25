/**
 * ADM — Site vitrine / liste d'attente
 * Vanilla JS — pas de dépendance externe.
 */
(function () {
  'use strict';

  /* ---------- Année dans le footer ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Header : ombre au scroll ---------- */
  var header = document.getElementById('header');
  if (header) {
    var onScroll = function () {
      header.style.boxShadow = window.scrollY > 8 ? '0 4px 20px rgba(30,42,74,0.06)' : 'none';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- CTA "Rejoindre la liste d'attente" : scroll + focus email ---------- */
  document.querySelectorAll('[data-focus-target]').forEach(function (link) {
    link.addEventListener('click', function () {
      var targetSelector = link.getAttribute('data-focus-target');
      var targetField = document.querySelector(targetSelector);
      if (!targetField) return;
      window.setTimeout(function () { targetField.focus({ preventScroll: true }); }, 500);
    });
  });

  /* ---------- Domaine "Autre" : affiche le champ de précision ---------- */
  var domaineSelect = document.getElementById('su-domaine');
  var otherWrap = document.getElementById('suOtherWrap');
  if (domaineSelect && otherWrap) {
    domaineSelect.addEventListener('change', function () {
      var isOther = domaineSelect.value === 'Autre';
      otherWrap.hidden = !isOther;
      if (isOther) {
        var otherInput = otherWrap.querySelector('input');
        if (otherInput) otherInput.focus();
      }
    });
  }

  /* ---------- Validation & envoi des formulaires ----------
   * NOTE : ces formulaires n'ont pas de backend par défaut.
   * Voir le README.md ("Brancher les formulaires") pour les connecter
   * à Formspree, EmailJS ou votre propre API.
   */
  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function isValidPhone(value) {
    return /^[0-9+\s().-]{6,}$/.test(value);
  }

  function setFieldError(form, fieldId, message) {
    var field = form.querySelector('#' + fieldId);
    var errorEl = form.querySelector('[data-error-for="' + fieldId + '"]');
    var wrapper = field ? field.closest('.form-field') : null;

    if (errorEl) errorEl.textContent = message || '';
    if (wrapper) wrapper.classList.toggle('has-error', Boolean(message));
  }

  function showNote(form, message, type) {
    var note = form.querySelector('[data-form-note]');
    if (!note) return;
    note.textContent = message;
    note.className = 'form-note' + (type ? ' ' + type : '');
  }

  /* ----- Formulaire d'inscription (liste d'attente) ----- */
  var signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;

      var name = signupForm.querySelector('#su-name');
      var phone = signupForm.querySelector('#su-phone');
      var email = signupForm.querySelector('#su-email');
      var domaine = signupForm.querySelector('#su-domaine');

      setFieldError(signupForm, 'su-name', '');
      setFieldError(signupForm, 'su-phone', '');
      setFieldError(signupForm, 'su-email', '');
      setFieldError(signupForm, 'su-domaine', '');

      if (!name.value.trim()) {
        setFieldError(signupForm, 'su-name', 'Merci d\'indiquer votre nom ou celui de votre entreprise.');
        valid = false;
      }
      if (!isValidPhone(phone.value.trim())) {
        setFieldError(signupForm, 'su-phone', 'Numéro de téléphone invalide.');
        valid = false;
      }
      if (!isValidEmail(email.value.trim())) {
        setFieldError(signupForm, 'su-email', 'Adresse email invalide.');
        valid = false;
      }
      if (!domaine.value) {
        setFieldError(signupForm, 'su-domaine', 'Merci de sélectionner votre domaine.');
        valid = false;
      }

      if (!valid) {
        showNote(signupForm, 'Merci de corriger les champs en rouge avant d\'envoyer.', 'error');
        return;
      }

      // Pas de backend branché par défaut : voir README.md.
      // Remplacez ce bloc par un fetch() vers votre endpoint (Formspree, EmailJS, API...).
      showNote(signupForm, 'Merci, vous êtes inscrit·e ! Nous vous tiendrons informé·e des prochaines étapes du lancement d\'ADM.', 'success');
      // signupForm.reset();
    });
  }

  /* ----- Formulaire "Vos idées nous intéressent" ----- */
  var ideaForm = document.getElementById('ideaForm');
  if (ideaForm) {
    ideaForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;

      var idea = ideaForm.querySelector('#idea-text');
      var email = ideaForm.querySelector('#idea-email');

      setFieldError(ideaForm, 'idea-text', '');
      setFieldError(ideaForm, 'idea-email', '');

      if (!idea.value.trim()) {
        setFieldError(ideaForm, 'idea-text', 'Merci de partager votre idée avant d\'envoyer.');
        valid = false;
      }
      if (email.value.trim() && !isValidEmail(email.value.trim())) {
        setFieldError(ideaForm, 'idea-email', 'Adresse email invalide.');
        valid = false;
      }

      if (!valid) {
        showNote(ideaForm, 'Merci de corriger les champs en rouge avant d\'envoyer.', 'error');
        return;
      }

      showNote(ideaForm, 'Merci pour votre idée ! Nous la lisons avec attention.', 'success');
      // ideaForm.reset();
    });
  }

  /* ---------- Apparition au scroll ----------
   * (le hero — dont .signup-inline — a sa propre animation d'entrée CSS
   * déclenchée au chargement, voir css/style.css : pas de double-emploi ici) */
  var revealTargets = document.querySelectorAll(
    '.benefit-card, .mini-feature, .idea-form'
  );
  if ('IntersectionObserver' in window && revealTargets.length) {
    revealTargets.forEach(function (el) { el.style.opacity = '0'; el.style.transform = 'translateY(16px)'; el.style.transition = 'opacity .5s ease, transform .5s ease'; });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    revealTargets.forEach(function (el) { observer.observe(el); });
  }
})();
