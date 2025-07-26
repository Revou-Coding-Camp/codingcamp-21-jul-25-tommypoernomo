document.addEventListener('DOMContentLoaded', async () => {
    let todos = [];
    let isEditing = false;
    let currentEditId = null;
    let sortAscending = true;
    let nextId = 1;

    // DOM Elements
    const taskInput = document.getElementById('taskInput');
    const dateInput = document.getElementById('dateInput');
    const addTaskButton = document.getElementById('addTaskButton');
    const taskList = document.getElementById('taskList');
    const totalTasksSpan = document.getElementById('totalTasks');
    const completedTasksSpan = document.getElementById('completedTasks');
    const pendingTasksSpan = document.getElementById('pendingTasks');
    const progressPercentageSpan = document.getElementById('progressPercentage');
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');
    const sortButton = document.getElementById('sortButton');
    const deleteAllTasksButton = document.getElementById('deleteAllButton');

    // Notification Modal Elements
    const notificationModal = document.getElementById('notificationModal');
    const notificationTitle = document.getElementById('notificationTitle');
    const notificationMessage = document.getElementById('notificationMessage');
    const confirmNotificationButton = document.getElementById('confirmNotification');
    const cancelNotificationButton = document.getElementById('cancelNotification');
    let notificationCallback = null;

    // Show notification modal
    function showNotification(title, message, showCancel = false) {
        return new Promise((resolve) => {
            notificationTitle.textContent = title;
            notificationMessage.textContent = message;
            cancelNotificationButton.style.display = showCancel ? 'inline-block' : 'none';
            notificationModal.classList.remove('hidden');
            notificationCallback = (confirmed) => {
                notificationModal.classList.add('hidden');
                resolve(confirmed);
            };
        });
    }

    confirmNotificationButton.onclick = () => notificationCallback && notificationCallback(true);
    cancelNotificationButton.onclick = () => notificationCallback && notificationCallback(false);

    // Local Storage
    function loadTasks() {
        const storedTodos = localStorage.getItem('todos');
        if (storedTodos) {
            todos = JSON.parse(storedTodos);
            if (todos.length > 0) {
                nextId = Math.max(...todos.map(task => task.id)) + 1;
            }
        }
        renderTasks();
        updateStats();
    }

    function saveTasks() {
        localStorage.setItem('todos', JSON.stringify(todos));
    }

    // CRUD Operations
    async function addTaskLocally(taskText, dueDate) {
        todos.push({
            id: nextId++,
            text: taskText,
            date: dueDate,
            completed: false,
            createdAt: new Date().toISOString()
        });
        saveTasks();
        renderTasks();
        updateStats();
        await showNotification('Berhasil', 'Tugas berhasil ditambahkan!', false);
    }

    async function updateTaskLocally(id, updates) {
        const idx = todos.findIndex(task => task.id === id);
        if (idx > -1) {
            todos[idx] = { ...todos[idx], ...updates };
            saveTasks();
            renderTasks();
            updateStats();
            await showNotification('Berhasil', 'Tugas berhasil diperbarui!', false);
        } else {
            await showNotification('Error', 'Tugas tidak ditemukan.', false);
        }
    }

    async function deleteTaskLocally(id) {
        const confirmed = await showNotification('Konfirmasi Hapus', 'Apakah Anda yakin ingin menghapus tugas ini?', true);
        if (confirmed) {
            todos = todos.filter(task => task.id !== id);
            saveTasks();
            renderTasks();
            updateStats();
            await showNotification('Berhasil', 'Tugas berhasil dihapus!', false);
        }
    }

    async function deleteAllTasksLocally() {
        const confirmed = await showNotification('Konfirmasi Hapus Semua', 'Apakah Anda yakin ingin menghapus SEMUA tugas? Tindakan ini tidak dapat dibatalkan.', true);
        if (confirmed) {
            todos = [];
            nextId = 1;
            saveTasks();
            renderTasks();
            updateStats();
            await showNotification('Berhasil', 'Semua tugas berhasil dihapus!', false);
        }
    }

    // Render
    function renderTasks() {
        taskList.innerHTML = '';
        let filteredTasks = [...todos];

        // Search
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            filteredTasks = filteredTasks.filter(task =>
                task.text.toLowerCase().includes(searchTerm)
            );
        }

        // Filter
        const filterStatus = filterSelect.value;
        if (filterStatus === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.completed);
        } else if (filterStatus === 'pending') {
            filteredTasks = filteredTasks.filter(task => !task.completed);
        }

        // Sort
        filteredTasks.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return sortAscending ? dateA - dateB : dateB - dateA;
        });

        if (filteredTasks.length === 0) {
            const noTasksRow = document.createElement('tr');
            noTasksRow.innerHTML = `<td colspan="4" class="py-4 text-center text-gray-500">Tidak ada tugas untuk ditampilkan.</td>`;
            taskList.appendChild(noTasksRow);
            return;
        }

        filteredTasks.forEach(task => {
            const row = document.createElement('tr');
            row.className = `border-b border-gray-200 hover:bg-gray-50 ${task.completed ? 'opacity-70' : ''}`;
            row.setAttribute('data-id', task.id);

            row.innerHTML = `
                <td class="py-3 px-6 text-left whitespace-nowrap">
                    <span class="font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}">${task.text}</span>
                </td>
                <td class="py-3 px-6 text-left">${task.date}</td>
                <td class="py-3 px-6 text-left">
                    <span class="status-badge ${task.completed ? 'completed' : 'pending'}">${task.completed ? 'Selesai' : 'Tertunda'}</span>
                </td>
                <td class="py-3 px-6 text-center">
                    <div class="flex item-center justify-center space-x-2">
                        <button class="toggle-complete-btn w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 flex items-center justify-center transition duration-300" title="${task.completed ? 'Tandai sebagai Tertunda' : 'Tandai sebagai Selesai'}">
                            <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
                        </button>
                        <button class="edit-btn w-8 h-8 rounded-full bg-yellow-100 hover:bg-yellow-200 text-yellow-600 flex items-center justify-center transition duration-300" title="Edit Tugas">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition duration-300" title="Hapus Tugas">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            `;
            taskList.appendChild(row);
        });

        addEventListenersToTaskButtons();
    }

    function addEventListenersToTaskButtons() {
        document.querySelectorAll('.toggle-complete-btn').forEach(button => {
            button.onclick = async (event) => {
                const id = parseInt(event.currentTarget.closest('tr').getAttribute('data-id'));
                const task = todos.find(t => t.id === id);
                if (task) await updateTaskLocally(id, { completed: !task.completed });
            };
        });

        document.querySelectorAll('.edit-btn').forEach(button => {
            button.onclick = async (event) => {
                const id = parseInt(event.currentTarget.closest('tr').getAttribute('data-id'));
                const task = todos.find(t => t.id === id);
                if (task) {
                    taskInput.value = task.text;
                    dateInput.value = task.date;
                    addTaskButton.textContent = 'Perbarui Tugas';
                    addTaskButton.classList.replace('bg-blue-600', 'bg-green-600');
                    isEditing = true;
                    currentEditId = id;
                    await showNotification('Mengedit Tugas', 'Anda sedang mengedit tugas yang sudah ada.', false);
                }
            };
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.onclick = async (event) => {
                const id = parseInt(event.currentTarget.closest('tr').getAttribute('data-id'));
                await deleteTaskLocally(id);
            };
        });
    }

    function updateStats() {
        const total = todos.length;
        const completed = todos.filter(task => task.completed).length;
        const pending = total - completed;
        const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

        totalTasksSpan.textContent = total;
        completedTasksSpan.textContent = completed;
        pendingTasksSpan.textContent = pending;
        progressPercentageSpan.textContent = `${progress}%`;
    }

    // Add or update task
    addTaskButton.onclick = async () => {
        const taskText = taskInput.value.trim();
        const dueDate = dateInput.value;

        if (!taskText) {
            await showNotification('Cek isi nya', 'Deskripsi tugas tidak boleh kosong.', false);
            return;
        }
        if (!dueDate) {
            await showNotification('Cek isi datanya', 'Silakan pilih Deadline tugas.', false);
            return;
        }

        if (isEditing) {
            await updateTaskLocally(currentEditId, { text: taskText, date: dueDate });
            isEditing = false;
            currentEditId = null;
            addTaskButton.textContent = 'Tambah Tugas';
            addTaskButton.classList.replace('bg-green-600', 'bg-blue-600');
        } else {
            await addTaskLocally(taskText, dueDate);
        }
        taskInput.value = '';
        dateInput.value = '';
    };

    // Search, filter, sort, delete all
    searchInput.oninput = renderTasks;
    filterSelect.onchange = renderTasks;
    sortButton.onclick = async () => {
        sortAscending = !sortAscending;
        renderTasks();
        await showNotification('Pengurutan', `Tugas diurutkan berdasarkan tanggal secara ${sortAscending ? 'menaik' : 'menurun'}.`, false);
    };
    deleteAllTasksButton.onclick = deleteAllTasksLocally;

    loadTasks();
});
