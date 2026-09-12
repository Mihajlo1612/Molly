/* =========================================================
   Molly — animacije
   ========================================================= */
(function () {
    'use strict';

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var noHover = window.matchMedia('(hover: none)').matches;

    function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

    /* =====================================================
       Animacija teksta: deljenje na reči ili slova
       ===================================================== */
    function podeli(el) {
        if (el.dataset.podeljen) return;

        var pun = [].slice.call(el.childNodes).map(function (c) {
            return (c.nodeType === 1 && c.tagName === 'BR') ? ' ' : c.textContent;
        }).join('').replace(/\s+/g, ' ').trim();
        el.setAttribute('aria-label', pun);

        var poSlovima = el.dataset.split === 'slovo';
        var izvor = [].slice.call(el.childNodes);
        var frag = document.createDocumentFragment();
        var i = 0;

        izvor.forEach(function (cvor) {
            if (cvor.nodeType === 1 && cvor.tagName === 'BR') {
                frag.appendChild(document.createElement('br'));
                return;
            }

            var reci = cvor.textContent.replace(/\s+/g, ' ').split(' ')
                .filter(function (r) { return r.length; });

            reci.forEach(function (rec, ri) {
                var omot = document.createElement('span');
                omot.className = 'rec';

                var delovi = poSlovima ? Array.from(rec) : [rec];
                delovi.forEach(function (deo) {
                    var tok = document.createElement('span');
                    tok.className = 'tok';
                    tok.setAttribute('aria-hidden', 'true');
                    tok.style.setProperty('--i', i++);

                    var unutra = document.createElement('span');
                    unutra.className = 'in';
                    unutra.textContent = deo;

                    tok.appendChild(unutra);
                    omot.appendChild(tok);
                });

                frag.appendChild(omot);
                if (ri < reci.length - 1) frag.appendChild(document.createTextNode(' '));
            });
        });

        el.innerHTML = '';
        el.appendChild(frag);
        el.dataset.podeljen = '1';
    }

    var animNaslovi = [].slice.call(document.querySelectorAll('[data-anim]'));
    if (!reduce) {
        animNaslovi.forEach(function (el) {
            if (el.dataset.split) podeli(el);   /* razmak se ne deli, radi na celom naslovu */
        });
    }

    var heroTitle = document.getElementById('heroTitle');

    function playTitle() {
        if (heroTitle) heroTitle.classList.add('go');
    }

    /* ostali naslovi kreću kad uđu u vidno polje */
    animNaslovi.forEach(function (el) {
        if (el === heroTitle) return;
        var io = new IntersectionObserver(function (unosi) {
            if (unosi[0].isIntersecting) {
                el.classList.add('go');
                io.disconnect();
            }
        }, { threshold: 0.35 });
        io.observe(el);
    });

    /* =====================================================
       Paragrafi: red po red, sa merenjem stvarnog preloma
       ===================================================== */
    var PARAGRAFI = [
        '.hero-text p',
        '.section-sub',
        '.usluga-content p',
        '.nega-text p',
        '.proces-inner p',
        '.savet-uvod p',
        '.savet p',
        '.onama-text p',
        '.faq-intro p',
        '.kontakt-kolona p',
        '.footer-brand p',
        '.footer-kolona p'
    ].join(', ');

    /* oznaka za <br>: znak iz privatne zone, ne moze se pojaviti u tekstu */
    var PRELOM = '\uE000';

    /* rasturi na reči i izmeri koja je gde završila */
    function izmeriRedove(el) {
        el.innerHTML = '';
        el.dataset.pun.split(PRELOM).forEach(function (deo, di, sviDelovi) {
            var reci = deo.replace(/\s+/g, ' ').trim().split(' ')
                .filter(function (r) { return r.length; });

            reci.forEach(function (rec, ri) {
                var s = document.createElement('span');
                s.className = 'merac';
                s.textContent = rec;
                el.appendChild(s);
                if (ri < reci.length - 1) el.appendChild(document.createTextNode(' '));
            });

            if (di < sviDelovi.length - 1) el.appendChild(document.createElement('br'));
        });

        var redovi = [];
        var tekuci = null;
        var zadnjiVrh = null;

        [].slice.call(el.querySelectorAll('.merac')).forEach(function (s) {
            var vrh = s.offsetTop;
            if (zadnjiVrh === null || Math.abs(vrh - zadnjiVrh) > 2) {
                tekuci = [];
                redovi.push(tekuci);
                zadnjiVrh = vrh;
            }
            tekuci.push(s.textContent);
        });

        return redovi;
    }

    function podeliRedove(el) {
        if (!el.dataset.pun) {
            /* oznaka za <br> mora biti znak koji se ne može naći u tekstu —
               obični \n ne valja, jer ga formatiranje HTML-a već ubacuje */
            el.dataset.pun = [].slice.call(el.childNodes).map(function (c) {
                return (c.nodeType === 1 && c.tagName === 'BR') ? PRELOM : c.textContent;
            }).join('').replace(/\s+/g, ' ').trim();
        }

        el.setAttribute('aria-label', el.dataset.pun.split(PRELOM).join(' ').trim());

        /* prvi prolaz natera raspored da se slegne, drugi je merodavan */
        izmeriRedove(el);
        var redovi = izmeriRedove(el);

        el.innerHTML = '';
        redovi.forEach(function (reci, i) {
            var red = document.createElement('span');
            red.className = 'red';
            red.style.setProperty('--i', i);
            red.setAttribute('aria-hidden', 'true');

            var unutra = document.createElement('span');
            unutra.textContent = reci.join(' ');

            red.appendChild(unutra);
            el.appendChild(red);
        });

        el.dataset.podeljen = '1';
    }

    /* merimo tek kad su i fontovi i slike gotovi, inače je prelom pogrešan */
    function kadSveSpremno(fn) {
        var ucitano = document.readyState === 'complete'
            ? Promise.resolve()
            : new Promise(function (r) {
                window.addEventListener('load', r, { once: true });
            });

        /* setTimeout, a ne requestAnimationFrame — rAF ne okida u pozadinskom tabu */
        Promise.all([document.fonts.ready, ucitano]).then(function () {
            setTimeout(fn, 60);
        });
    }

    if (!reduce) {
        kadSveSpremno(function () {
            var pasusi = [].slice.call(document.querySelectorAll(PARAGRAFI));

            pasusi.forEach(function (el) {
                el.setAttribute('data-anim', 'paragraf-redovi');
                podeliRedove(el);
                el._sirina = Math.round(el.getBoundingClientRect().width);

                var io = new IntersectionObserver(function (unosi) {
                    if (unosi[0].isIntersecting) {
                        el.classList.add('go');
                        io.disconnect();
                    }
                }, { threshold: 0.25 });
                io.observe(el);
            });

            /* svaka promena širine menja prelom — premeri taj paragraf */
            if (window.ResizeObserver) {
                var ro = new ResizeObserver(function (unosi) {
                    unosi.forEach(function (u) {
                        var el = u.target;
                        var w = Math.round(u.contentRect.width);
                        if (el._sirina === w || el.dataset.podeljen !== '1') return;
                        el._sirina = w;

                        var odigrao = el.classList.contains('go');
                        podeliRedove(el);
                        if (odigrao) el.classList.add('odmah');
                    });
                });
                pasusi.forEach(function (el) { ro.observe(el); });
            }
        });
    }

    /* =====================================================
       Intro: logo se otkrije pa sleti u navbar
       ===================================================== */
    (function intro() {
        var screen = document.getElementById('introScreen');
        var introLogo = document.getElementById('introLogo');
        var navLogo = document.querySelector('.nav-brand img');

        if (!screen || !introLogo || !navLogo || reduce) {
            if (screen) screen.remove();
            document.body.classList.remove('intro-lock');
            playTitle();
            return;
        }

        window.addEventListener('load', function () {
            setTimeout(function () {
                var from = introLogo.getBoundingClientRect();
                var to = navLogo.getBoundingClientRect();

                var dx = (to.left + to.width / 2) - (from.left + from.width / 2);
                var dy = (to.top + to.height / 2) - (from.top + from.height / 2);
                var scale = to.width / from.width;

                introLogo.classList.add('intro-fly');
                introLogo.style.transform =
                    'translate(' + dx + 'px,' + dy + 'px) scale(' + scale + ')';
                screen.classList.add('intro-fade');

                playTitle();   // naslov kreće dok logo još leti

                /* transitionend zna da izostane (prekinut prelaz, tab u pozadini),
                   a bez njega bi stranica ostala zaključana — zato i sigurnosni rok */
                var zavrseno = false;
                function zavrsiIntro() {
                    if (zavrseno) return;
                    zavrseno = true;
                    document.body.classList.remove('intro-lock');
                    if (screen.parentNode) screen.remove();
                }

                introLogo.addEventListener('transitionend', zavrsiIntro, { once: true });
                setTimeout(zavrsiIntro, 1600);
            }, 2200);
        });
    })();

    /* =====================================================
       Brojači
       ===================================================== */
    var easeOutCubic = function (t) { return 1 - Math.pow(1 - t, 3); };

    function animateCounters(root, duration) {
        duration = duration || 2000;
        var nums = (root || document).querySelectorAll('.stat-num');
        if (!nums.length) return;

        nums.forEach(function (el) {
            var dec = +(el.dataset.decimals || 0);
            el.style.display = 'inline-block';
            el.textContent = (+el.dataset.target).toFixed(dec);
            el.style.minWidth = el.offsetWidth + 'px';
            el.textContent = (0).toFixed(dec);
        });

        var start = performance.now();

        (function tick(now) {
            var t = Math.min((now - start) / duration, 1);
            var eased = easeOutCubic(t);
            nums.forEach(function (el) {
                var dec = +(el.dataset.decimals || 0);
                el.textContent = (el.dataset.target * eased).toFixed(dec);
            });
            if (t < 1) requestAnimationFrame(tick);
        })(start);
    }

    document.fonts.ready.then(function () {
        document.querySelectorAll('.hero-stats, .onama-stats').forEach(function (group) {
            var io = new IntersectionObserver(function (entries) {
                if (entries[0].isIntersecting) {
                    animateCounters(group);
                    io.disconnect();
                }
            }, { threshold: 0.4 });
            io.observe(group);
        });
    });

    document.fonts.ready.then(function () {
        document.querySelectorAll('.hero-stats, .onama-stats').forEach(function (group) {
            var io = new IntersectionObserver(function (entries) {
                if (entries[0].isIntersecting) {
                    animateCounters(group);
                    io.disconnect();
                }
            }, { threshold: 0.4 });
            io.observe(group);
        });
    });

    /* =====================================================
       Nagib kartica
       ===================================================== */
    if (!noHover && !reduce) {
        document.querySelectorAll('.savet').forEach(function (card) {
            card.addEventListener('mousemove', function (e) {
                var r = card.getBoundingClientRect();
                var px = (e.clientX - r.left) / r.width - 0.5;
                var py = (e.clientY - r.top) / r.height - 0.5;
                card.style.transition = 'transform .12s linear';
                card.style.transform =
                    'rotateY(' + (px * 15) + 'deg) rotateX(' + (-py * 15) + 'deg) translateZ(22px)';
            });
            card.addEventListener('mouseleave', function () {
                card.style.transition = 'transform .5s cubic-bezier(.19,1,.22,1)';
                card.style.transform = '';
            });
        });
    }

    /* =====================================================
       Trag šapica (samo hero)
       ===================================================== */
        /* =====================================================
       Trag šapica po celoj stranici
       ===================================================== */
    if (!noHover && !reduce) {
        var pawLayer = document.createElement('div');
        pawLayer.className = 'paw-layer';
        document.body.appendChild(pawLayer);

        var pawSvg = '<svg class="paw" viewBox="0 0 24 24" aria-hidden="true">' +
            '<ellipse cx="12" cy="16.5" rx="6" ry="5"/>' +
            '<ellipse cx="4.6" cy="9.6" rx="2.5" ry="3.3"/>' +
            '<ellipse cx="9.6" cy="6" rx="2.5" ry="3.6"/>' +
            '<ellipse cx="14.6" cy="6" rx="2.5" ry="3.6"/>' +
            '<ellipse cx="19.4" cy="9.6" rx="2.5" ry="3.3"/></svg>';

        var lastX = 0, lastY = 0, flip = 1;

        document.addEventListener('mousemove', function (e) {
            if (Math.hypot(e.clientX - lastX, e.clientY - lastY) < 60) return;
            lastX = e.clientX;
            lastY = e.clientY;

            var pod = document.elementFromPoint(e.clientX, e.clientY);
            var zona = pod && pod.closest ? pod.closest('[data-rail]') : null;
            var svetlo = !!zona && zona.getAttribute('data-rail') === 'light';

            var holder = document.createElement('div');
            holder.innerHTML = pawSvg;
            var paw = holder.firstChild;

            paw.classList.add(svetlo ? 'na-roze' : 'na-belo');
            paw.style.left = (e.clientX - 13) + 'px';
            paw.style.top = (e.clientY - 13) + 'px';
            paw.style.rotate = (flip * 18 + Math.random() * 14 - 7) + 'deg';
            flip *= -1;

            pawLayer.appendChild(paw);
            setTimeout(function () { paw.remove(); }, 1100);
        });
    }

    /* =====================================================
       Jedna petlja: rail + traka napretka + traka slika
       ===================================================== */
    var pageWrap = document.getElementById('pageWrap');
    var rail = document.getElementById('rail');
    var railFill = document.getElementById('railFill');
    var railLinks = document.getElementById('railLinks');
    var railTrack = rail ? rail.querySelector('.rail-track') : null;
    var navProgress = document.getElementById('navProgress');
    var mqRow = document.querySelector('.transform-row');

    var links = railLinks ? [].slice.call(railLinks.querySelectorAll('.rail-link')) : [];
        var targets = links.map(function (l) {
        return document.querySelector(l.getAttribute('href'));
    });
    var tonovi = [].slice.call(document.querySelectorAll('[data-rail]'));

    var lastY = window.scrollY;
    var offset = 0;
    var half = 0;
    var scrollDirty = true;

    /* Traka slika. Sve je u pikselima po milisekundi, ne po frejmu, da bi
       brzina bila ista na 60 i na 144 Hz. `cilj` je dodatak koji donese skrol,
       `brzina` ga sustiže postepeno — to uglačavanje uklanja trzaje. */
    var OSNOVNA = 0.036;   /* px/ms — isto kao 0.6px po frejmu na 60 Hz */
    var GRANICA = 0.55;    /* najveći dodatak od skrola */
    var cilj = 0;
    var brzina = 0;
    var zadnjiT = 0;

    /* na vrhu stranice klasičan meni, čim se krene rail preuzima linkove.
       Stoji u samom osluškivaču, a ne u rAF petlji, da radi i kad tab nije u prvom planu. */
    function osveziMeni() {
        document.body.classList.toggle('skrol', window.scrollY > 10);
    }

    window.addEventListener('scroll', function () {
        cilj += (window.scrollY - lastY) * 0.010;
        if (cilj > GRANICA) cilj = GRANICA;
        if (cilj < -GRANICA) cilj = -GRANICA;
        lastY = window.scrollY;
        scrollDirty = true;
        osveziMeni();
    }, { passive: true });

    osveziMeni();

    window.addEventListener('resize', function () {
        half = 0;
        scrollDirty = true;
    }, { passive: true });

    function updateScroll() {
        if (!pageWrap) return;

        var max = Math.max(pageWrap.offsetHeight - window.innerHeight, 1);
        var p = clamp(window.scrollY / max, 0, 1);

        if (navProgress) navProgress.style.width = (p * 100) + '%';

                if (railTrack && railLinks) {
            var trackH = railTrack.clientHeight;
            railFill.style.height = (p * trackH) + 'px';
            railLinks.style.transform =
                'translateY(' + (p * (trackH - railLinks.offsetHeight)) + 'px)';

            var midY = railLinks.getBoundingClientRect().top + railLinks.offsetHeight / 2;
            var behind = null;
            var current = 0;

            tonovi.forEach(function (sec) {
                var r = sec.getBoundingClientRect();
                if (r.top <= midY && r.bottom > midY) behind = sec;
            });

            targets.forEach(function (sec, i) {
                if (!sec) return;
                if (sec.getBoundingClientRect().top <= window.innerHeight * 0.4) current = i;
            });

            rail.classList.toggle('on-light',
                !!behind && behind.getAttribute('data-rail') === 'light');
            links.forEach(function (l, i) {
                l.classList.toggle('active', i === current);
            });
        }
    }

    function frame(t) {
        if (scrollDirty) {
            updateScroll();
            scrollDirty = false;
        }

        if (mqRow && !reduce) {
            /* dt ograničen na 64ms: posle prebacivanja taba ne sme da skoči */
            var dt = zadnjiT ? Math.min(t - zadnjiT, 64) : 16.7;
            zadnjiT = t;
            var k = dt / 16.7;

            cilj *= Math.pow(0.90, k);                              /* skrol jenjava */
            brzina += (cilj - brzina) * (1 - Math.pow(0.82, k));    /* brzina ga meko sustiže */

            if (!half) half = mqRow.scrollWidth / 2;
            offset -= (OSNOVNA + brzina) * dt;

            if (half) {
                if (offset <= -half) offset += half;
                if (offset > 0) offset -= half;
            }

            /* translate3d drži traku na grafičkoj, bez ponovnog iscrtavanja slika */
            mqRow.style.transform =
                'translate3d(' + offset.toFixed(2) + 'px,0,0)';
        }

        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);

    /* =====================================================
   Usluge: pretapanje zakačene slike
   ===================================================== */
    (function usluge() {
        var blocks = document.querySelectorAll('.usluga-blok');
        var shots = document.querySelectorAll('.usluga-slika');
        if (!blocks.length || !shots.length) return;

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                var idx = +e.target.getAttribute('data-idx');
                shots.forEach(function (img, i) {
                    img.classList.toggle('is-on', i === idx);
                });
            });
        }, { rootMargin: '-45% 0px -45% 0px' });

        blocks.forEach(function (b) { io.observe(b); });
    })();

    /* =====================================================
   FAQ harmonika
   ===================================================== */
    (function faq() {
        var items = [].slice.call(document.querySelectorAll('.faq-item'));
        if (!items.length) return;

        items.forEach(function (item) {
            var btn = item.querySelector('.faq-q');
            btn.addEventListener('click', function () {
                var open = item.classList.contains('is-open');
                items.forEach(function (other) {
                    other.classList.remove('is-open');
                    other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
                });
                if (!open) {
                    item.classList.add('is-open');
                    btn.setAttribute('aria-expanded', 'true');
                }
            });
        });
    })();

})();