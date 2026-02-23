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

    /* --- Mobile Navigation --- */
    const hamburger = document.querySelector('.hamburger');
    const navLinksContainer = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-link');

    const toggleNav = () => {
        navLinksContainer.classList.toggle('nav-active');

        // Burger Animation
        hamburger.classList.toggle('toggle');
        const spans = hamburger.querySelectorAll('span');
        if (hamburger.classList.contains('toggle')) {
            spans[0].style.transform = 'rotate(-45deg) translate(-5px, 6px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(45deg) translate(-5px, -6px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    };

    hamburger.addEventListener('click', toggleNav);

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
    };

    // Function to load external HTML view
    const loadView = async (targetId) => {
        const section = document.getElementById(targetId);
        if (section && !loadedViews[targetId]) {
            try {
                const response = await fetch(`./views/${targetId}.html`);
                if (response.ok) {
                    const html = await response.text();
                    section.innerHTML = html;
                    loadedViews[targetId] = true;
                    // Observe new loaded elements
                    observeNewElements(section);
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
        }
    };

    // Function to switch active section
    const navigateTo = async (targetId) => {
        // Close mobile nav if open
        if (navLinksContainer.classList.contains('nav-active')) {
            toggleNav();
        }

        // Fetch the view lazily
        await loadView(targetId);

        // Remove active class from all sections
        sections.forEach(sec => sec.classList.remove('active'));

        // Add active class to target
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'instant' });
        }

        // Update nav active state
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-target') === targetId) {
                link.classList.add('active');
            }
        });
    };

    // Event Delegation for Nav Links and Data-Target Buttons (Handles newly loaded DOM inside views)
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a[data-target]');
        if (link) {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');

            // Push state to history
            const newUrl = `#${targetId}`;
            if (window.location.hash !== newUrl) {
                window.history.pushState({ section: targetId }, '', newUrl);
            }

            navigateTo(targetId);
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
