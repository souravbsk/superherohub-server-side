const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.USER_PASS}@cluster0.pr3rbd0.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const toyCollection = client.db("superHeroDB").collection("toys")


    //get toys base on category
    app.get("/alltoys/:category", async (req ,res) => {
        const categoryText = req.params.category;
        const query = {category : categoryText}
        const result = await toyCollection.find(query).toArray()
        res.send(result)
    })

    //get all toys data
    app.get("/alltoys", async (req,res) => {
        const result = await toyCollection.find({}).toArray();
        res.send(result)
    })

    //get specific toys details

    app.get("/toydetails/:id", async (req,res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const result =  await toyCollection.findOne(query);
        res.send(result);
    })

    //add to toy 
    app.post("/alltoys", async (req,res) => {
        const newToy = req.body;
        const result = await toyCollection.insertOne(newToy);
        res.send(result)
    })












    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Super Hero server running");
});

app.listen(port, () => {
  console.log(`super hero running on this port ${port}`);
});
