document.addEventListener("DOMContentLoaded", () => {
  const taskLists = document.querySelectorAll(".task-list");

  // API endpoint
  const API_URL = "/api/tasks";

  // Initialize drag and drop
  initDragDrop();

  function initDragDrop() {
    // Add event listeners to task items (delegated to parent)
    taskLists.forEach((list) => {
      // When dragging starts
      list.addEventListener("dragstart", (e) => {
        if (e.target.classList.contains("task-item")) {
          e.dataTransfer.setData("text/plain", e.target.dataset.id);
          e.target.classList.add("opacity-50");

          // Allow dropping on other columns
          setTimeout(() => {
            taskLists.forEach((dropList) => {
              if (dropList !== list) {
                dropList.classList.add(
                  "bg-gray-900/30",
                  "border-2",
                  "border-dashed",
                  "border-gray-700"
                );
              }
            });
          }, 0);
        }
      });

      // When dragging ends
      list.addEventListener("dragend", (e) => {
        if (e.target.classList.contains("task-item")) {
          e.target.classList.remove("opacity-50");

          // Remove visual cues from all columns
          taskLists.forEach((dropList) => {
            dropList.classList.remove(
              "bg-gray-900/30",
              "border-2",
              "border-dashed",
              "border-gray-700"
            );
          });
        }
      });

      // When dragging over a valid drop target
      list.addEventListener("dragover", (e) => {
        e.preventDefault(); // Allow dropping

        if (e.target.classList.contains("task-list")) {
          e.target.classList.add("bg-gray-900/50");
        }
      });

      // When leaving a drop target
      list.addEventListener("dragleave", (e) => {
        if (e.target.classList.contains("task-list")) {
          e.target.classList.remove("bg-gray-900/50");
        }
      });

      // When dropping a task
      list.addEventListener("drop", async (e) => {
        e.preventDefault();

        // Remove visual cue
        if (e.target.classList.contains("task-list")) {
          e.target.classList.remove("bg-gray-900/50");
        }

        const taskId = e.dataTransfer.getData("text/plain");
        const targetColumn = e.target.closest(".task-list").dataset.column;

        // If dropping within the same column but at a different position
        if (
          e.target
            .closest(".task-list")
            .contains(document.querySelector(`[data-id="${taskId}"]`))
        ) {
          handleReorderInSameColumn(taskId, e);
        } else {
          // If dropping to a different column
          await handleMoveToNewColumn(taskId, targetColumn);
        }
      });
    });
  }

  async function handleMoveToNewColumn(taskId, newPriority) {
    try {
      // Get the task element
      const taskElement = document.querySelector(`[data-id="${taskId}"]`);
      if (!taskElement) throw new Error("Task element not found");

      // Remember the original column
      const originalColumn = taskElement.closest(".task-list").dataset.column;

      // Remove task from current column
      taskElement.remove();

      // Add task to new column
      const targetColumnElement = document.getElementById(
        `${newPriority}-tasks`
      );
      if (!targetColumnElement) throw new Error("Target column not found");

      // Update the task element's data attribute
      taskElement.dataset.priority = newPriority;

      // Find if there are pinned tasks in the target column
      const pinnedTasks = targetColumnElement.querySelectorAll(
        '.task-item[data-pinned="true"]'
      );
      if (pinnedTasks.length > 0) {
        // If the task being moved is pinned, add it to the beginning with other pinned tasks
        if (taskElement.dataset.pinned === "true") {
          targetColumnElement.insertBefore(
            taskElement,
            pinnedTasks[0].nextSibling
          );
        } else {
          // If not pinned, add it after all pinned tasks
          targetColumnElement.insertBefore(
            taskElement,
            pinnedTasks[pinnedTasks.length - 1].nextSibling
          );
        }
      } else {
        // If no pinned tasks, add to the beginning
        targetColumnElement.prepend(taskElement);
      }

      // Update counts
      updateColumnCounts(originalColumn);
      updateColumnCounts(newPriority);

      // Send PATCH request to server (in background)
      const response = await fetch(`${API_URL}/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priority: newPriority }),
      });

      if (!response.ok) throw new Error("Failed to move task");

      showDragDropMessage("Task moved successfully!");
    } catch (error) {
      console.error("Move task error:", error);
      showDragDropMessage("Failed to move task", true);
      // Refresh the page only if there was an error
      location.reload();
    }
  }

  function updateColumnCounts(column) {
    const count = document.querySelectorAll(
      `#${column}-tasks .task-item`
    ).length;
    document.getElementById(`${column}-count`).textContent = count;
  }

  function handleReorderInSameColumn(taskId, dropEvent) {
    const taskElement = document.querySelector(`[data-id="${taskId}"]`);
    const taskList = dropEvent.target.closest(".task-list");

    // Find the closest task element to the drop position
    const closestTask = findClosestTask(dropEvent, taskList, taskId);

    if (closestTask) {
      const rect = closestTask.getBoundingClientRect();
      const dropY = dropEvent.clientY;

      // If dropping above the closest task
      if (dropY < rect.top + rect.height / 2) {
        taskList.insertBefore(taskElement, closestTask);
      } else {
        // If dropping below the closest task
        taskList.insertBefore(taskElement, closestTask.nextSibling);
      }
    } else {
      // If no close task found or dropping at the end, append to the list
      taskList.appendChild(taskElement);
    }

    // In a real app, you would need to update the order in the database here
    // For now, just show a message
    showDragDropMessage("Task reordered");
  }

  function findClosestTask(dropEvent, taskList, excludeTaskId) {
    const mouseY = dropEvent.clientY;
    let closestTask = null;
    let minDistance = Number.MAX_VALUE;

    // Find the task closest to the drop position
    taskList.querySelectorAll(".task-item").forEach((task) => {
      if (task.dataset.id === excludeTaskId) return;

      const rect = task.getBoundingClientRect();
      const taskMiddle = rect.top + rect.height / 2;
      const distance = Math.abs(mouseY - taskMiddle);

      if (distance < minDistance) {
        minDistance = distance;
        closestTask = task;
      }
    });

    return closestTask;
  }

  function showDragDropMessage(message, isError = false) {
    // Create a custom event to use the existing message system in app.js
    const messageEvent = new CustomEvent("showMessage", {
      detail: {
        message,
        type: isError ? "error" : "success",
      },
    });

    document.dispatchEvent(messageEvent);
  }

  // Listen for custom events from drag and drop operations
  document.addEventListener("showMessage", (e) => {
    const messageContainer = document.getElementById("message-container");
    const { message, type } = e.detail;

    // Check if the showMessage function exists in the global scope
    if (typeof window.showMessage === "function") {
      window.showMessage(message, type);
    } else {
      // If the function doesn't exist, create a simple implementation
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

      if (type === "error") {
        messageElement.classList.add(
          "bg-gray-800",
          "border-t-4",
          "border-error"
        );
      } else {
        messageElement.classList.add(
          "bg-gray-800",
          "border-t-4",
          "border-success"
        );
      }

      messageElement.textContent = message;

      // Show message container
      messageContainer.classList.remove("hidden");

      // Add message to container
      messageContainer.appendChild(messageElement);

      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        if (messageElement.parentNode) {
          messageElement.remove();

          if (messageContainer.children.length === 0) {
            messageContainer.classList.add("hidden");
          }
        }
      }, 3000);
    }
  });

  // Listen for task moved events to render tasks
  document.addEventListener("taskMoved", (e) => {
    const { tasks } = e.detail;

    // Check if the renderTasks function exists in the global scope
    if (typeof window.renderTasks === "function") {
      window.renderTasks(tasks);
    } else {
      // Instead of reloading the page, just show a message
      showDragDropMessage("Task moved successfully!");
    }
  });
});
