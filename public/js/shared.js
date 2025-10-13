document.addEventListener('DOMContentLoaded', () => {

    const body = document.body;

    // --- Main Click Handler for Category Actions ---
    body.addEventListener('click', async (event) => {
        const target = event.target;

        // --- Handle Add New Category ---
        if (target.closest('.add-category-btn')) {
            await handleAddCategory(target); // <-- Pass the button element
        }

        // --- Handle Manage Category Menu ---
        const manageBtn = target.closest('.manage-categories-btn');
        if (manageBtn) {
            const menu = manageBtn.nextElementSibling;
            if (menu) {
                const isShowing = menu.classList.contains('show');
                closeAllCategoryMenus();
                if (!isShowing) {
                    // Update menu state before showing
                    updateCategoryMenuState(manageBtn.closest('.select-with-add').querySelector('.category-select'));
                    menu.classList.toggle('show');
                }
            }
            return;
        }
        
        // --- Handle Edit/Delete from Menu ---
        if (target.closest('.edit-category-btn')) {
            await handleEditCategory(target);
            closeAllCategoryMenus();
        }
        if (target.closest('.delete-category-btn')) {
            await handleDeleteCategory(target);
            closeAllCategoryMenus();
        }

        // --- Close Menus on outside click ---
        if (!target.closest('.category-actions')) {
            closeAllCategoryMenus();
        }
    });

    // --- HANDLER FUNCTIONS ---
    async function handleAddCategory(button) {
        const newCategoryName = prompt("Enter new category name:");
        if (newCategoryName && newCategoryName.trim() !== "") {
            try {
                const response = await fetch('/categories/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newCategoryName.trim() })
                });

                if (!response.ok) throw new Error('Failed to create category');
                
                // Since we are reloading, we don't need to manually add the option.
                // The reload will fetch the new list of categories from the server.
                window.location.reload();

            } catch (error) {
                console.error('Error adding category:', error);
                alert('Could not add category.');
            }
        }
    }

    async function handleEditCategory(button) {
        const select = button.closest('.select-with-add').querySelector('.category-select');
        const selectedOption = select.options[select.selectedIndex];
        
        const newName = prompt("Enter new name for category:", selectedOption.textContent);
        if (newName && newName.trim() !== "" && newName.trim() !== selectedOption.textContent) {
            try {
                const response = await fetch(`/categories/${selectedOption.value}/update`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newName.trim() })
                });

                if (!response.ok) throw new Error('Failed to update category');
                
                // RELOAD THE PAGE to see the changes everywhere
                window.location.reload();

            } catch (error) {
                console.error('Error editing category:', error);
                alert('Could not update category.');
            }
        }
    }

    async function handleDeleteCategory(button) {
        const select = button.closest('.select-with-add').querySelector('.category-select');
        const selectedOption = select.options[select.selectedIndex];

        if (confirm(`Are you sure you want to delete "${selectedOption.textContent}"?`)) {
            fetch(`/categories/${selectedOption.value}/delete`, { method: 'POST' })
            .then(response => {
                // 1. ตรวจสอบว่า server ตอบกลับมาว่า OK หรือไม่
                if (!response.ok) {
                    // ถ้าไม่ OK, ให้โยน Error เพื่อให้ .catch() ทำงาน
                    throw new Error('Server responded with an error.');
                }
                // 2. ถ้า OK, ให้ return response (เพื่อให้ .then() ถัดไปทำงานได้)
                return response.json(); 
            })
            .then(data => {
                // 3. เมื่อทุกอย่างสำเร็จเรียบร้อยดี ค่อย Reload หน้าเว็บ
                console.log('Delete successful:', data.message);
                window.location.reload();
            })
            .catch(error => {
                // 4. ถ้ามี Error เกิดขึ้นที่ขั้นตอนไหนก็ตาม ให้แสดง Alert
                console.error('Error deleting category:', error);
                alert('Could not delete category. Please check the server logs.');
            });
        }
    }

    // --- HELPER FUNCTIONS ---
    function updateCategoryMenuState(selectElement) {
        const menu = selectElement.closest('.select-with-add').querySelector('.category-actions-menu');
        if (!menu) return;
        
        const editBtn = menu.querySelector('.edit-category-btn');
        const deleteBtn = menu.querySelector('.delete-category-btn');
        
        const isActionable = selectElement.value !== "";
        editBtn.disabled = !isActionable;
        deleteBtn.disabled = !isActionable;
    }

    function closeAllCategoryMenus() {
        document.querySelectorAll('.category-actions-menu.show').forEach(menu => {
            menu.classList.remove('show');
        });
    }

    // Initialize state for all menus on load
    document.querySelectorAll('.category-select').forEach(updateCategoryMenuState);
});
