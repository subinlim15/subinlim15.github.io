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
        const blocks = Array.from(container.querySelectorAll('.profile-card, .profile-info'));
        if (blocks.length > 0) {
            const visibleBlocks = new Set();
            const tocObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        visibleBlocks.add(entry.target);
                    } else {
                        visibleBlocks.delete(entry.target);
                    }
                });

                let topmost = null;
                let minTop = Infinity;
                visibleBlocks.forEach(block => {
                    const rect = block.getBoundingClientRect();
                    if (rect.top < minTop) {
                        minTop = rect.top;
                        topmost = block;
                    }
                });

                if (topmost) {
                    let id = topmost.id;
                    if (!id) {
                        const h3 = topmost.querySelector('.timeline-section-title');
                        if (h3) id = h3.id;
                    }
                    if (!id && topmost.classList.contains('profile-card')) {
                        id = 'introduction';
                    }

                    if (id) {
                        const links = document.querySelectorAll('.profile-toc a');
                        links.forEach(a => a.classList.remove('active-toc'));
                        const activeLink = document.querySelector(`.profile-toc a[data-scroll="${id}"]`);
                        if (activeLink) activeLink.classList.add('active-toc');
                    }
                }
            }, { rootMargin: '-10% 0px -60% 0px' });
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

        const targetSection = document.getElementById(targetId);
        if (!targetSection) return;

        // Reset zoomed bubbles without delay jitter
        document.querySelectorAll('.gate-btn.zoom-active').forEach(btn => {
            btn.classList.add('zoom-resetting');
            btn.classList.remove('zoom-active');
            setTimeout(() => btn.classList.remove('zoom-resetting'), 50);
        });

        // Simply hide old, show new
        sections.forEach(sec => sec.classList.remove('active'));
        targetSection.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'instant' });

        // Handle profile specific background animation
        if (targetId === 'profile' && typeof window.initCloudChamber === 'function') {
            window.initCloudChamber();
        } else if (typeof window.stopCloudChamber === 'function') {
            window.stopCloudChamber();
        }
    };

    // Event Delegation for Nav Links and Data-Target Buttons
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a[data-target]');
        if (link) {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');

            if (link.classList.contains('gate-btn')) {
                if (link.classList.contains('zoom-active')) return;
                link.classList.add('zoom-active');

                // Wait shortly for button to slightly expand before changing page
                setTimeout(() => {
                    const newUrl = `#${targetId}`;
                    if (window.location.hash !== newUrl) {
                        window.history.pushState({ section: targetId }, '', newUrl);
                    }
                    navigateTo(targetId);
                }, 200);
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
