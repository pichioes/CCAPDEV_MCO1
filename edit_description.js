async function loadED() {
    fetch('edit_description.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('reviewModalContainer').innerHTML = html;

            setTimeout(() => {
                document.getElementById('reviewModal').style.display = 'block';
                document.getElementById('modalOverlay').style.display = 'block';

                document.querySelector(".close-button").addEventListener("click", closeModal);
                document.getElementById("modalOverlay").addEventListener("click", closeModal);

                document.getElementById("submitReviewButton").addEventListener("click", changeDescription);
            }, 0);
        })
        .catch(error => console.error("Error loading modal:", error));
}


async function closeED() {
    document.getElementById('reviewModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
}

async function changeDescription(event) {
    event.preventDefault();

    const description = document.getElementById("reviewText").value;
    if (!description) {
        alert("Description cannot be empty!");
        return;
    }

    try {
        const response = await fetch('/edit-description', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description })
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            closeModal(); 
            window.location.reload(); 
        } else {
            alert("Update failed: " + (data.message || "Unknown error"));
        }
    } catch (error) {
        console.error("Error during fetch:", error);
        alert("An error occurred while updating the description.");
    }
}

