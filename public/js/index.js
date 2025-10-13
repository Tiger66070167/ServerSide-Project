async function quickMoveToArchive(buttonElement, taskId) {
    if (!confirm('Are you sure you want to move this task to the archive?')) {
        return;
    }

    try {
        const response = await fetch(`/toArchive/${taskId}`, { // <-- แก้ไข Path ให้ตรงกับ Route
            method: 'POST', // <-- สำคัญมาก: ระบุว่าเป็น POST method
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            // ถ้า server ตอบกลับมาเป็น error
            throw new Error('Failed to move task to archive.');
        }
        
        // ถ้าสำเร็จ
        const taskItem = buttonElement.closest('.task-item');
        if (taskItem) {
            // เพิ่ม animation ให้หายไปอย่างสวยงาม
            taskItem.style.transition = 'opacity 0.5s ease';
            taskItem.style.opacity = '0';
            setTimeout(() => {
                taskItem.remove(); // ลบ Task ออกจากหน้าจอ
            }, 500); // รอให้ animation จบก่อนค่อยลบ
        }

        // (คุณอาจจะอยากเพิ่ม Toast Notification ที่นี่)
        // showToast('Task moved to archive!');

    } catch (error) {
        console.error('Error moving to archive:', error);
        alert(error.message); // หรือใช้ Toast แสดง error
    }
}

// /public/js/index.js
document.addEventListener('DOMContentLoaded', () => {

    // --- Task Search Logic ---
    const searchInput = document.getElementById('task-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.trim().toLowerCase();
            const allTasks = document.querySelectorAll('.task-list .task-item');
            allTasks.forEach(task => {
                const title = task.querySelector('.task-header strong').textContent.trim().toLowerCase();
                if (title.includes(searchTerm)) {
                    task.style.display = 'flex';
                } else {
                    task.style.display = 'none';
                }
            });
        });
    }
});
