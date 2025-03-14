// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get the search input, button and store cards
    const searchInput = document.querySelector('.search input');
    const searchButton = document.querySelector('.search button');
    const storeCards = document.querySelectorAll('.store-card');
    
    // Function to perform the search
    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        // If search term is empty, show all stores
        if (searchTerm === '') {
            storeCards.forEach(card => {
                card.style.display = 'flex';
            });
            return;
        }
        
        // Loop through each store card
        storeCards.forEach(card => {
            // Get the store name, location, and description
            const storeName = card.querySelector('h2').textContent.toLowerCase();
            const storeLocation = card.querySelector('p').textContent.toLowerCase();
            const storeDescription = card.querySelector('.rating').textContent.toLowerCase();
            
            // Check if the search term is in any of these fields
            if (storeName.includes(searchTerm) || 
                storeLocation.includes(searchTerm) || 
                storeDescription.includes(searchTerm)) {
                card.style.display = 'flex'; // Show the card
            } else {
                card.style.display = 'none'; // Hide the card
            }
        });
    }
    
    // Add event listener to the search button
    searchButton.addEventListener('click', performSearch);
    
    // Add event listener for Enter key press in the search input
    searchInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            performSearch();
        }
    });
    
    // Add event listener for input to enable real-time searching (optional)
    searchInput.addEventListener('input', performSearch);
});