const photoOfMe = document.querySelector('.photo-me') as HTMLElement | null;
const nooglerPhoto = document.querySelector('.photo-noogler') as HTMLElement | null;

function toggleNooglerPhoto() {
    if (photoOfMe) photoOfMe.classList.toggle('d-none');
    if (nooglerPhoto) nooglerPhoto.classList.toggle('d-none');
}

if (photoOfMe) {
    photoOfMe.addEventListener('mouseenter', () => {
        toggleNooglerPhoto();
    });
}

if (nooglerPhoto) {
    nooglerPhoto.addEventListener('mouseleave', () => {
        toggleNooglerPhoto();
    });
}
