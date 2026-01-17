import express from "express";
import pool from "./config/connectDatabase.js";

const app = express();
app.use(express.json());

app.get("/", async (req, res) => {
  const result = await pool.query("SELECT NOW()");
  res.json(result.rows[0]);
});

app.listen(5000, () => console.log("Server running on port 5000"));
