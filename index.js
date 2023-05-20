const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const jwt = require("jsonwebtoken")
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.USER_PASS}@cluster0.pr3rbd0.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version


//jwt verify function
const verifyJWT = (req,res,next) => {
  const authorization = req.headers.authorization;
  if(!authorization){
     req.send(401).send({error:true,message:'unauthorized access'})
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded) {
   if(err) {
    return res.send({error:true,message:"unauthorized access"})
   }
   req.decoded = decoded;
   next()
  });
}





const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  useNewUrlParser:true,
  useUnifiedTopology:true,
  maxPoolSize:10,
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
     client.connect((err) => {
      if(err){
          console.log(err);
          return
      }
  });

    const toyCollection = client.db("superHeroDB").collection("toys")


    // jwt token collection
    app.post("/jwt", async (req,res) => {
      const user = req.body;
      const token =  jwt.sign(user,process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({token})
    })



    //get toys base on category
    app.get("/alltoys/:category", async (req ,res) => {
        const categoryText = req.params.category;
        const query = {category : categoryText}
        const result = await toyCollection.find(query).toArray()
        res.send(result)
    })

    //get all toys data
    app.get("/alltoycollection", async (req,res) => {
        const result = await toyCollection.find({}).limit(20).toArray();
        res.send(result)
    })

    //get data base on search field
    app.get("/alltoycollection/:text", async (req,res) => {
        const text = req.params.text;
          if(text){
            const query = { toytitle: { $regex: text, $options: "i" } };
            const result = await toyCollection.find(query).limit(20).toArray();
            res.send(result)
          }
    })


    //total toy
    app.get("/totaltoy", async (req,res) => {
      const result = await toyCollection.estimatedDocumentCount();
      res.send({totalToy: 5})
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

    //my toys list (specific user) (jwt verify and also asc ,dsc)
    app.get("/usertoys/:text", verifyJWT, async (req,res) => {
      
      const decoded = req.decoded;
      const text = req.params.text;

      if(decoded?.email !== req.query?.email){
        return res.status(401).send({error: 1,message: "forbidden access"})
      }

      let query = {};
      if(req.query?.email){
        query = {sellermail: req.query.email};
      }



        if(text == "lth"){
          const result = await toyCollection.find(query).sort({price:1}).toArray();
          res.send(result)

        }
        else if(text == "htl"){
          const result = await toyCollection.find(query).sort({price:-1}).toArray();
          res.send(result)
        }
        else{
          const result = await toyCollection.find(query).toArray();
          res.send(result)
        }

        
    })

    //update toy details 
    app.put("/toydetails/:id", async (req,res) => {
        const id = req.params.id;
        const updateToyInfo = req.body;
        const filter = {_id: new ObjectId(id)};
        const updateToy = {
            $set:{
              photo : updateToyInfo.photo,
              toytitle : updateToyInfo.toytitle,
              sellername : updateToyInfo.sellername,
              sellermail : updateToyInfo.sellermail,
              category : updateToyInfo.category,
              price : updateToyInfo.price,
              ratings : updateToyInfo.ratings,
              quantity : updateToyInfo.quantity,
              details : updateToyInfo.details,
            }
        }
        const result = await toyCollection.updateOne(filter, updateToy);
        res.send(result)
    })

    // delete my toy
    app.delete("/toydetails/:id", async (req,res) => {
      const id = req.params.id;
      const userEmail = req.query.email;
      const query = {_id: new ObjectId(id),sellermail: userEmail}
      const result = await toyCollection.deleteOne(query);
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
