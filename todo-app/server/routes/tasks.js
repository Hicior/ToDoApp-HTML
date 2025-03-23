const express = require("express");
const router = express.Router();
const { run, get, all } = require("../database/db");

// Get all tasks
router.get("/", async (req, res) => {
  try {
    let query = "SELECT * FROM tasks ORDER BY pinned DESC, created_at DESC";
    const tasks = await all(query);

    // Parse JSON strings to arrays for tags
    const processed = tasks.map((task) => ({
      ...task,
      tags: task.tags ? JSON.parse(task.tags) : [],
    }));

    res.json(processed);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// Get a single task by ID
router.get("/:id", async (req, res) => {
  try {
    const task = await get("SELECT * FROM tasks WHERE id = ?", [req.params.id]);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Parse tags JSON
    task.tags = task.tags ? JSON.parse(task.tags) : [];

    res.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({ error: "Failed to fetch task" });
  }
});

// Create a new task
router.post("/", async (req, res) => {
  try {
    const { title, priority, tags, dueDate, pinned } = req.body;

    // Validate required fields
    if (!title || !priority) {
      return res.status(400).json({ error: "Title and priority are required" });
    }

    // Validate priority values
    const validPriorities = ["urgent", "later", "someday"];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ error: "Invalid priority value" });
    }

    // Store tags as JSON string
    const tagsJson = tags ? JSON.stringify(tags) : null;

    const result = await run(
      "INSERT INTO tasks (title, priority, tags, dueDate, pinned) VALUES (?, ?, ?, ?, ?)",
      [title, priority, tagsJson, dueDate, pinned ? 1 : 0]
    );

    const newTask = await get("SELECT * FROM tasks WHERE id = ?", [result.id]);

    // Parse tags back to array for response
    newTask.tags = newTask.tags ? JSON.parse(newTask.tags) : [];

    res.status(201).json(newTask);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// Update a task
router.patch("/:id", async (req, res) => {
  try {
    const { title, priority, tags, dueDate, comments, pinned } = req.body;
    const id = req.params.id;

    // Check if task exists
    const task = await get("SELECT * FROM tasks WHERE id = ?", [id]);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Build update query dynamically based on provided fields
    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push("title = ?");
      params.push(title);
    }

    if (priority !== undefined) {
      // Validate priority values
      const validPriorities = ["urgent", "later", "someday"];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({ error: "Invalid priority value" });
      }
      updates.push("priority = ?");
      params.push(priority);
    }

    if (tags !== undefined) {
      const tagsJson = JSON.stringify(tags);
      updates.push("tags = ?");
      params.push(tagsJson);
    }

    if (dueDate !== undefined) {
      updates.push("dueDate = ?");
      params.push(dueDate);
    }

    if (comments !== undefined) {
      updates.push("comments = ?");
      params.push(comments);
    }

    if (pinned !== undefined) {
      updates.push("pinned = ?");
      params.push(pinned ? 1 : 0);
    }

    // Add task ID to params
    params.push(id);

    // Execute update if there are fields to update
    if (updates.length > 0) {
      await run(`UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`, params);
    }

    // Fetch updated task
    const updatedTask = await get("SELECT * FROM tasks WHERE id = ?", [id]);
    updatedTask.tags = updatedTask.tags ? JSON.parse(updatedTask.tags) : [];

    res.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// Delete a task
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // Check if task exists
    const task = await get("SELECT * FROM tasks WHERE id = ?", [id]);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    await run("DELETE FROM tasks WHERE id = ?", [id]);

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

module.exports = router;
