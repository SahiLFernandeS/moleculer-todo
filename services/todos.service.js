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
        ctx.params.createdAt = new Date();
        ctx.params.updatedAt = new Date();
        ctx.params.completed = false;
      },
      update(ctx) {
        ctx.params.updatedAt = new Date();
      }
    }
  }
};
