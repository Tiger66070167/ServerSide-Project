async function openModal(url) {
    const res = await fetch(url);
    const html = await res.text();
    document.getElementById('modalContent').innerHTML = html;
    document.getElementById('modalContainer').style.display = 'block';
}

function closeModal() {
    document.getElementById('modalContainer').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('modalContainer');
    if (event.target === modal) closeModal();
}
