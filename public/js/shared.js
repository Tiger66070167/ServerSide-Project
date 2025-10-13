// ==============================================
// SHARED JAVASCRIPT
// FINAL VERSION - Includes pop-ups for Add, Edit, and Delete.
// ==============================================

// --- GLOBAL HELPER FUNCTIONS ---

function closeModal() {
    const modalContainer = document.getElementById('modalContainer');
    if (modalContainer) {
        modalContainer.style.display = 'none';
    }
}

async function openModal(url) {
    const modalContainer = document.getElementById('modalContainer');
    const modalContent = document.getElementById('modalContent');
    if (!modalContainer || !modalContent) return;
    
    modalContent.innerHTML = '<h3>Loading...</h3>';
    modalContainer.style.display = 'block'; 

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Could not load content from server.');
        modalContent.innerHTML = await response.text();
    } catch (error) {
        modalContent.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
}

function openConfirmationModal({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm }) {
    const modalContainer = document.getElementById('modalContainer');
    const modalContent = document.getElementById('modalContent');
    if (!modalContainer || !modalContent) return;
    
    modalContent.innerHTML = `
        <div class="confirmation-modal">
            <h3>${title}</h3>
            <p>${message}</p>
            <div class="confirmation-buttons">
                <button type="button" class="cancel-btn">${cancelText}</button>
                <button type="button" class="confirm-btn">${confirmText}</button>
            </div>
        </div>
    `;

    modalContent.querySelector('.confirm-btn').onclick = () => { onConfirm(); closeModal(); };
    modalContent.querySelector('.cancel-btn').onclick = closeModal;
    
    modalContainer.style.display = 'block'; 
}

/**
 * NEW: Opens a pop-up with a text input field, like a custom prompt.
 * @param {object} options - Configuration for the prompt modal.
 */
function openPromptModal({ title, label, confirmText = 'Save', defaultValue = '', onConfirm }) {
    const modalContainer = document.getElementById('modalContainer');
    const modalContent = document.getElementById('modalContent');
    if (!modalContainer || !modalContent) return;

    modalContent.innerHTML = `
        <h3>${title}</h3>
        <form class="prompt-modal-form">
            <label>${label}</label>
            <input type="text" id="promptInput" value="${defaultValue}" required>
            <div class="modal-actions">
                <button type="button" class="cancel-btn">Cancel</button>
                <button type="submit" class="confirm-btn">${confirmText}</button>
            </div>
        </form>
    `;

    const form = modalContent.querySelector('form');
    const input = modalContent.querySelector('#promptInput');
    const cancelBtn = modalContent.querySelector('.cancel-btn');

    // Automatically focus the input field for a better user experience
    setTimeout(() => input.focus(), 100);

    form.onsubmit = (event) => {
        event.preventDefault(); // Prevent page refresh
        if (input.value && input.value.trim() !== "") {
            onConfirm(input.value.trim()); // Pass the value to the callback
            closeModal();
        }
    };

    cancelBtn.onclick = closeModal;
    
    modalContainer.style.display = 'block';
}

// Global listener to close the modal on background click.
window.onclick = (event) => {
    if (event.target.id === 'modalContainer') {
        closeModal();
    }
}

// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;

    body.addEventListener('click', async (event) => {
        const target = event.target;
        const manageBtn = target.closest('.manage-categories-btn');
        if (manageBtn) {
            const menu = manageBtn.nextElementSibling;
            if (menu) {
                const isShowing = menu.classList.contains('show');
                closeAllCategoryMenus();
                if (!isShowing) {
                    updateCategoryMenuState(manageBtn.closest('.select-with-add').querySelector('.category-select'));
                    menu.classList.toggle('show');
                }
            }
            return;
        }
        if (target.closest('.add-category-btn')) handleAddCategory();
        if (target.closest('.edit-category-btn')) handleEditCategory(target);
        if (target.closest('.delete-category-btn')) handleDeleteCategory(target);
        if (!target.closest('.category-actions')) closeAllCategoryMenus();
    });

    // --- Handler Functions for Category Management ---

    /**
     * UPDATED: Opens a custom pop-up to add a new category.
     */
    function handleAddCategory() {
        openPromptModal({
            title: 'Add New Category',
            label: 'Category Name:',
            confirmText: 'Create',
            onConfirm: async (newCategoryName) => {
                try {
                    const response = await fetch('/categories/create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: newCategoryName })
                    });
                    if (!response.ok) throw new Error('Failed to create category.');
                    window.location.reload();
                } catch (error) {
                    alert('Could not add the new category.');
                }
            }
        });
    }

    /**
     * UPDATED: Opens a custom pop-up to edit the selected category.
     */
    function handleEditCategory(button) {
        const select = button.closest('.select-with-add').querySelector('.category-select');
        const selectedOption = select.options[select.selectedIndex];
        if (!selectedOption || !selectedOption.value) return;

        openPromptModal({
            title: 'Edit Category',
            label: 'New Category Name:',
            defaultValue: selectedOption.textContent,
            confirmText: 'Update',
            onConfirm: async (newName) => {
                if (newName === selectedOption.textContent) return; // No change needed
                try {
                    const response = await fetch(`/categories/${selectedOption.value}/update`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: newName })
                    });
                    if (!response.ok) throw new Error('Failed to update category.');
                    window.location.reload();
                } catch (error) {
                    alert('Could not update the category.');
                }
            }
        });
    }

    /**
     * FIXED: Shows a confirmation modal to delete the selected category.
     */
    function handleDeleteCategory(button) {
        const select = button.closest('.select-with-add').querySelector('.category-select');
        const selectedOption = select.options[select.selectedIndex];
        if (!selectedOption || !selectedOption.value) return;

        openConfirmationModal({
            title: 'Delete Category?',
            message: `Are you sure you want to delete "<strong>${selectedOption.textContent}</strong>"? Tasks will become uncategorized.`,
            confirmText: 'Yes, Delete',
            onConfirm: async () => {
                try {
                    const response = await fetch(`/categories/${selectedOption.value}/delete`, { method: 'POST' });
                    if (!response.ok) throw new Error('Server error.');
                    window.location.reload();
                } catch (error) {
                    alert('Could not delete the category.');
                }
            }
        });
        closeAllCategoryMenus();
    }

    // --- Helper Functions for UI ---
    function updateCategoryMenuState(selectElement) {
        const menu = selectElement.closest('.select-with-add').querySelector('.category-actions-menu');
        if (!menu) return;
        const hasSelection = selectElement.value !== "";
        menu.querySelectorAll('button').forEach(btn => btn.disabled = !hasSelection);
    }

    function closeAllCategoryMenus() {
        document.querySelectorAll('.category-actions-menu.show').forEach(menu => menu.classList.remove('show'));
    }

    document.querySelectorAll('.category-select').forEach(updateCategoryMenuState);
});
