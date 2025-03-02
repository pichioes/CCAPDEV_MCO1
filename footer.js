// footer.js
document.addEventListener('DOMContentLoaded', function() {
    // Target element where footer will be inserted
    const footerContainer = document.getElementById('footer');

    if (footerContainer) {
        // Fetch the footer.html file
        fetch('/partials/footer.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load footer');
                }
                return response.text();
            })
            .then(html => {
                // Insert the footer HTML
                footerContainer.innerHTML = html;
            })
            .catch(error => {
                console.error('Error loading footer:', error);
                footerContainer.innerHTML = '<p>Error loading footer</p>';
            });
    }
});
