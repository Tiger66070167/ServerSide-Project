// ==============================================
// INDEX PAGE JAVASCRIPT
// ==============================================

document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;

    // --- Task Search Logic ---
    const searchInput = document.getElementById('task-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.trim().toLowerCase();
            document.querySelectorAll('.task-list .task-item').forEach(task => {
                const title = task.querySelector('.task-header strong')?.textContent.trim().toLowerCase() || '';
                task.style.display = title.includes(searchTerm) ? '' : 'none';
            });
        });
    }

    // --- Event Delegation for Task Actions ---
    body.addEventListener('click', (event) => {
        const archiveButton = event.target.closest('.quick-move-archive-btn');
        if (archiveButton) {
            const taskItem = archiveButton.closest('.task-item');
            const taskId = archiveButton.dataset.taskId;
            const taskTitle = taskItem?.querySelector('.task-header strong')?.textContent || 'this task';

            if (!taskId) return;

            openConfirmationModal({
                title: 'Move to Archive?',
                message: `Are you sure you want to move "<strong>${taskTitle}</strong>" to the archive?`,
                confirmText: 'Yes, Move',
                onConfirm: async () => {
                    try {
                        const response = await fetch(`/toArchive/${taskId}`, { method: 'POST' });
                        if (!response.ok) throw new Error('Failed to move task.');
                        if (taskItem) {
                            taskItem.style.transition = 'opacity 0.5s ease';
                            taskItem.style.opacity = '0';
                            setTimeout(() => taskItem.remove(), 500);
                        }
                    } catch (error) {
                        alert(error.message);
                    }
                }
            });
        }
    });
});
