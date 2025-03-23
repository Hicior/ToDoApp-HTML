document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const columnsContainer = document.getElementById("columns-container");
  const loadingElement = document.getElementById("loading");
  const messageContainer = document.getElementById("message-container");
  const addTaskButtons = document.querySelectorAll(".add-task-btn");
  const addTaskModal = document.getElementById("add-task-modal");
  const closeAddModalBtn = document.getElementById("close-add-modal");
  const addTaskForm = document.getElementById("add-task-form");
  const taskColumnInput = document.getElementById("task-column");
  const tagInput = document.getElementById("tag-input");
  const selectedTagsContainer = document.getElementById("selected-tags");
  const taskDetailsModal = document.getElementById("task-details-modal");
  const closeDetailsModalBtn = document.getElementById("close-details-modal");
  const editTaskForm = document.getElementById("edit-task-form");

  // State
  let selectedTags = [];
  let editSelectedTags = [];
  let currentEditTaskId = null;

  // API endpoint
  const API_URL = "/api/tasks";

  // Initialize the app
  init();

  // Functions
  async function init() {
    showLoading();
    try {
      await fetchTasks();
      setupEventListeners();
    } catch (error) {
      showMessage("Failed to load tasks. Please try again.", "error");
      console.error("Initialization error:", error);
    } finally {
      hideLoading();
    }
  }

  function setupEventListeners() {
    // Add task button opens modal
    addTaskButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const column = btn.dataset.column;
        taskColumnInput.value = column;
        addTaskModal.classList.remove("hidden");
      });
    });

    // Close add task modal
    closeAddModalBtn.addEventListener("click", () => {
      addTaskModal.classList.add("hidden");
      addTaskForm.reset();
      selectedTags = [];
      updateSelectedTagsDisplay();
    });

    // Close task details modal
    closeDetailsModalBtn.addEventListener("click", () => {
      taskDetailsModal.classList.add("hidden");
      editTaskForm.reset();
      editSelectedTags = [];
      updateEditSelectedTagsDisplay();
    });

    // Handle add task form submission
    addTaskForm.addEventListener("submit", handleAddTask);

    // Handle edit task form submission
    editTaskForm.addEventListener("submit", handleEditTask);

    // Handle tag input
    tagInput.addEventListener("keydown", handleTagInput);
    document
      .getElementById("edit-tag-input")
      .addEventListener("keydown", handleEditTagInput);

    // Close modals when clicking outside
    window.addEventListener("click", (e) => {
      if (e.target === addTaskModal) {
        addTaskModal.classList.add("hidden");
        addTaskForm.reset();
        selectedTags = [];
        updateSelectedTagsDisplay();
      }
      if (e.target === taskDetailsModal) {
        taskDetailsModal.classList.add("hidden");
        editTaskForm.reset();
        editSelectedTags = [];
        updateEditSelectedTagsDisplay();
      }
    });
  }

  async function fetchTasks() {
    try {
      const response = await fetch(`${API_URL}`);
      if (!response.ok) throw new Error("Failed to fetch tasks");

      const tasks = await response.json();
      renderTasks(tasks);
    } catch (error) {
      showMessage("Error loading tasks", "error");
      console.error("Fetch error:", error);
    }
  }

  function renderTasks(tasks) {
    // Clear current tasks
    document.querySelectorAll(".task-list").forEach((list) => {
      list.innerHTML = "";
    });

    // Count tasks per column
    const counts = {
      urgent: 0,
      later: 0,
      someday: 0,
    };

    // Sort tasks - pinned first, then by due date
    tasks.sort((a, b) => {
      // Pinned tasks first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      // Then sort by due date if both have due dates
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }

      // Tasks with due dates before tasks without
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;

      return 0;
    });

    // Render tasks
    tasks.forEach((task) => {
      const taskElement = createTaskElement(task);
      const columnId = `${task.priority}-tasks`;
      document.getElementById(columnId).appendChild(taskElement);
      counts[task.priority]++;
    });

    // Update counters
    Object.keys(counts).forEach((priority) => {
      document.getElementById(`${priority}-count`).textContent =
        counts[priority];
    });
  }

  function createTaskElement(task) {
    const taskElement = document.createElement("div");
    taskElement.classList.add(
      "task-item",
      "bg-gray-800",
      "rounded-lg",
      "p-3",
      "mb-3",
      "flex",
      "items-start",
      "gap-3",
      "animate-fade-in",
      "cursor-grab"
    );
    taskElement.setAttribute("draggable", "true");
    taskElement.dataset.id = task.id;
    taskElement.dataset.priority = task.priority;
    taskElement.dataset.pinned = task.pinned ? "true" : "false";

    if (task.pinned) {
      taskElement.classList.add("border-l-4");

      switch (task.priority) {
        case "urgent":
          taskElement.classList.add("border-urgent");
          break;
        case "later":
          taskElement.classList.add("border-later");
          break;
        case "someday":
          taskElement.classList.add("border-someday");
          break;
      }
    }

    // Create content container
    const contentContainer = document.createElement("div");
    contentContainer.classList.add("flex-1");

    // Create task title
    const titleElement = document.createElement("p");
    titleElement.classList.add("font-medium", "mb-1", "cursor-pointer");
    titleElement.textContent = task.title;
    titleElement.addEventListener("click", () => openTaskDetails(task));

    // Create metadata container
    const metaContainer = document.createElement("div");
    metaContainer.classList.add(
      "flex",
      "flex-wrap",
      "items-center",
      "gap-2",
      "text-xs",
      "text-gray-400"
    );

    // Add due date if available
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const now = new Date();
      const isOverdue = dueDate < now;

      const dateElement = document.createElement("span");
      dateElement.classList.add("flex", "items-center", "gap-1");
      if (isOverdue) {
        dateElement.classList.add("text-red-400");
      }

      // Date icon
      dateElement.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                ${formatDate(dueDate)}
            `;

      metaContainer.appendChild(dateElement);
    }

    // Add tags if available
    if (task.tags && task.tags.length > 0) {
      task.tags.forEach((tag) => {
        const tagElement = document.createElement("span");
        tagElement.classList.add(
          "bg-gray-700",
          "text-xs",
          "px-2",
          "py-0.5",
          "rounded-full"
        );
        tagElement.textContent = tag;
        metaContainer.appendChild(tagElement);
      });
    }

    contentContainer.appendChild(titleElement);
    contentContainer.appendChild(metaContainer);

    // Create delete button
    const deleteButton = document.createElement("button");
    deleteButton.classList.add(
      "text-gray-400",
      "hover:text-red-500",
      "focus:outline-none"
    );
    deleteButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        `;
    deleteButton.addEventListener("click", (e) => {
      e.stopPropagation();
      handleDeleteTask(task.id);
    });

    // Assemble task element
    contentContainer.classList.add("ml-2"); // Add margin since we removed the checkbox
    taskElement.appendChild(contentContainer);
    taskElement.appendChild(deleteButton);

    return taskElement;
  }

  async function handleAddTask(e) {
    e.preventDefault();

    const title = document.getElementById("task-title").value;
    const dueDate = document.getElementById("task-date").value;
    const priority = taskColumnInput.value;

    const newTask = {
      title,
      priority,
      tags: selectedTags,
      dueDate: dueDate || null,
      pinned: false,
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) throw new Error("Failed to add task");

      showMessage("Task added successfully!", "success");
      addTaskModal.classList.add("hidden");
      addTaskForm.reset();
      selectedTags = [];
      updateSelectedTagsDisplay();
      await fetchTasks();
    } catch (error) {
      showMessage("Failed to add task", "error");
      console.error("Add task error:", error);
    }
  }

  async function handleEditTask(e) {
    e.preventDefault();

    const taskId = document.getElementById("edit-task-id").value;
    const title = document.getElementById("edit-task-title").value;
    const dueDate = document.getElementById("edit-task-date").value;
    const comments = document.getElementById("task-comments").value;
    const pinned = document.getElementById("task-pinned").checked;

    const updatedTask = {
      title,
      comments,
      dueDate: dueDate || null,
      tags: editSelectedTags,
      pinned,
    };

    try {
      const response = await fetch(`${API_URL}/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedTask),
      });

      if (!response.ok) throw new Error("Failed to update task");

      showMessage("Task updated successfully!", "success");
      taskDetailsModal.classList.add("hidden");
      await fetchTasks();
    } catch (error) {
      showMessage("Failed to update task", "error");
      console.error("Edit task error:", error);
    }
  }

  async function handleDeleteTask(taskId) {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`${API_URL}/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete task");

      showMessage("Task deleted successfully!", "success");
      await fetchTasks();
    } catch (error) {
      showMessage("Failed to delete task", "error");
      console.error("Delete task error:", error);
    }
  }

  function openTaskDetails(task) {
    currentEditTaskId = task.id;

    document.getElementById("edit-task-id").value = task.id;
    document.getElementById("edit-task-title").value = task.title;
    document.getElementById("edit-task-date").value = task.dueDate
      ? task.dueDate.split("T")[0]
      : "";
    document.getElementById("task-comments").value = task.comments || "";
    document.getElementById("task-pinned").checked = task.pinned;

    editSelectedTags = [...(task.tags || [])];
    updateEditSelectedTagsDisplay();

    taskDetailsModal.classList.remove("hidden");
  }

  function handleTagInput(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const tag = e.target.value.trim();

      if (tag && !selectedTags.includes(tag)) {
        selectedTags.push(tag);
        e.target.value = "";
        updateSelectedTagsDisplay();
      }
    }
  }

  function handleEditTagInput(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const tag = e.target.value.trim();

      if (tag && !editSelectedTags.includes(tag)) {
        editSelectedTags.push(tag);
        e.target.value = "";
        updateEditSelectedTagsDisplay();
      }
    }
  }

  function updateSelectedTagsDisplay() {
    selectedTagsContainer.innerHTML = "";

    selectedTags.forEach((tag) => {
      const tagElement = document.createElement("div");
      tagElement.classList.add(
        "bg-gray-700",
        "text-sm",
        "px-2",
        "py-1",
        "rounded-lg",
        "flex",
        "items-center"
      );

      const tagText = document.createElement("span");
      tagText.textContent = tag;

      const removeButton = document.createElement("button");
      removeButton.classList.add(
        "ml-1",
        "text-gray-400",
        "hover:text-white",
        "focus:outline-none"
      );
      removeButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
            `;
      removeButton.addEventListener("click", () => {
        selectedTags = selectedTags.filter((t) => t !== tag);
        updateSelectedTagsDisplay();
      });

      tagElement.appendChild(tagText);
      tagElement.appendChild(removeButton);
      selectedTagsContainer.appendChild(tagElement);
    });
  }

  function updateEditSelectedTagsDisplay() {
    const editSelectedTagsContainer =
      document.getElementById("edit-selected-tags");
    editSelectedTagsContainer.innerHTML = "";

    editSelectedTags.forEach((tag) => {
      const tagElement = document.createElement("div");
      tagElement.classList.add(
        "bg-gray-700",
        "text-sm",
        "px-2",
        "py-1",
        "rounded-lg",
        "flex",
        "items-center"
      );

      const tagText = document.createElement("span");
      tagText.textContent = tag;

      const removeButton = document.createElement("button");
      removeButton.classList.add(
        "ml-1",
        "text-gray-400",
        "hover:text-white",
        "focus:outline-none"
      );
      removeButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
            `;
      removeButton.addEventListener("click", () => {
        editSelectedTags = editSelectedTags.filter((t) => t !== tag);
        updateEditSelectedTagsDisplay();
      });

      tagElement.appendChild(tagText);
      tagElement.appendChild(removeButton);
      editSelectedTagsContainer.appendChild(tagElement);
    });
  }

  function showLoading() {
    loadingElement.classList.remove("hidden");
  }

  function hideLoading() {
    loadingElement.classList.add("hidden");
  }

  function showMessage(message, type) {
    const messageElement = document.createElement("div");
    messageElement.classList.add(
      "rounded-lg",
      "p-4",
      "flex",
      "items-center",
      "shadow-lg",
      "animate-slide-in",
      "mb-3"
    );

    let iconSvg = "";

    if (type === "error") {
      messageElement.classList.add("bg-gray-800", "border-t-4", "border-error");
      iconSvg = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-error mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            `;
    } else {
      messageElement.classList.add(
        "bg-gray-800",
        "border-t-4",
        "border-success"
      );
      iconSvg = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-success mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
            `;
    }

    messageElement.innerHTML = `
            ${iconSvg}
            <span>${message}</span>
            <button class="ml-auto text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
            </button>
        `;

    // Add close functionality
    const closeButton = messageElement.querySelector("button");
    closeButton.addEventListener("click", () => {
      messageElement.remove();

      if (messageContainer.children.length === 0) {
        messageContainer.classList.add("hidden");
      }
    });

    // Show message container
    messageContainer.classList.remove("hidden");

    // Add message to container
    messageContainer.appendChild(messageElement);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.remove();

        if (messageContainer.children.length === 0) {
          messageContainer.classList.add("hidden");
        }
      }
    }, 5000);
  }

  function formatDate(date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );
    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    if (dateOnly.getTime() === today.getTime()) {
      return "Today";
    } else if (dateOnly.getTime() === tomorrow.getTime()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  }

  // Make functions available globally for drag and drop
  window.renderTasks = renderTasks;
  window.showMessage = showMessage;
});
