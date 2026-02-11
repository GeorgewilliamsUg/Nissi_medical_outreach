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

// Upcoming mission modal (Kikyusa)
const missionModal = document.getElementById('kikyusaMissionModal');
const missionTriggers = document.querySelectorAll('[data-mission-modal="kikyusa"]');

if (missionModal && missionTriggers.length) {
    const closeBtn = missionModal.querySelector('.mission-modal-close');
    let lastFocused = null;

    const openModal = () => {
        lastFocused = document.activeElement;
        missionModal.classList.add('is-open');
        missionModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        if (closeBtn) closeBtn.focus();
    };

    const closeModal = () => {
        missionModal.classList.remove('is-open');
        missionModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        if (lastFocused && typeof lastFocused.focus === 'function') {
            lastFocused.focus();
        }
    };

    missionTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    missionModal.addEventListener('click', (e) => {
        if (e.target === missionModal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && missionModal.classList.contains('is-open')) {
            closeModal();
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
const amountButtons = document.querySelectorAll('.amount-btn');
const donationAmountInput = document.getElementById('donationAmount');
const customAmountWrapper = document.getElementById('customAmountWrapper');
const customAmountInput = document.getElementById('customAmount');

if (amountButtons.length && donationAmountInput) {
    amountButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            amountButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const amount = btn.dataset.amount;

            if (amount === 'custom') {
                if (customAmountWrapper) {
                    customAmountWrapper.style.display = 'block';
                }
                donationAmountInput.value = '';
            } else {
                if (customAmountWrapper) {
                    customAmountWrapper.style.display = 'none';
                }
                donationAmountInput.value = amount;
            }
        });
    });
}

if (customAmountInput && donationAmountInput) {
    customAmountInput.addEventListener('input', () => {
        donationAmountInput.value = customAmountInput.value;
    });
}

const donationForm = document.getElementById('donationForm');

if (donationForm && !donationForm.dataset.pesapalUrl) {
    donationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const amount = document.getElementById('donationAmount').value;
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();

        const status = document.getElementById('donationStatus');
        const button = document.getElementById('donateBtn');

        if (!amount || Number(amount) <= 0) {
            alert('Please select or enter a valid donation amount.');
            return;
        }

        button.disabled = true;
        status.style.display = 'block';
        status.innerText = 'Redirecting to secure payment…';

        try {
            const response = await fetch(
                'https://pesapal-ipn-n3h3.onrender.com/ipn/create-order/',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        amount: amount,
                        currency: 'UGX',
                        description: 'Donation to Nissi Medical Outreach',
                        first_name: firstName,
                        last_name: lastName,
                        email: email
                    })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to initiate payment');
            }

            const data = await response.json();

            if (!data.checkout_url) {
                throw new Error('Missing checkout URL');
            }

            window.location.href = data.checkout_url;
        } catch (error) {
            console.error(error);
            status.innerText =
                'We could not start the payment. Please try again later.';
            button.disabled = false;
        }
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


document.querySelectorAll('.nissi-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const status = form.querySelector('.status-msg');
        const btn = form.querySelector('button');
        
        btn.disabled = true;
        btn.innerText = "Sending...";

        try {
            await fetch(form.action, { method: 'POST', body: new FormData(form)});
            status.style.display = "block";
            status.style.background = "#d4edda";
            status.innerText = "Thank you! We have received your message.";
            form.reset();
        } catch (err) {
            status.style.display = "block";
            status.style.background = "#f8d7da";
            status.innerText = "Error sending message. Please try again.";
        } finally {
            btn.disabled = false;
            btn.innerText = "Submit";
        }
    });
});

document.addEventListener("DOMContentLoaded", function() {
    // Select all elements that need decoding
    const encodedElements = document.querySelectorAll(".decode-contact");

    encodedElements.forEach(el => {
        try {
            // Decode the Base64 string
            const decoded = atob(el.dataset.encoded);
            
            // If it's a link (like an email or phone), update the href too
            if (el.tagName === 'A') {
                if (el.dataset.type === 'whatsapp') {
                    el.href = 'https://wa.me/' + decoded.replace(/\D/g, '');
                    return; // Don't overwrite content (icon) for WhatsApp links
                } else if (el.dataset.type === 'email-icon') {
                    el.href = 'mailto:' + decoded;
                    el.setAttribute('data-email', decoded);
                    return; // Don't overwrite content (icon) for Email links
                } else if (decoded.includes('@')) {
                    el.href = 'mailto:' + decoded;
                } else {
                    el.href = 'tel:' + decoded.replace(/\s/g, '');
                }
            }
            el.textContent = decoded;
        } catch (e) {
            console.error("Decoding error:", e);
        }
    });
});

// For your form success message
function showThankYou() {
    document.querySelector('form').style.display = 'none';
    document.getElementById('success-msg').style.display = 'block';
}

// --- Gallery Functionality ---
document.addEventListener('DOMContentLoaded', () => {
    // Filtering
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filterValue = btn.getAttribute('data-filter');

                galleryItems.forEach(item => {
                    if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
                        item.classList.remove('hide');
                    } else {
                        item.classList.add('hide');
                    }
                });
            });
        });
    }

    // Lightbox
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.lightbox-close');

    if (lightbox) {
        galleryItems.forEach(item => {
            item.addEventListener('click', () => {
                const img = item.querySelector('img');
                lightbox.style.display = 'flex';
                lightboxImg.src = img.src;
            });
        });

        closeBtn.addEventListener('click', () => {
            lightbox.style.display = 'none';
        });

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.style.display = 'none';
            }
        });
    }
});
