import express from "express";
import dotenv from "dotenv";
import DBConnection from "./config/db.js";
import cors from "cors";
const app = express();
app.use(express.json());

dotenv.config();

DBConnection();

//Config CORS
const whitelist = [process.env.FRONTEND_URL];
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.includes(origin)) {
      // Puede consultar la API
      callback(null, true);
    } else {
      // No esta permitido
      callback(new Error("Error de Cors"));
    }
  },
};

app.use(cors(corsOptions));

/* Routing */

// Users
import UserRoutes from "./routes/Users.js";
app.use("/api/users", UserRoutes);

// Projects
import projectRoutes from "./routes/Projects.js";
app.use("/api/projects", projectRoutes);

// Tasks
import taskRoutes from "./routes/Tasks.js";
app.use("/api/tasks", taskRoutes);

const PORT = process.env.PORT || 4000;

const server = app.listen(4000, () => {
  console.log(`Servidor corriendo en el servidor ${PORT}`);
});

// Socket.io

import { Server } from "socket.io";

const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: process.env.FRONTEND_URL,
  },
});

// Pasos del Socket

// 1 - Emitiendo una 'nueva tarea' por el servidor (projectProvider)

// 2 - Pasamos la nueva tarea al back end, emite ese evento hacia determinado proyecto (task added) en (project.jsx) se puede acceder de forma global a esta informacion

// 3 - Desde (Project.jsx), Leemos ese evento (task added) y manejamos el state en una funcion aparte para actualizarlo y propagarlo para los usuarios que esten dentro del proyecto (params.id)

io.on("connection", (socket) => {
  // Define events of socket Io
  socket.on("open project", (project) => {
    socket.join(project);
  });

  socket.on("new task", (task) => {
    const project = task.project;
    socket.to(project).emit("task added", task);
  });

  socket.on("delete task", (task) => {
    const project = task.project;
    socket.to(project).emit("task deleted", task);
  });

  socket.on("edit task", (task) => {
    const project = task.project._id;
    socket.to(project).emit("task edited", task);
  });

  socket.on("complete task", (task) => {
    const project = task.project._id;
    socket.to(project).emit("task completed", task);
  });
});
