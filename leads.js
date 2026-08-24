/**
 * DAS Central Leads — drop-in client snippet.
 * Include once per site (before </body>):
 *   <script>window.DAS_LEADS_ENDPOINT='https://www.dasandpartnersengineering.com/leads/api/submit.php';
 *           window.DAS_LEADS_SITE='energytalks';</script>
 *   <script src="/assets/leads.js" defer></script>
 *
 * Then mark any form you want captured:
 *   <form data-das-lead data-form-type="contact"> ... inputs with name= ... </form>
 *
 * Field names it reads: name, email, phone, company, service, message
 * (message also falls back to a field named "project" or "enquiry").
 */
(function () {
    var ENDPOINT = window.DAS_LEADS_ENDPOINT;
    var SITE = window.DAS_LEADS_SITE || 'unknown';
    if (!ENDPOINT) { return; }

    function val(form, names) {
        for (var i = 0; i < names.length; i++) {
            var el = form.querySelector('[name="' + names[i] + '"]');
            if (el && el.value) { return el.value.trim(); }
        }
        return '';
    }

    function notify(form, msg, ok) {
        var box = form.querySelector('.das-lead-msg');
        if (!box) {
            box = document.createElement('div');
            box.className = 'das-lead-msg';
            box.style.cssText = 'margin-top:12px;padding:10px 14px;border-radius:8px;font-size:.9rem';
            form.appendChild(box);
        }
        box.style.background = ok ? 'rgba(16,185,129,.12)' : 'rgba(239,68,68,.12)';
        box.style.color = ok ? '#059669' : '#dc2626';
        box.textContent = msg;
    }

    function handle(form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            // honeypot: bots fill it, humans don't
            var hp = form.querySelector('[name="website"]');
            var payload = {
                site: form.getAttribute('data-site') || SITE,
                form_type: form.getAttribute('data-form-type') || 'contact',
                name: val(form, ['name', 'fullname', 'appName', 'full_name']),
                email: val(form, ['email', 'appEmail']),
                phone: val(form, ['phone', 'appPhone', 'mobile']),
                company: val(form, ['company', 'appCompany']),
                service: val(form, ['service', 'appService', 'subject']),
                message: val(form, ['message', 'project', 'appProject', 'enquiry', 'comments']),
                page_url: location.href,
                website: hp ? hp.value : ''
            };
            var btn = form.querySelector('[type="submit"]');
            var label = btn ? btn.textContent : '';
            if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

            fetch(ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).then(function (r) { return r.json(); })
              .then(function (res) {
                  if (res && res.ok) {
                      notify(form, res.message || 'Thank you — your enquiry has been received.', true);
                      form.reset();
                  } else {
                      notify(form, (res && res.error) || 'Something went wrong. Please try again.', false);
                  }
              })
              .catch(function () { notify(form, 'Network error. Please try again.', false); })
              .finally(function () { if (btn) { btn.disabled = false; btn.textContent = label; } });
        });
    }

    function init() {
        var forms = document.querySelectorAll('form[data-das-lead]');
        for (var i = 0; i < forms.length; i++) {
            // add honeypot if missing
            if (!forms[i].querySelector('[name="website"]')) {
                var hp = document.createElement('input');
                hp.type = 'text'; hp.name = 'website'; hp.tabIndex = -1; hp.autocomplete = 'off';
                hp.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0';
                forms[i].appendChild(hp);
            }
            handle(forms[i]);
        }
    }
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
    else { init(); }
})();
