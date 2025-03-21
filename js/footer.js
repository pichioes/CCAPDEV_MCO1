// footer.js
document.addEventListener('DOMContentLoaded', function() {
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
                footerContainer.innerHTML = html;
            })
            .catch(error => {
                console.error('Error loading footer:', error);
                footerContainer.innerHTML = '<p>Error loading footer</p>';
            });
    }
});
