document.addEventListener('DOMContentLoaded', () => {
    /* --- Theme Toggle --- */
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        htmlElement.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        htmlElement.setAttribute('data-theme', 'dark');
    } else {
        htmlElement.setAttribute('data-theme', 'light');
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            let currentTheme = htmlElement.getAttribute('data-theme');
            let newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            htmlElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    /* --- Mobile Hamburger Menu --- */
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('nav-active');
            hamburger.classList.toggle('toggle');
        });
    }

    // Close mobile menu when clicking a link
    if (navLinks) {
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navLinks.classList.contains('nav-active')) {
                    navLinks.classList.remove('nav-active');
                    if (hamburger) hamburger.classList.remove('toggle');
                }
            });
        });
    }


    /* --- Single Page Application Routing & View Fetching --- */
    const sections = document.querySelectorAll('.page-section');
    const loadedViews = {};

    // If sections are long and scrollable, animate elements when they appear
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    const observeNewElements = (container) => {
        const fadeElements = container.querySelectorAll('.fade-up');
        fadeElements.forEach(el => {
            scrollObserver.observe(el);
        });

        // TOC Scroll Spy Logic
        const blocks = container.querySelectorAll('#summary, .timeline-section-title');
        if (blocks.length > 0) {
            const tocObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const id = entry.target.getAttribute('id');
                        const links = document.querySelectorAll('.profile-toc a');
                        links.forEach(a => a.classList.remove('active-toc'));
                        const activeLink = document.querySelector(`.profile-toc a[data-scroll="${id}"]`);
                        if (activeLink) activeLink.classList.add('active-toc');
                    }
                });
            }, { rootMargin: '-100px 0px -50% 0px' });
            blocks.forEach(block => tocObserver.observe(block));
        }
    };

    // Function to load external HTML view
    const loadView = async (targetId) => {
        const section = document.getElementById(targetId);
        if (section && !loadedViews[targetId]) {
            try {
                const response = await fetch(`./views/${targetId}.html`, { cache: "no-store" });
                if (response.ok) {
                    const html = await response.text();
                    section.innerHTML = html;
                    loadedViews[targetId] = true;
                    // Observe new loaded elements
                    observeNewElements(section);

                    if (targetId === 'main' && typeof window.initParticles === 'function') {
                        window.initParticles();
                    }
                }
            } catch (error) {
                console.error(`Error loading view ${targetId}:`, error);
            }
        } else if (section && loadedViews[targetId]) {
            // Un-trigger and re-trigger animations if already loaded
            const animatedElem = section.querySelectorAll('.fade-up.visible');
            animatedElem.forEach(el => el.classList.remove('visible'));

            setTimeout(() => {
                const elToAnimate = section.querySelectorAll('.fade-up');
                elToAnimate.forEach(el => el.classList.add('visible'));
            }, 50);

            if (targetId === 'main' && typeof window.initParticles === 'function') {
                window.initParticles();
            }
        }
    };

    // Function to switch active section
    const navigateTo = async (targetId) => {

        // Fetch the view lazily
        await loadView(targetId);

        // Reset zoomed bubbles if returning without transition jitter
        document.querySelectorAll('.zoom-dive').forEach(sec => {
            sec.classList.remove('zoom-dive');
            sec.style.transformOrigin = '';
        });
        document.querySelectorAll('.gate-btn.zoom-active').forEach(btn => {
            btn.classList.add('zoom-resetting');
            btn.classList.remove('zoom-active');
            setTimeout(() => btn.classList.remove('zoom-resetting'), 50);
        });

        // Remove active class from all sections
        sections.forEach(sec => sec.classList.remove('active'));

        // Add active class to target
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'instant' });
        }
    };

    // Event Delegation for Nav Links and Data-Target Buttons (Handles newly loaded DOM inside views)
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a[data-target]');
        if (link) {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');

            if (link.classList.contains('gate-btn')) {
                const mainSec = document.getElementById('main');
                if (mainSec && mainSec.classList.contains('zoom-dive')) return;

                const rect = link.getBoundingClientRect();
                if (mainSec) {
                    mainSec.style.transformOrigin = `${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px`;
                    mainSec.classList.add('zoom-dive');
                }

                if (link.classList.contains('zoom-active')) return;
                link.classList.add('zoom-active');

                setTimeout(() => {
                    const newUrl = `#${targetId}`;
                    if (window.location.hash !== newUrl) {
                        window.history.pushState({ section: targetId }, '', newUrl);
                    }
                    navigateTo(targetId);
                }, 400); // Wait 400ms for snappier zoom transition
            } else {
                // Push state to history
                const newUrl = `#${targetId}`;
                if (window.location.hash !== newUrl) {
                    window.history.pushState({ section: targetId }, '', newUrl);
                }
                navigateTo(targetId);
            }
        }

        // Handle Table of Contents (TOC) smooth scrolling
        const scrollBtn = e.target.closest('[data-scroll]');
        if (scrollBtn) {
            e.preventDefault();
            const targetId = scrollBtn.getAttribute('data-scroll');
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });

    // Handle back/forward navigation
    window.addEventListener('popstate', (e) => {
        let hash = window.location.hash.substring(1);
        if (!hash) hash = 'main';
        navigateTo(hash);
    });

    // Initial load route handling
    let initialHash = window.location.hash.substring(1);
    if (!initialHash || !document.getElementById(initialHash)) {
        initialHash = 'main';
        window.history.replaceState({ section: initialHash }, '', `#${initialHash}`);
    }
    navigateTo(initialHash);
});
