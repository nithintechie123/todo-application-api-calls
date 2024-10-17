const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const hasPriorityAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

//API 1

app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status } = request.query;

  let data = null;
  let getTodoQuery = "";

  switch (true) {
    case hasPriorityAndStatusProperty(request.query):
      getTodoQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodoQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;
    default:
      getTodoQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodoQuery);
  response.send(data);
});
//API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `SELECT * FROM todo WHERE id=${todoId}`;

  const data = await db.get(getTodoQuery);
  response.send(data);
});

//API 3

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;

  const addTodoQuery = `
        INSERT INTO todo(id,todo,priority,status)
        VALUES (${id},'${todo}','${priority}','${status}');
  `;
  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

//API 4

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  let responseText = "";
  const requestBody = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      responseText = "Status";
      break;
    case requestBody.priority !== undefined:
      responseText = "Priority";
      break;
    case requestBody.todo !== undefined:
      responseText = "Todo";
      break;
  }

  const previousTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`;

  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updatedTodoQuery = `
        UPDATE
            todo
        SET
            todo='${todo}',
            priority='${priority}',
            status='${status}'
        WHERE
            id=${todoId};
        `;
  await db.run(updatedTodoQuery);
  response.send(`${responseText} Updated`);
});

//API 5

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;

  const deleteTodoQuery = `
  DELETE FROM todo
  WHERE id=${todoId}`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
