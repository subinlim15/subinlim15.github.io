# Subin Lim - Personal Portfolio

A simple, modern, and minimalist single-page portfolio website built for GitHub Pages. 

## 🚀 Features

- **Single Page Application (SPA) Routing:** Seamlessly transition between Main, Profile, Study, and Personal Project sections without page reloads.
- **Dark/Light Mode Toggle:** A built-in theme toggle that remembers user preference using `localStorage`.
- **Minimalist Aesthetic:** Clean, soft-bordered layout prioritizing content over flashy colors.
- **Typography:** Uses the [Pretendard Variable](https://github.com/orioncactus/pretendard) font for high-quality, readable typography.
- **Responsive Design:** A mobile-friendly layout with a hamburger menu for smaller screens.

## 📂 Project Structure

```text
.
├── index.html        # Main HTML layout
├── css/
│   └── style.css     # CSS Variables, theming, and responsive styles
└── js/
    └── app.js        # Logic for routing, animations, and theme toggling
```

## 🛠️ Future Improvements

This document tracks upcoming modifications and features to be added to the portfolio:

- [ ] **Content Update:** Populate real projects, study logs, and experience details.
- [ ] **Content Formatting:** Format the projects and studies appropriately and create sub-pages or modals if needed.
- [ ] **SEO Optimization:** Enhance meta tags and structure for better discoverability.
- [ ] **Accessibility (a11y):** Improve screen reader support and keyboard navigation.
- [ ] **Contact Mechanisms:** Add a simple contact form or direct links for easy communication.

*(Feel free to append more ideas and checkboxes to this list as the project grows!)*

## 💻 Local Development

To run this project locally, you can use any static server. For example, using Python:

```bash
python3 -m http.server
```

Then visit `http://localhost:8000` in your web browser.

## 🌐 Deployment

This project is configured to run out-of-the-box on GitHub Pages. Push to the `main` branch and configure your repository settings to serve from the `main` branch root.
