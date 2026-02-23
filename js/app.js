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
