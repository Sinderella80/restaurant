document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Navbar ---------- */
  var navbar = document.querySelector('.navbar');
  var navLinks = document.querySelector('.nav-links');
  window.addEventListener('scroll', function () {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  });
  document.querySelector('.nav-toggle').addEventListener('click', function () {
    navLinks.classList.toggle('open');
  });
  navLinks.addEventListener('click', function () { navLinks.classList.remove('open'); });

  /* ---------- Menu filter ---------- */
  var dishes = document.querySelectorAll('.card.dish');
  document.querySelectorAll('.filter').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filter').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var f = btn.dataset.filter;
      dishes.forEach(function (d) {
        d.classList.toggle('hide', f !== 'all' && d.dataset.cat !== f);
      });
    });
  });

  /* ---------- Dish modal ---------- */
  var modal = document.getElementById('dish-modal');
  var lastFocus = null;

  function formatPrice(n) { return Number(n).toLocaleString('en-US'); }

  function openModal(card) {
    var img = card.querySelector('img');
    document.getElementById('m-img').src = img.getAttribute('src');
    document.getElementById('m-img').alt = img.alt;
    document.getElementById('m-title').textContent = card.querySelector('h3').textContent.trim();
    document.getElementById('m-desc').textContent = card.dataset.desc;
    document.getElementById('m-cat').textContent = card.dataset.cat === 'drinks' ? 'Drinks' : 'Food';
    document.getElementById('m-price').innerHTML = formatPrice(card.dataset.price) + ' <small>SYP</small>';
    var list = document.getElementById('m-ing');
    list.innerHTML = '';
    card.dataset.ingredients.split(',').forEach(function (i) {
      var li = document.createElement('li');
      li.textContent = i.trim();
      list.appendChild(li);
    });
    lastFocus = document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.getElementById('m-close').focus();
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  dishes.forEach(function (card) {
    card.addEventListener('click', function () { openModal(card); });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(card); }
    });
  });
  document.getElementById('m-close').addEventListener('click', closeModal);
  document.getElementById('m-reserve').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });

  /* ---------- Reservation ---------- */
  var form = document.getElementById('reservation-form');
  var success = document.getElementById('res-success');
  var errorBox = document.getElementById('res-error');
  var dateInput = document.getElementById('r-date');
  var timeSel = document.getElementById('r-time');
  var guestsSel = document.getElementById('r-guests');

  // dates: today or later
  var now = new Date();
  var iso = function (d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  dateInput.min = iso(now);
  dateInput.value = iso(now);

  // time slots every 30 min from 12:00 to 23:30
  for (var h = 12; h < 24; h++) {
    [0, 30].forEach(function (m) {
      var label = ((h % 12) || 12) + ':' + (m === 0 ? '00' : '30') + (h < 12 ? ' AM' : ' PM');
      var opt = document.createElement('option');
      opt.value = String(h).padStart(2, '0') + ':' + (m === 0 ? '00' : '30');
      opt.textContent = label;
      timeSel.appendChild(opt);
    });
  }
  for (var g = 1; g <= 12; g++) {
    var o = document.createElement('option');
    o.value = g; o.textContent = g + (g === 1 ? ' guest' : ' guests');
    if (g === 2) o.selected = true;
    guestsSel.appendChild(o);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errorBox.textContent = '';
    var data = Object.fromEntries(new FormData(form).entries());
    var phoneDigits = (data.phone || '').replace(/\D/g, '');

    if (!data.name || data.name.trim().length < 2) return fail('Please enter your name.');
    if (phoneDigits.length < 7) return fail('Please enter a valid phone number.');
    if (!data.date) return fail('Please choose a date.');
    if (!data.time) return fail('Please choose a time.');
    var chosen = new Date(data.date + 'T' + data.time);
    if (chosen < new Date()) return fail('Please choose a time in the future.');

    var ref = 'RA-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    var booking = Object.assign({ ref: ref, createdAt: new Date().toISOString() }, data);
    try {
      var all = JSON.parse(localStorage.getItem('rama_reservations') || '[]');
      all.push(booking);
      localStorage.setItem('rama_reservations', JSON.stringify(all));
    } catch (err) { /* storage unavailable: ignore */ }

    var niceDate = chosen.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    var niceTime = timeSel.options[timeSel.selectedIndex].textContent;
    document.getElementById('res-summary').textContent =
      'Thank you ' + data.name.trim() + '. Table for ' + data.guests + ' (' + data.area + ') on ' + niceDate + ' at ' + niceTime + '.';
    document.getElementById('res-ref').textContent = ref;
    form.hidden = true;
    success.hidden = false;
    success.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  function fail(msg) { errorBox.textContent = msg; return false; }

  document.getElementById('res-new').addEventListener('click', function () {
    form.reset();
    dateInput.value = iso(new Date());
    guestsSel.value = 2;
    success.hidden = true;
    form.hidden = false;
  });
});
