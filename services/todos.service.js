const DbService = require("moleculer-db");
const MongoAdapter = require("moleculer-db-adapter-mongo");
require("dotenv").config();

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
        return this.adapter.find({ query: { userId: ctx.meta.user._id } });
    },
    async get(ctx) {
        const todo = await this.adapter.findById(ctx.params.id);
        if (!todo || todo.userId !== ctx.meta.user._id) throw new Error("Unauthorized or Not Found");
        return todo;
    },
    async remove(ctx) {
        const todo = await this.adapter.findById(ctx.params.id);
        if (!todo || todo.userId !== ctx.meta.user._id) throw new Error("Unauthorized or Not Found");
        return this.adapter.removeById(ctx.params.id);
    },
    }
};
