// ==============================================
// KANBAN BOARD JAVASCRIPT (refactored)
// ==============================================
//
// Sections:
// 0. Config & Globals
// 1. Modal Handling
// 2. DOM Helpers
// 3. Event Handlers
// 4. Sortable Initialization
// 5. Event Listeners Initialization
// 6. Boot (DOMContentLoaded)
// ==============================================

(() => {
    // ==================================================
    // 0. CONFIG & GLOBALS
    // ==================================================
    const SORTABLE_ANIMATION = 150;
    const sortableOptions = {
        group: 'kanban',
        animation: SORTABLE_ANIMATION,
        onEnd: function (evt) {
            const cardId = evt.item.dataset.cardId;
            const newListId = evt.to.dataset.listId;
            fetch(`/cards/${cardId}/move`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ newListId: newListId }),
            })
            .then(res => res.json())
            .then(data => console.log(data.message))
            .catch(err => console.error('Error:', err));
        }
    };

    let currentlyEditingElement = null;

    // ==================================================
    // 1. MODAL HANDLING
    // ==================================================
    const openModal = () => {
        document.getElementById('modalContainer').style.display = 'block';
    };

    const closeModal = () => {
        document.getElementById('modalContainer').style.display = 'none';
        document.getElementById('modalContent').innerHTML = '';
        currentlyEditingElement = null;
    };

    // ==================================================
    // 2. DOM HELPERS
    // ==================================================
    const showToast = (message, type = 'success') => {
        Toastify({
            text: message,
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
            stopOnFocus: true,
            style: {
                background: type === 'success' ? "linear-gradient(to right, #00b09b, #96c93d)" : "linear-gradient(to right, #ff5f6d, #ffc371)",
            },
        }).showToast();
    };

    const showComposer = (listElement) => {
        listElement.querySelector('.add-card-button').style.display = 'none';
        const composer = listElement.querySelector('.add-card-composer');
        composer.style.display = 'block';
        composer.querySelector('textarea').focus();
    };

    const hideComposer = (listElement) => {
        const composer = listElement.querySelector('.add-card-composer');
        composer.style.display = 'none';
        composer.querySelector('form').reset();
        listElement.querySelector('.add-card-button').style.display = 'block';
    };

    const createListElement = (list) => {
        const listDiv = document.createElement('div');
        listDiv.className = 'kanban-list';
        listDiv.dataset.listId = list.list_id;
        listDiv.innerHTML = `
            <div class="list-header">
                <h3 class="list-title">${list.title}</h3>
                <div class="list-actions">
                    <button class="list-actions-btn" title="List actions"><i class="fas fa-ellipsis-h"></i></button>
                    <div class="list-actions-menu">
                        <button class="edit-list-btn">Edit</button>
                        <button class="delete-list-btn">Delete</button>
                    </div>
                </div>
            </div>
            <div class="list-cards" data-list-id="${list.list_id}"></div>
            <div class="add-card-composer">
                <form action="/lists/${list.list_id}/cards/create" method="POST" class="add-card-form">
                    <textarea name="description" placeholder="Enter a title for this card..." required></textarea>
                    <div class="composer-actions">
                        <button type="submit" class="add">Add Card</button>
                        <button type="button" class="cancel">&times;</button>
                    </div>
                </form>
            </div>
            <button class="add-card-button"><i class="fas fa-plus"></i> Add a card</button>`;
        return listDiv;
    };

    const createCardElement = (card) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'kanban-card';
        cardDiv.dataset.cardId = card.card_id;
        cardDiv.innerHTML = `
            <button class="card-toggle-btn" title="Toggle status"><i class="far fa-square"></i></button>
            <span class="card-description">${card.description}</span>
            <div class="card-actions">
                <button class="card-action-btn edit" title="Edit card"><i class="fas fa-pen"></i></button>
                <button class="card-action-btn delete" title="Delete card"><i class="fas fa-trash"></i></button>
            </div>`;
        return cardDiv;
    };

    const createEditCardFormHtml = (card) => `
        <h3>Edit Card</h3>
        <form id="edit-card-form" action="/cards/${card.card_id}/update" method="POST">
            <label for="card-description">Description:</label>
            <textarea id="card-description" name="description" required>${card.description}</textarea>
            <button type="submit">Update Card</button>
        </form>
    `;

    const createEditListFormHtml = (listElement) => `
        <h3>Edit List Title</h3>
        <form id="edit-list-form" action="/lists/${listElement.dataset.listId}/update" method="POST">
            <label for="list-title">Title:</label>
            <input type="text" id="list-title" name="title" value="${listElement.querySelector('.list-title').textContent}" required>
            <button type="submit">Update Title</button>
        </form>
    `;

    function checkListCompletion(listElement) {
    if (!listElement) return;
    // หา ปุ่ม Complete List
    const completeBtn = listElement.querySelector('.complete-list-btn');
    if (!completeBtn) {
        return; 
    }

    // ตรวจสอบว่ามีการ์ดในลิสต์หรือไม่ และถ้ามีทั้งหมดเป็น done หรือไม่
    const cards = listElement.querySelectorAll('.kanban-card');
    const doneCards = listElement.querySelectorAll('.kanban-card.done');
    if (cards.length > 0 && cards.length === doneCards.length) {
        completeBtn.disabled = false;
    } else {
        completeBtn.disabled = true;
    }
}

    // ==================================================
    // 3. EVENT HANDLERS
    // ==================================================
    const handleOpenEditCardModal = async (cardElement) => {
        const cardId = cardElement.dataset.cardId;
        const modalContent = document.getElementById('modalContent');

        currentlyEditingElement = cardElement.querySelector('.card-description');

        modalContent.innerHTML = '<h3>Loading...</h3>';
        openModal();
        try {
            const response = await fetch(`/cards/${cardId}`);
            if (!response.ok) throw new Error('Card not found');
            const cardData = await response.json();
            modalContent.innerHTML = createEditCardFormHtml(cardData);
            document.getElementById('edit-card-form').addEventListener('submit', handleUpdateCardSubmit);
        } catch (error) {
            showToast(error.message, 'error');
            closeModal();
        }
    };

    const handleUpdateCardSubmit = async (event) => {
        event.preventDefault();
        const form = event.target;
        const description = form.elements.description.value.trim();
        const cardId = form.action.split('/')[2];
        if (!description) return;
        try {
            const response = await fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description }) });
            if (!response.ok) throw new Error('Failed to update card on server');

            if (currentlyEditingElement) {
                currentlyEditingElement.textContent = description;
            }

            closeModal();
            showToast("Card updated successfully!");
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    const handleAddListSubmit = async (event) => {
        event.preventDefault();
        const form = event.target;
        const titleInput = form.elements.title;
        const title = titleInput.value.trim();
        if (!title) return;
        try {
            const response = await fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) });
            if (!response.ok) throw new Error('Server error');
            const newList = await response.json();
            const newListElement = createListElement(newList);
            const board = document.querySelector('.kanban-board');
            board.insertBefore(newListElement, form.parentElement);
            initializeSortableForList(newListElement);
            newListElement.querySelector('.add-card-form').addEventListener('submit', handleAddCardSubmit);
            form.reset();
            newListElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'end' });
        } catch (error) {
            console.error('Failed to add list:', error);
            showToast('Could not add list.', 'error');
        }
    };

    const handleAddCardSubmit = async (event) => {
        event.preventDefault();
        const form = event.target;
        const textarea = form.querySelector('textarea');
        const description = textarea.value.trim();
        if (!description) return;
        try {
            const response = await fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description }) });
            if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'Server error'); }
            const newCard = await response.json();
            const newCardElement = createCardElement(newCard);
            form.closest('.kanban-list').querySelector('.list-cards').appendChild(newCardElement);
            hideComposer(form.closest('.kanban-list'));
            showToast("Card added successfully!");
        } catch (error) {
            console.error('Failed to add card:', error);
            showToast(`Could not add card: ${error.message}`, "error");
        }
    };

    const handleOpenEditListModal = (listElement) => {
        const modalContent = document.getElementById('modalContent');
        const titleElement = listElement.querySelector('.list-title');

        currentlyEditingElement = titleElement;
        modalContent.innerHTML = createEditListFormHtml(listElement);
        openModal();
        document.getElementById('edit-list-form').addEventListener('submit', handleUpdateListSubmit);
    };

    const handleUpdateListSubmit = async (event) => {
        event.preventDefault();
        const form = event.target;
        const newTitle = form.elements.title.value.trim();
        const listId = form.action.split('/')[2];

        if (!newTitle) return;

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle })
            });

            if (!response.ok) throw new Error('Failed to update list');

            if (currentlyEditingElement) {
                currentlyEditingElement.textContent = newTitle;
            }

            closeModal();
            showToast("List title updated successfully!");
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    const handleDeleteList = (listElement) => {
        if (confirm("Delete this list and all its cards?")) {
            const listId = listElement.dataset.listId;
            fetch(`/lists/${listId}/delete`, { method: 'POST' })
            .then(res => {
                if (res.ok) {
                    listElement.remove();
                    showToast("List deleted!");
                } else {
                    throw new Error('Failed');
                }
            })
            .catch(() => showToast("Error deleting list", "error"));
        }
    };

    const handleDeleteCard = (cardElement) => {
        if (confirm("Delete this card?")) {
            const cardId = cardElement.dataset.cardId;
            fetch(`/cards/${cardId}/delete`, { method: 'POST' })
            .then(res => {
                if (res.ok) {
                    cardElement.remove();
                    showToast("Card deleted!");
                } else {
                    throw new Error('Failed');
                }
            })
            .catch(() => showToast("Error deleting card", "error"));
        }
    };

    async function handleToggleCardStatus(cardElement) {
            const cardId = cardElement.dataset.cardId;

            // Debug log
            console.log(`Toggling status for card ID: ${cardId}`);

            try {
                const response = await fetch(`/cards/${cardId}/toggle`, { method: 'POST' });
                
                // Debug log
                console.log('Server response:', response.status);

                if (!response.ok) throw new Error('Failed to update status');
                const updatedCard = await response.json();

                // Debug log
                console.log('Received updated card data:', updatedCard);

                // อัปเดต UI
                const icon = cardElement.querySelector('.card-toggle-btn i');
                if (updatedCard.is_done) {
                    cardElement.classList.add('done');
                    icon.classList.remove('fa-square');
                    icon.classList.add('fa-check-square');
                } else {
                    cardElement.classList.remove('done');
                    icon.classList.add('fa-square');
                    icon.classList.remove('fa-check-square');
                }

                // ตรวจสอบสถานะ List ทุกครั้งที่ Card เปลี่ยน
                checkListCompletion(cardElement.closest('.kanban-list'));

            } catch (error) {
                console.error('Error toggling card status:', error);
                showToast(error.message, 'error');
            }
        }
        
        async function handleCompleteList(listElement) {
            const listId = listElement.dataset.listId;
            if (!confirm('Are you sure you want to complete this list? This action cannot be undone.')) return;

            try {
                const response = await fetch(`/lists/${listId}/complete`, { method: 'POST' });
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'Server validation failed');
                }
                listElement.classList.add('done');
                showToast('List completed!');

                checkTaskCompletion();

            } catch (error) {
                showToast(error.message, 'error');
            }
        }

            async function handleCompleteTask() {
        if (!confirm('Are you sure you want to complete the entire task? This will archive the task.')) return;

        // ดึง taskId จาก URL ของหน้า (วิธีที่ไม่ต้องใช้ EJS)
        const taskId = window.location.pathname.split('/')[1]; 

        try {
            const response = await fetch(`/${taskId}/complete`, { method: 'POST' });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Server validation failed');
            }

            showToast('Task completed! Redirecting...');

            // รอ 2 วินาทีเพื่อให้ Toast แสดง แล้วค่อย Redirect
            setTimeout(() => {
                window.location.href = '/'; 
            }, 2000);

        } catch (error) {
            showToast(error.message, 'error');
        }
    }


    function checkTaskCompletion() {
        const allLists = document.querySelectorAll('.kanban-list:not(.add-new-list)');
        const doneLists = document.querySelectorAll('.kanban-list.done');
        const completeTaskBtn = document.getElementById('complete-task-btn');

        if (!completeTaskBtn) return;

        if (allLists.length > 0 && allLists.length === doneLists.length) {
            completeTaskBtn.disabled = false;
        } else {
            completeTaskBtn.disabled = true;
        }
    }


    // ==================================================
    // 4. SORTABLE INITIALIZATION
    // ==================================================
    const initializeBoardSortable = () => {
        const boardContainer = document.querySelector('.kanban-board');
        if (!boardContainer) return;

        // Sortable for lists (dragging whole lists)
        new Sortable(boardContainer, {
            animation: SORTABLE_ANIMATION,
            draggable: '.kanban-list:not(.add-new-list)',
            onEnd: function(evt) {
                const listElements = Array.from(boardContainer.querySelectorAll('.kanban-list:not(.add-new-list)'));
                const listIds = listElements.map(el => el.dataset.listId);
                fetch('/lists/reorder', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ listIds: listIds })
                })
                .then(res => res.json())
                .then(data => console.log(data.message))
                .catch(err => showToast('Failed to save new order', 'error'));
            }
        });
    };

    const initializeSortable = () => {
        const cardContainers = document.querySelectorAll('.list-cards');
        cardContainers.forEach(container => new Sortable(container, sortableOptions));
    };

    const initializeSortableForList = (listElement) => {
        const container = listElement.querySelector('.list-cards');
        if (container) new Sortable(container, sortableOptions);
    };

    // ==================================================
    // 5. EVENT LISTENERS INITIALIZATION
    // ==================================================
    const initializeAllEventListeners = () => {
        const board = document.querySelector('.kanban-board');
        if (!board) return;

        // --- SINGLE, UNIFIED EVENT LISTENER FOR THE ENTIRE DOCUMENT ---
        document.addEventListener('click', (event) => {
            const target = event.target;
            const clickedList = target.closest('.kanban-list');
            let stopPropagation = false; // Flag to prevent multiple actions

            // --- Priority 1: Actions within a specific element ---
            
            // Toggle Card Status
            if (target.closest('.card-toggle-btn')) {
                handleToggleCardStatus(target.closest('.kanban-card'));
                stopPropagation = true;
            }
            // Complete List
            else if (target.closest('.complete-list-btn')) {
                handleCompleteList(target.closest('.kanban-list'));
                stopPropagation = true;
            }
            // Show Composer
            else if (target.closest('.add-card-button')) {
                showComposer(clickedList);
                stopPropagation = true;
            }
            // Hide Composer via Cancel button
            else if (target.closest('.add-card-composer .cancel')) {
                hideComposer(clickedList);
                stopPropagation = true;
            }
            // Card Edit/Delete Actions
            else if (target.closest('.card-action-btn.edit')) {
                handleOpenEditCardModal(target.closest('.kanban-card'));
                stopPropagation = true;
            }
            else if (target.closest('.card-action-btn.delete')) {
                handleDeleteCard(target.closest('.kanban-card'));
                stopPropagation = true;
            }
            
            // --- Priority 2: List Menu Actions ---

            const listActionsRoot = target.closest('.list-actions');
            if (listActionsRoot) {
                // Open/Close menu
                if (target.closest('.list-actions-btn')) {
                    const menu = listActionsRoot.querySelector('.list-actions-menu');
                    const isShowing = menu.classList.contains('show');
                    closeAllListMenus(); // Close all others first
                    if (!isShowing) menu.classList.toggle('show'); // Then open the current one if it was closed
                    stopPropagation = true;
                }
                // Edit from menu
                else if (target.closest('.edit-list-btn')) {
                    handleOpenEditListModal(listActionsRoot.closest('.kanban-list'));
                    closeAllListMenus();
                    stopPropagation = true;
                }
                // Delete from menu
                else if (target.closest('.delete-list-btn')) {
                    handleDeleteList(listActionsRoot.closest('.kanban-list'));
                    closeAllListMenus();
                    stopPropagation = true;
                }
            }

            // --- Priority 3: Global Click-away Actions ---
            if (!stopPropagation) {
                // Close any open list menus if clicked outside
                if (!target.closest('.list-actions')) {
                    closeAllListMenus();
                }

                // Close any open composers if clicked outside its parent list
                document.querySelectorAll('.add-card-composer[style*="display: block"]').forEach(composer => {
                    const listContainer = composer.closest('.kanban-list');
                    if (listContainer !== clickedList) {
                        hideComposer(listContainer);
                    }
                });
            }
        });

        // Helper to close menus
        function closeAllListMenus() {
            document.querySelectorAll('.list-actions-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
        }

        // Setup existing add-card forms
                // --- Setup Form Submissions ---
        document.querySelectorAll('.add-card-form').forEach(form => form.addEventListener('submit', handleAddCardSubmit));
        document.getElementById('add-list-form')?.addEventListener('submit', handleAddListSubmit);
        document.getElementById('complete-task-btn')?.addEventListener('click', handleCompleteTask);

    };

    // ==================================================
    // 6. BOOT
    // ==================================================
    document.addEventListener('DOMContentLoaded', () => {
        initializeAllEventListeners();
        initializeBoardSortable();
        initializeSortable();
        // Initial Check on Load for "Complete List" buttons
        document.querySelectorAll('.kanban-list').forEach(list => checkListCompletion(list));
        checkTaskCompletion();
        
    });

})();
