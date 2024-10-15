import { randomUUID } from "node:crypto";
import { Database } from "./database.js";
import { buildRoutePath } from "./utils/build-route-path.js";
import { parse } from "csv-parse";
import fs from "node:fs";

const database = new Database();

export const routes = [
  {
    method: "GET",
    path: buildRoutePath("/tasks"),
    handler: (req, res) => {
      const { search } = req.query;

      const tasks = database.select(
        "tasks",
        search ? { title: search, description: search } : null
      );

      return res.end(JSON.stringify(tasks));
    },
  },
  {
    method: "POST",
    path: buildRoutePath("/tasks/csv"),
    handler: (req, res) => {
      const csvPath = new URL("../file.csv", import.meta.url);

      const stream = fs.createReadStream(csvPath);

      const csvParse = parse({
        delimiter: ",",
        skipEmptyLines: true,
        fromLine: 2,
      });

      async function execute() {
        const linesParse = stream.pipe(csvParse);

        for await (const line of linesParse) {
          const [title, description] = line;

          if (!title || !description) {
            return res.writeHead(422).end();
          }

          const task = {
            id: randomUUID(),
            title,
            description,
            completed_at: null,
            created_at: new Date(),
            updated_at: new Date(),
          };

          database.insert("tasks", task);
        }
      }

      execute();

      return res.writeHead(201).end();
    },
  },
  {
    method: "POST",
    path: buildRoutePath("/tasks"),
    handler: (req, res) => {
      const { title, description } = req.body;

      if (!title || !description) {
        return res.writeHead(422).end();
      }

      const task = {
        id: randomUUID(),
        title,
        description,
        completed_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      database.insert("tasks", task);

      return res.writeHead(201).end();
    },
  },
  {
    method: "PUT",
    path: buildRoutePath("/tasks/:id"),
    handler: (req, res) => {
      const { id } = req.params;
      const { title, description } = req.body;

      if (!id || !title || !description) {
        return res.writeHead(422).end();
      }

      database.update("tasks", id, {
        title,
        description,
        updated_at: new Date(),
      });

      return res.writeHead(204).end();
    },
  },
  {
    method: "PATCH",
    path: buildRoutePath("/tasks/:id/complete"),
    handler: (req, res) => {
      const { id } = req.params;

      if (!id) {
        return res.writeHead(422).end();
      }

      database.update("tasks", id, {
        completed_at: new Date(),
      });

      return res.writeHead(204).end();
    },
  },
  {
    method: "DELETE",
    path: buildRoutePath("/tasks/:id"),
    handler: (req, res) => {
      const { id } = req.params;

      if (!id) {
        return res.writeHead(422).end();
      }

      database.delete("tasks", id);

      return res.writeHead(204).end();
    },
  },
];
