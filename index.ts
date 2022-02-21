// #region 'Importing and config stuff'
import express from "express";
import Database from "better-sqlite3";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const db = new Database("./data.db", {
  verbose: console.log,
});
// #endregion

// #region 'Sql queries'
const getAllWorks = db.prepare(`
SELECT id,name,picture FROM works;
`);

const getAllMuseums = db.prepare(`
SELECT * FROM museums;
`);

const getWorksForMuseum = db.prepare(`
SELECT * FROM works
WHERE museumId = ?;
`);

const getMuseumById = db.prepare(`
SELECT * FROM museums WHERE id = ?
`);

const getWorkById = db.prepare(`
SELECT id,name,picture FROM works WHERE id = ?
`);
// #endregion

// #region 'End points Rest API'
app.get("/works", (req, res) => {

  const works = getAllWorks.all();
  
  for (const work of works) {
    const museum = getMuseumById.get(work.id);
    work.museum = museum;
  }

  res.send(works);

});

app.get("/works/:id", (req, res) => {

  const id = req.params.id;
  const work = getWorkById.get(id);
  
  const museum = getMuseumById.get(work.id);
  work.museum = museum;
  res.send(work);

});

app.get("/museums", (req, res) => {

  const museums = getAllMuseums.all();

  for (const museum of museums) {
    const works = getWorksForMuseum.all(museum.id);
    museum.works = works;
  }

  res.send(museums);

});

app.get("/museums/:id", (req, res) => {

  const id = req.params.id;

  const museum = getMuseumById.get(id);
  const works = getWorksForMuseum.all(museum.id);

  museum.works = works;
  res.send(museum);

});
// #endregion

app.listen(4000, () => console.log(`Listening on: http://localhost:4000`));