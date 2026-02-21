/**
 * Theme Initialization Script
 * Moved from inline to separate file for CSP compliance
 */
(function() {
    try {
        var theme = localStorage.getItem('landingTheme') || 'light';
        document.body.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');
    } catch (e) {
        document.body.classList.add('theme-light');
    }
})();
