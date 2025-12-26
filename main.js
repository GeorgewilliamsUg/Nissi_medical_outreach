// Main site JS (moved from inline script in index.html)
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

if (navToggle && navLinks) {
    // Toggle mobile nav and keep aria attribute in sync
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.addEventListener('click', () => {
        const opened = navLinks.classList.toggle('mobile-open');
        navToggle.setAttribute('aria-expanded', opened ? 'true' : 'false');
        const icon = navToggle.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-bars', !opened);
            icon.classList.toggle('fa-times', opened);
        }
    });

    // Close mobile nav when a link is clicked for better UX
    navLinks.addEventListener('click', (e) => {
        const target = e.target.closest('a');
        if (!target) return;
        if (navLinks.classList.contains('mobile-open')) {
            navLinks.classList.remove('mobile-open');
            navToggle.setAttribute('aria-expanded', 'false');
            const icon = navToggle.querySelector('i');
            if (icon) { icon.classList.remove('fa-times'); icon.classList.add('fa-bars'); }
        }
    });
}

// Back to Top Button
const backToTopButton = document.getElementById('backToTop');
if (backToTopButton) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopButton.classList.add('visible');
        } else {
            backToTopButton.classList.remove('visible');
        }
    });

    backToTopButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Optimized Scroll Observer
const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            
            const counter = entry.target.querySelector?.('.counter');
            if (counter && !counter.classList.contains('counted')) {
                const target = +counter.getAttribute('data-target');
                const suffix = counter.getAttribute('data-suffix') || '';
                let current = 0;
                const increment = target / 30;
                
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        counter.innerText = target + suffix;
                        clearInterval(timer);
                        counter.classList.add('counted');
                    } else {
                        counter.innerText = Math.ceil(current) + suffix;
                    }
                }, 50);
            }
            scrollObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.scroll-animate, .scroll-fade-left, .scroll-fade-right, .scroll-scale, .impact-animate').forEach(el => {
    scrollObserver.observe(el);
});

// FAQ Accordion (if present on page)
const faqItems = document.querySelectorAll?.('.faq-item') || [];
if (faqItems.length) {
    faqItems.forEach(item => {
        const question = item.querySelector?.('.faq-question');
        if (!question) return;
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            faqItems.forEach(other => other.classList.remove('active'));
            if (!isActive) item.classList.add('active');
        });
    });
}

// Donation form interactions (if donation form exists)
const amountBtns = document.querySelectorAll?.('.amount-btn') || [];
const customAmountWrapper = document.getElementById?.('customAmountWrapper');
if (amountBtns.length) {
    amountBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            amountBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (btn.dataset.amount === 'custom' && customAmountWrapper) {
                customAmountWrapper.style.display = 'block';
            } else if (customAmountWrapper) {
                customAmountWrapper.style.display = 'none';
            }
        });
    });
}

const methodBtns = document.querySelectorAll?.('.payment-method') || [];
if (methodBtns.length) {
    methodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            methodBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

const donationForm = document.getElementById?.('donationForm');
if (donationForm) {
    donationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        window.location.href = 'thank-you.html';
    });
}

// Events filter (missions page)
const eventFilter = document.getElementById?.('eventFilter');
if (eventFilter) {
    const cards = Array.from(document.querySelectorAll('.event-card'));
    const applyFilter = () => {
        const val = eventFilter.value;
        cards.forEach(card => {
            const month = card.getAttribute('data-month');
            if (val === 'all' || !month) {
                card.hidden = false;
            } else {
                card.hidden = (month !== val);
            }
        });
    };
    eventFilter.addEventListener('change', applyFilter);
}

// Keyboard activation for event cards: Enter/Space activates primary link
document.querySelectorAll('.event-card').forEach(card => {
    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            const link = card.querySelector('a');
            if (link) {
                e.preventDefault();
                link.focus();
                link.click();
            }
        }
    });
});

// End of main.js
