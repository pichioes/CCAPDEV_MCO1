function setupReviewActions(button) {
    let container = button.closest('.review-actions');

    if (!container.dataset.initialized) {
        let likeBtn = container.querySelector('.like-btn');
        let dislikeBtn = container.querySelector('.dislike-btn');
        let likeCountElem = container.querySelector('.like-count');
        let dislikeCountElem = container.querySelector('.dislike-count');

        let likeCount = 0;
        let dislikeCount = 0;

        likeBtn.onclick = function() {
            likeCount++;
            likeCountElem.textContent = likeCount;
        };

        dislikeBtn.onclick = function() {
            dislikeCount++;
            dislikeCountElem.textContent = dislikeCount;
        };

        container.dataset.initialized = "true"; // Mark as initialized
    }
}