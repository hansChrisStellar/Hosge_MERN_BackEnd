import express from "express";
import User from "../models/User.js";
import IdGenerator from "../helpers/generateId.js";
import generateJWT from "../helpers/generateJWT.js";
import checkAuth from "../middleware/checkAuth.js";
import { registerEmail, forgotPassword } from "../helpers/email.js";
const router = express.Router();

/*  ROUTES  */

// @route    POST api/users
// @desc     Register user
// @access   Public

router.post("/", async (req, res) => {
  // Evitar registros duplicados
  const { email } = req.body;
  const userExist = await User.findOne({ email: email });

  if (userExist) {
    const error = new Error("User already with this email");
    return res.status(400).json({ msg: error.message });
  }
  try {
    const user = new User(req.body);
    user.token = IdGenerator();
    await user.save();

    // Enviar email de confirmacion
    registerEmail({
      email: user.email,
      name: user.name,
      token: user.token,
    });

    res.json({ msg: "User has been created successfully" });
  } catch (error) {}
});

// @route    POST api/users/login
// @desc     Login user
// @access   Public

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Comprobar  si el usuario existe
  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error("User does not exists");
    return res.status(404).json({ msg: error.message });
  }

  // Comprobar si el usuario esta confirmado
  if (!user.confirmed) {
    const error = new Error("Your have not confirmed your account");
    return res.status(403).json({ msg: error.message });
  }

  // Comprobar su password
  if (await user.checkPassword(password)) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateJWT(user._id),
    });
  } else {
    const error = new Error("Your password is incorrect");
    return res.status(403).json({ msg: error.message });
  }
});

// @route    GET api/users/confirm/:token
// @desc     Confirm user
// @access   Private

router.get("/confirm/:token", async (req, res) => {
  const { token } = req.params;
  const confirmUser = await User.findOne({ token });
  if (!confirmUser) {
    const error = new Error("Token is not valid");
    return res.status(404).json({ msg: error.message });
  }

  try {
    confirmUser.confirmed = true;
    confirmUser.token = "";
    await confirmUser.save();
    res.json({ msg: "Your account has been confirmed succesfully" });
  } catch (error) {
    res.send(error.message);
  }
});

// @route    POST api/users/forgot-password
// @desc     User has password has been forgotten
// @access   Private

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error("User does not exists");
    return res.status(404).json({ msg: error.message });
  }

  try {
    user.token = IdGenerator();
    await user.save();

    // Send email
    forgotPassword({
      email: user.email,
      name: user.name,
      token: user.token,
    });

    res.json({
      msg: "We have sent instruccions to your email in regards for recovering your password",
    });
  } catch (error) {}
});

// @route    GET api/users/forgot-password/:token
// @desc     Confirm the token is valid so do the account
// @access   Private

router.get("/forgot-password/:token", async (req, res) => {
  const { token } = req.params;
  const validToken = await User.findOne({ token });
  if (validToken) {
    res.json({ msg: "Token is valid and the user exists" });
  } else {
    const error = new Error("Token is not valid");
    return res.status(404).json({ msg: error.message });
  }
});

// @route    POST api/users/forgot-password/:token
// @desc     Save and storage the new password
// @access   Private

router.post("/forgot-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const user = await User.findOne({ token });
  if (user) {
    user.password = password;
    user.token = "";
    try {
      await user.save();
      res.json({ msg: "Your password has been changed successfuly" });
    } catch (error) {
      res.json({ msg: error.message });
    }
  } else {
    const error = new Error("Token is not valid");
    return res.status(404).json({ msg: error.message });
  }
});

// @route    POST api/users/forgot-password/:token
// @desc     Save and storage the new password
// @access   Private

router.get("/profile", checkAuth, async (req, res) => {
  // Chequear el middleware checkauth, porque si todo esta bien ahi, parara a este middleware --- checkAuth -> este router
  const { user } = req;
  res.json(user);
});

export default router;
