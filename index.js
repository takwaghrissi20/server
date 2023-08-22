const express = require("express"); // it is a librairy that allows us to create a server quickly
const app = express();
const cors = require("cors");
const pool = require("./db"); //run queries with postgres

//middleware
app.use(cors());
app.use(express.json()); //gives access  to request that body and then we can get a json data
//ROUTES//

//create a todo

app.post("/todos", async (req, res) => {
  try {
    const { description, registration_id } = req.body;
    const newTodo = await pool.query(
      "INSERT INTO todo (description,registration_id, completed) values($1,$2, $3)  RETURNING *",
      [description, registration_id, "false"] //description is the value of this $1
    );

    const todo = newTodo.rows[0];
    res.json({ ...todo, completed: todo.completed === "true" });
  } catch (err) {
    console.error(err.message);
  }
});
//get all todo
app.get("/todos", async (req, res) => {
  const registration_id = req.headers.authorization;
  console.log("fetching todos of user ", registration_id);
  try {
    const allTodos = await pool.query(
      `SELECT * FROM todo WHERE registration_id=$1`,
      [registration_id]
    );

    // transforming the type of "completed" to boolean
    const todos = allTodos.rows.map((todo) => ({
      ...todo,
      completed: todo.completed === "true",
    }));
    res.json(todos);
  } catch (err) {
    console.error(err.message);
    return res.status(400).json({ message: err.message });
  }
});
//get a todo
app.get("/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const todo = await pool.query("SELECT * FROM todo WHERE todo_id=$1", [id]);

    if (!todo.rows[0]) {
      return res.status(404).json({ message: `Todo with id ${id} Not Found` });
    }
    res.json(todo, todo.rows[0]);
  } catch (err) {
    Console.error(err.message);
  }
});
//update a todo
app.put("/todos/modify/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;
    const updateTodo = await pool.query(
      "UPDATE todo SET description =$1 WHERE todo_id=$2",
      [description, id]
    );
    res.json("Todo was update!");
  } catch (err) {
    console.error(err.message);
  }
});

app.put("/todos/:id", async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;
  console.log("changing todo to ", completed);
  try {
    const markCompleted = await pool.query(
      "UPDATE todo SET completed=$1 WHERE todo_id=$2",
      [completed, id]
    );

    return res.json({ success: true });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

//delete a todo
app.delete("/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleteTodo = await pool.query("DELETE FROM todo WHERE todo_id =$1", [
      id,
    ]);
    res.json("Todo was deleted");
  } catch (err) {
    console.error(err.message);
  }
});

//create a registration
app.post("/registrations", async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;

    // checking for user
    const userExists = await pool.query(
      "SELECT * FROM registration where email=$1",
      [email]
    );
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "user already exists" });
    }

    const newregister = await pool.query(
      "INSERT INTO registration (first_name,last_name,email,password) values($1,$2,$3,$4) RETURNING *",
      [first_name, last_name, email, password] //description is the value of this $1
    );

    res.json(newregister.rows);
  } catch (err) {
    console.error(err.message);
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const newlogin = await pool.query(
      "SELECT (id) FROM registration WHERE email= $1 and password=$2",
      [email, password]
    );

    if (newlogin.rows.length !== 0) {
      return res.status(200).json(newlogin.rows[0]);
    }

    return res.status(400).json({ message: "Incorrect credentials" });
    // 400 : Bad Request
  } catch (err) {
    console.error(err.message);
  }
});

app.listen(5000, () => {
  console.log("server is listening on port 5000...");
});
