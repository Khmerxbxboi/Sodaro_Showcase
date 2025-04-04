// Listen for the scroll event on the window
window.addEventListener('scroll', function() {
    // Get the body, footer, and back-to-top button elements
    let body = document.body;
    let footer = document.querySelector('footer');
    let backToTop = document.querySelector('.back-to-top');

    // Check if the user has scrolled to the bottom
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 10) {
        footer.classList.add('show'); // Show the footer when at the bottom
    } else {
        footer.classList.remove('show'); // Hide the footer when not at the bottom
    }

    // Show or hide the back-to-top button based on scroll position
    if (window.scrollY > 100) {
        body.classList.add('scrolled'); // Add scrolled class to body to show back-to-top button
    } else {
        body.classList.remove('scrolled'); // Remove scrolled class to hide back-to-top button
    }
});

// Add a click event to scroll to the top with animation when the back-to-top button is clicked
document.querySelector('.back-to-top')?.addEventListener('click', function() {
    // Smooth scroll to the top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Optional: You can add some animation effects here like fading out the button
    let backToTop = document.querySelector('.back-to-top');
    backToTop.style.transition = 'opacity 0.3s ease';
    backToTop.style.opacity = '0'; // Fades out the button after click

    // Reset the opacity after the scroll is done
    setTimeout(() => {
        backToTop.style.opacity = '1'; // Fade it back in
    }, 300); // This matches the duration of the fade-out
});