const DbService = require("moleculer-db");
const MongoAdapter = require("moleculer-db-adapter-mongo");
require("dotenv").config();
const { ObjectID } = require("mongodb");

module.exports = {
  name: "todos",
  mixins: [DbService],
  adapter: new MongoAdapter(process.env.MONGO_URI || "mongodb://localhost:27017/moleculer-todo"),
  collection: "todos",

  settings: {
    fields: ["_id", "title", "completed", "createdAt", "updatedAt"],
    entityValidator: {
      title: "string|min:1",
      completed: { type: "boolean", optional: true },
    },
  },

  hooks: {
    before: {
      create(ctx) {
        ctx.params.userId = ctx.meta.user._id; // Assuming user ID is set in the context
        ctx.params.createdAt = new Date();
        ctx.params.updatedAt = new Date();
        ctx.params.completed = false;
      },
      update(ctx) {
        ctx.params.updatedAt = new Date();
      }
    }
  },

  actions: {
    async list(ctx) {
        const user = ctx.meta.user;
        if (user.role !== "admin") {
            // If the user is not an admin, filter todos by user ID
            return this.adapter.find({ query: { userId: user._id } });
        }else {
            // If the user is an admin, return all todos
            return this.adapter.find({});
        }
    },
    async get(ctx) {
        const user = ctx.meta.user;
        if (user.role !== "admin") {
            // If the user is not an admin, check if the todo belongs to the user
            const todo = await this.adapter.findOne({ _id: new ObjectID(ctx.params.id), userId: user._id });
            if (!todo) throw new Error("Unauthorized or Not Found");
            return todo;
        } else {
            // If the user is an admin, return the todo by ID
            return this.adapter.findById(ctx.params.id);
        }
    },
    async remove(ctx) {
        const user = ctx.meta.user;
        if (user.role !== "admin") {
            // If the user is not an admin, check if the todo belongs to the user
            const todo = await this.adapter.findOne({ _id: ctx.params.id, userId: user._id });
            if (!todo) throw new Error("Unauthorized or Not Found");
            return this.adapter.removeById(ctx.params.id);
        }else {
            // If the user is an admin, no need to check user ID
            const todo = await this.adapter.findById(ctx.params.id);
            if (!todo || todo.userId !== ctx.meta.user._id) throw new Error("Unauthorized or Not Found");
            return this.adapter.removeById(ctx.params.id);
        }
    },
    }
};
