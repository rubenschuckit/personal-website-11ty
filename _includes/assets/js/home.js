const photoOfMe = document.querySelector('.photo-me');
const nooglerPhoto = document.querySelector('.photo-noogler');

function toggleNooglerPhoto() {
    photoOfMe.classList.toggle('d-none');
    nooglerPhoto.classList.toggle('d-none');
}

photoOfMe.addEventListener('mouseenter', () => {
    toggleNooglerPhoto();
});

nooglerPhoto.addEventListener('mouseleave', () => {
    toggleNooglerPhoto();
});