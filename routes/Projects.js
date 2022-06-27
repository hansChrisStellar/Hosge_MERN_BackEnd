import express from "express";
import checkAuth from "../middleware/checkAuth.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import Project from "./../models/Project.js";
const router = express.Router();

// @route    GET api/projects
// @desc     Get all projects
// @access   Private

router.get("/", checkAuth, async (req, res) => {
  const projects = await Project.find({
    $or: [{ colaborators: { $in: req.user } }, { creator: { $in: req.user } }],
  }).select("-tasks");
  res.json(projects);
});

// @route    POST api/projects
// @desc     Create new project
// @access   Private

router.post("/", checkAuth, async (req, res) => {
  const project = new Project(req.body);
  // el user viene del middleware checkAuth.
  project.creator = req.user._id;

  try {
    const projectStoraged = await project.save();
    res.json(projectStoraged);
  } catch (error) {}
});

// @route    GET api/projects/:id
// @desc     Get a project
// @access   Private

router.get("/:id", checkAuth, async (req, res) => {
  const { id } = req.params;
  const project = await Project.findById(id)
    .populate({
      path: "tasks",
      populate: { path: "completed", select: "name" },
    })
    .populate("colaborators", "name email");

  if (!project) {
    const error = new Error("Project was not found");
    return res.status(404).json({ msg: error.message });
  }

  if (
    project.creator.toString() !== req.user._id.toString() &&
    !project.colaborators.some(
      (colaborator) => colaborator._id.toString() === req.user._id.toString()
    )
  ) {
    const error = new Error("Action was not valid");
    return res.status(401).json({ msg: error.message });
  }

  res.json(project);
});

// @route    PUT api/projects/:id
// @desc     Edit a project
// @access   Private

router.put("/:id", checkAuth, async (req, res) => {
  const { id } = req.params;
  const project = await Project.findById(id);

  if (!project) {
    return res.status(404).json({ msg: "Project not found" });
  }

  if (project.creator.toString() !== req.user._id.toString()) {
    return res.status(401).json({ msg: "Action not valid" });
  }

  project.name = req.body.name || project.name;
  project.description = req.body.description || project.description;
  project.deliverDate = req.body.deliverDate || project.deliverDate;
  project.client = req.body.client || project.client;

  try {
    const projectStoraged = await project.save();
    res.json(projectStoraged);
  } catch (error) {
    return res.status(500).json({ msg: "There was an error" });
  }
});

// @route    DELETE api/projects/:id
// @desc     Delete a project
// @access   Private

router.delete("/:id", checkAuth, async (req, res) => {
  const { id } = req.params;
  const project = await Project.findById(id);

  if (!project) {
    return res.status(404).json({ msg: "Project not found" });
  }

  if (project.creator.toString() !== req.user._id.toString()) {
    return res.status(401).json({ msg: "Action not valid" });
  }

  try {
    await project.deleteOne();
    res.json({ msg: "Project has been deleted succesfully" });
  } catch (error) {}
});

// @route    POST api/projects/colabs
// @desc     Search for colabs
// @access   Private

router.post("/colabs", checkAuth, async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email }).select(
    "-confirmed -createdAt -password -token -updatedAt -__v"
  );

  if (!user) {
    const error = new Error("User not found");
    return res.status(404).json({ msg: error.message });
  }

  res.json(user);
});

// @route    POST api/projects/add-colaborator/:id
// @desc     Add a colaborator to the project
// @access   Private

router.post("/colabs/:id", checkAuth, async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    const error = new Error("Project was not found");
    return res.status(404).json({ msg: error.message });
  }

  if (project.creator.toString() !== req.user._id.toString()) {
    const error = new Error("Action is not valid");
    return res.status(404).json({ msg: error.message });
  }

  const { email } = req.body;
  const user = await User.findOne({ email }).select(
    "-confirmed -createdAt -password -token -updatedAt -__v"
  );

  if (!user) {
    const error = new Error("User not found");
    return res.status(404).json({ msg: error.message });
  }

  // The colab is not the admin of the project
  if (project.creator.toString() === user._id.toString()) {
    const error = new Error("The project creator can not be a colab");
    return res.status(404).json({ msg: error.message });
  }

  // Check if is not already added in the project

  if (project.colaborators.includes(user._id)) {
    const error = new Error("The user already belongs to the project");
    return res.status(404).json({ msg: error.message });
  }

  // Everything is fine, there is no error
  project.colaborators.push(user._id);
  await project.save();
  res.json({ msg: "Collaborator added successfully" });
});

// @route    POST api/projects/erase-colaborator/:id
// @desc     Erase colaborator from the project
// @access   Private

router.post("/colabs-delete/:id", checkAuth, async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    const error = new Error("Project was not found");
    return res.status(404).json({ msg: error.message });
  }

  if (project.creator.toString() !== req.user._id.toString()) {
    const error = new Error("Action is not valid");
    return res.status(404).json({ msg: error.message });
  }

  // Everything is fine, there is no error

  project.colaborators.pull(req.body._id);
  await project.save();
  res.json({ msg: "Collaborator deleted successfully" });
});

export default router;
