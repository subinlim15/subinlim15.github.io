document.addEventListener('DOMContentLoaded', () => {
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

    /* --- Single Page Application Routing --- */
    const sections = document.querySelectorAll('.page-section');
    
    // Function to switch active section
    const navigateTo = (targetId) => {
        // Close mobile nav if open
        if (navLinksContainer.classList.contains('nav-active')) {
            toggleNav();
        }

        // Remove active class from all sections
        sections.forEach(sec => {
            sec.classList.remove('active');
            
            // Un-trigger animations so they replay
            const animatedElem = sec.querySelectorAll('.fade-up.visible');
            animatedElem.forEach(el => el.classList.remove('visible'));
        });

        // Add active class to target
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'instant' });
            
            // Re-trigger animations after slight delay for transition
            setTimeout(() => {
                const elToAnimate = targetSection.querySelectorAll('.fade-up');
                elToAnimate.forEach(el => el.classList.add('visible'));
            }, 50);
        }

        // Update nav active state
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-target') === targetId) {
                link.classList.add('active');
            }
        });
    };

    // Listen to Nav Links and Buttons
    const routeLinks = document.querySelectorAll('a[data-target]');
    routeLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            
            // Push state to history
            const newUrl = `#${targetId}`;
            if (window.location.hash !== newUrl) {
                window.history.pushState({ section: targetId }, '', newUrl);
            }
            
            navigateTo(targetId);
        });
    });

    // Handle back/forward navigation
    window.addEventListener('popstate', (e) => {
        let hash = window.location.hash.substring(1);
        if (!hash) hash = 'main';
        navigateTo(hash);
    });

    /* --- Intersection Observer for Scroll Animations --- */
    // If sections are long and scrollable, animate elements when they appear
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Stop observing once animated
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-up');
    fadeElements.forEach(el => {
        scrollObserver.observe(el);
    });

    // Initial load route handling
    let initialHash = window.location.hash.substring(1);
    if (!initialHash || !document.getElementById(initialHash)) {
        initialHash = 'main';
        window.history.replaceState({ section: initialHash }, '', `#${initialHash}`);
    }
    navigateTo(initialHash);
});

/* Interactive Blob follows mouse cursor globally */
document.addEventListener('mousemove', (e) => {
    const blob = document.querySelector('.blob-1');
    const x = e.clientX;
    const y = e.clientY;
    
    // Slow, subtle movement based on mouse
    blob.style.transform = `translate(${x * 0.05}px, ${y * 0.05}px)`;
});
