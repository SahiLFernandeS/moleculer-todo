const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const SECRET = process.env.JWT_SECRET || "supersecret";

module.exports = {
  name: "users",
  actions: {
    async register(ctx) {
      const { email, password } = ctx.params;

      const existing = await this.adapter.findOne({ email });
      if (existing) throw new Error("User already exists");

      const hashed = await bcrypt.hash(password, 10);
      const role = ctx.params.role || "user"; // default role = "user"
      const user = await this.adapter.insert({ email, password: hashed, role });

      return { _id: user._id, email: user.email };
    },

    async login(ctx) {
      const { email, password } = ctx.params;
      const user = await this.adapter.findOne({ email });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new Error("Invalid email or password");
      }

      const token = jwt.sign({ _id: user._id, email, role: user.role }, SECRET, { expiresIn: "1d" });

      return { token, user: { _id: user._id, email, role: user.role } };
    },

    resolveToken(ctx) {
      const authHeader = ctx.meta.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("No token provided");
      }

      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, SECRET);
        return decoded;
      } catch (err) {
        throw new Error("Invalid token");
      }
    }
  },

  mixins: [require("moleculer-db")],
  adapter: new (require("moleculer-db-adapter-mongo"))(process.env.MONGO_URI || "mongodb://localhost:27017/moleculer-todo"),
  collection: "users",
};
