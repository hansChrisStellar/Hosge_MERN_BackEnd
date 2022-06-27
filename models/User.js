import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    token: {
      type: String,
    },
    confirmed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash Password
userSchema.pre("save", async function (next) {
  // Funcion de mongoose, esto refleja que si el user no esta modificando el password entonces continua la operacion
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  // El this hace referencia al function, por eso se usa este en vez de arrow function
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.checkPassword = async function (passwordForm) {
  return await bcrypt.compare(passwordForm, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
