import express from "express";
import { check } from "express-validator";
import checkAuth from "../middleware/checkAuth.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
const router = express.Router();

// @route    POST api/tasks
// @desc     Add a new task
// @access   Private

router.post("/", checkAuth, async (req, res) => {
  const { project } = req.body;
  const projectExists = await Project.findById(project);

  if (!projectExists) {
    const error = new Error("Project does not exists");
    return res.status(404).json({ msg: error.message });
  }

  if (projectExists.creator.toString() !== req.user._id.toString()) {
    const error = new Error("Insufficient permissions");
    return res.status(404).json({ msg: error.message });
  }

  try {
    const taskStoraged = await Task.create(req.body);
    // Storage ID of the project
    projectExists.tasks.push(taskStoraged._id);
    await projectExists.save();
    res.json(taskStoraged);
  } catch (error) {
    console.log(error);
  }
});

// @route    GET api/task/:id
// @desc     Get a task
// @access   Private

router.get("/:id", checkAuth, async (req, res) => {
  const { id } = req.params;
  const task = await Task.findById(id).populate("project");

  if (!task) {
    const error = new Error("Task was not found");
    return res.status(404).json({
      msg: error.message,
    });
  }

  if (task.project.creator.toString() !== req.user._id.toString()) {
    const error = new Error("Action not valid");
    return res.status(403).json({ msg: error.message });
  }

  res.json(task);
});

// @route    PUT api/task/:id
// @desc     Edit a task
// @access   Private

router.put("/:id", checkAuth, async (req, res) => {
  const { id } = req.params;
  const task = await Task.findById(id).populate("project");

  if (!task) {
    const error = new Error("Task was not found");
    return res.status(404).json({
      msg: error.message,
    });
  }

  if (task.project.creator.toString() !== req.user._id.toString()) {
    const error = new Error("Action not valid");
    return res.status(403).json({ msg: error.message });
  }

  task.name = req.body.name || task.name;
  task.description = req.body.description || task.description;
  task.priority = req.body.priority || task.priority;
  task.deliverDate = req.body.deliverDate || task.deliverDate;

  try {
    const taskStoraged = await task.save();
    res.json(taskStoraged);
  } catch (error) {}
});

// @route    DELETE api/task/:id
// @desc     Delete a task
// @access   Private

router.delete("/:id", checkAuth, async (req, res) => {
  const { id } = req.params;
  const task = await Task.findById(id).populate("project");

  if (!task) {
    const error = new Error("Task was not found");
    return res.status(404).json({ msg: error.message });
  }

  if (task.project.creator.toString() !== req.user._id.toString()) {
    return res.status(401).json({ msg: "Action not valid" });
  }

  try {
    const project = await Project.findById(task.project);
    project.tasks.pull(task._id);
    await Promise.allSettled([await project.save(), await task.deleteOne()]);
    res.json({ msg: "Task has been deleted succesfully" });
  } catch (error) {
    res.json({
      msg: "There was an error deleting the task, please try again.",
    });
  }
});

// @route    POST api/status/:id
// @desc     Change status
// @access   Private

router.post("/status/:id", checkAuth, async (req, res) => {
  const { id } = req.params;
  const task = await Task.findById(id).populate("project");

  if (!task) {
    const error = new Error("Task was not found");
    return res.status(404).json({ msg: error.message });
  }

  if (
    task.project.creator.toString() !== req.user._id.toString() &&
    !task.project.colaborators.some(
      (colab) => colab._id.toString() === req.user._id.toString()
    )
  ) {
    const error = new Error("Action not valid");
    return res.status(401).json({ msg: error.message });
  }

  task.completed = req.user._id;
  task.status = !task.status;
  await task.save();

  const taskStoraged = await Task.findById(id)
    .populate("project")
    .populate("completed");

  res.json(taskStoraged);
});

export default router;
