// ===== Brojači u hero sekciji =====
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

function animateCounters(duration = 2000) {
    const nums = document.querySelectorAll('.stat-num');
    if (!nums.length) return;

    // Fiksiraj širinu na konačan broj da se raspored ne pomera tokom animacije
    nums.forEach(el => {
        el.style.display = 'inline-block';
        el.textContent = el.dataset.target;
        el.style.minWidth = el.offsetWidth + 'px';
        el.textContent = '0';
    });

    const start = performance.now();

    function tick(now) {
        const t = Math.min((now - start) / duration, 1);
        const eased = easeOutCubic(t);
        nums.forEach(el => {
            el.textContent = Math.round(el.dataset.target * eased);
        });
        if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

// čekamo font da izmerena širina bude tačna
// ===== Pokreni brojače tek kad se doskroluje do njih =====
document.fonts.ready.then(() => {
    const stats = document.querySelector('.hero-stats');
    if (!stats) return;

    const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
            animateCounters();
            observer.disconnect();   // okida se samo prvi put
        }
    }, { threshold: 0.4 });

    observer.observe(stats);
});

// ===== Intro: logo se otkrije pa sleti u navbar =====
(function () {
    const screen = document.getElementById('introScreen');
    const introLogo = document.getElementById('introLogo');
    const navLogo = document.querySelector('.nav-brand img');
    if (!screen || !introLogo || !navLogo) return;

    window.addEventListener('load', () => {
        setTimeout(() => {
            const from = introLogo.getBoundingClientRect();
            const to = navLogo.getBoundingClientRect();

            // centar → centar + odnos veličina
            const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
            const dy = (to.top + to.height / 2) - (from.top + from.height / 2);
            const scale = to.width / from.width;

            introLogo.classList.add('intro-fly');
            introLogo.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
            screen.classList.add('intro-fade');

            introLogo.addEventListener('transitionend', () => {
                document.body.classList.remove('intro-lock');  // pokaže pravi logo
                screen.remove();
            }, { once: true });
        }, 2200);   // 0.2s delay + 1.6s wipe + 0.4s pauze
    });
})();