function loadModal() {
    fetch('change_picture.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('reviewModalContainer').innerHTML = html;

            setTimeout(() => {
                document.getElementById('reviewModal').style.display = 'block';
                document.getElementById('modalOverlay').style.display = 'block';

                document.querySelector(".close-button").addEventListener("click", closeModal);
                document.getElementById("modalOverlay").addEventListener("click", closeModal);
                document.querySelector("#submitReviewButton").addEventListener("click", submitReview);
            }, 0);
        });
}

function closeModal() {
    document.getElementById('reviewModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
}

function submitReview(event) {
    event.preventDefault();

    let fileInput = document.getElementById("reviewImage");
    let file = fileInput.files[0];

    if (!file) {
        alert("Please select an image.");
        return;
    }

    let reader = new FileReader();
    reader.onload = function (e) {
        document.querySelector(".profile-img").src = e.target.result;
        alert("Picture Changed Successfully!");
        closeModal();
    };
    reader.readAsDataURL(file);
}
