// #region 'Importing and config stuff'
import express from "express";
import Database from "better-sqlite3";
import cors from "cors";
import {createWork, createMuseum} from "./setup"

const app = express();
app.use(cors());
app.use(express.json());

const db = new Database("./data.db", {
  verbose: console.log,
});
// #endregion

// #region 'Sql queries'
const getAllWorks = db.prepare(`
SELECT * FROM works;
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
SELECT * FROM works WHERE id = ?
`);

const deleteMuseum = db.prepare(`
DELETE FROM museums WHERE id = ?;
`)

const deleteMuseumWorks = db.prepare(`
DELETE FROM works WHERE museumId = ?;
`)

const updateMuseumWorks = db.prepare(`
UPDATE works SET name = ?, picture = ?, museumId = ? WHERE id = ?;
`)
// #endregion

// #region 'End points Rest API'
app.get("/works", (req, res) => {

  const works = getAllWorks.all();
  
  for (const work of works) {

    const museum = getMuseumById.get(work.museumId);
    work.museum = museum;

  }

  res.send(works);

});

app.get("/works/:id", (req, res) => {

  const id = req.params.id;
  const work = getWorkById.get(id);
  
  const museum = getMuseumById.get(work.museumId);
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

app.post('/museums', (req, res) => {

  // creating an museum is still the same as last week
  const { name, city } = req.body
  const info = createMuseum.run(name, city)

  // const errors = []

  // if (typeof name !== 'string') errors.push()

  if (info.changes > 0) {
    const museum = getMuseumById.get(info.lastInsertRowid)
    res.send(museum)
  } 
  
  else {
    res.send({ error: 'Something went wrong.' })
  }

})

app.post('/works', (req, res) => {

  // to create an work, we need to know the museumId
  const { name, picture, museumId } = req.body
  const info = createWork.run(name, picture, museumId)

  // const errors = []

  // if (typeof name !== 'string') errors.push()

  if (info.changes > 0) {
    const work = getWorkById.get(info.lastInsertRowid)
    res.send(work)
  } 
  
  else {
    res.send({ error: 'Something went wrong.' })
  }

})

app.patch('/works/:id', (req, res) => {

  const id = req.params.id;
  const { name, picture, museumId } = req.body

  const info = updateMuseumWorks.run(name, picture, museumId, id)
  const updatedWork = getWorkById.get(Number(id))

  const museum = getMuseumById.get(updatedWork.museumId)

  if (info.changes > 0) {

    res.send({ ...updatedWork, museum })
  }

  else {
    res.send({ error: 'Something went wrong.' })
  }

})

app.delete('/museums/:id', (req, res) => {

  const id = req.params.id

  deleteMuseumWorks.run(id)
  const info = deleteMuseum.run(id)

  if (info.changes === 0) {
    res.status(404).send({ error: 'museum not found.' })
  } 
  
  else {
    res.send({ message: 'museum deleted.' })
  }

})
// #endregion

app.listen(4000, () => console.log(`Listening on: http://localhost:4000`));