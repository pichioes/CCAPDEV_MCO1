document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('.search input');
    const searchButton = document.querySelector('.search button');
    const storeCards = document.querySelectorAll('.store-card');
    
    // Function: perform the search
    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        // if empty search, show all
        if (searchTerm === '') {
            storeCards.forEach(card => {
                card.style.display = 'flex';
            });
            return;
        }
        
        storeCards.forEach(card => {
            const storeName = card.querySelector('h2').textContent.toLowerCase();
            const storeLocation = card.querySelector('p').textContent.toLowerCase();
            const storeDescription = card.querySelector('.rating').textContent.toLowerCase();
            
            // checker
            if (storeName.includes(searchTerm) || 
                storeLocation.includes(searchTerm) || 
                storeDescription.includes(searchTerm)) {
                card.style.display = 'flex'; // show the card
            } else {
                card.style.display = 'none'; // hide the card
            }
        });
    }
    
    searchButton.addEventListener('click', performSearch);
    
    searchInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            performSearch();
        }
    });
    
    // real-time search updates
    searchInput.addEventListener('input', performSearch);
});