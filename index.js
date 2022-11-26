const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const { query } = require('express');
const app = express();
const port = process.env.PORT || 5000;

// middlewire
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2u6wmpl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}


async function run() {
    try{
        const usersCollection = client.db('smartPhonez').collection('usersCollection');
        const categoriesCollection = client.db('smartPhonez').collection('categoriesCollection');
        const productCollection = client.db('smartPhonez').collection('productCollection');
        const bookingCollection = client.db('smartPhonez').collection('bookingCollection');


        // jwt check
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token, haveUser: 1 });
            }
            res.status(403).send({ accessToken: '', haveUser: 0 })
        });


        // find all users
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });

        // find a specific user
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.find(query).toArray();
            res.send(user);
        })


        // insert new user on register
        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });


        // load categories
        app.get('/categories', async (req, res) => {
            const query = {};
            const categories = await categoriesCollection.find(query).toArray();
            res.send(categories);
        })

        // load category by id
        app.get('/categories/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id)};
            const category = await categoriesCollection.find(query).toArray();
            res.send(category);
        })

        // load all product
        app.get('/products', async (req, res) => {
            const query = {};
            const products = await productCollection.find(query).toArray();
            res.send(products);
        })

        // load product by category id
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { categoryId: id};
            const products = await productCollection.find(query).toArray();
            res.send(products);
        })

        // load products by advertise
        app.get('/ad-products/:ad', async (req, res) => {
            const value = req.params.ad;
            const query = { advertise: value };
            const addproducts = await productCollection.find(query).toArray();
            res.send(addproducts);
        })

        // add new booking
        app.post('/booking', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const query = {userEmail: booking.userEmail};
            const existEmail = await bookingCollection.find(query).toArray();
            const alreadyExist = existEmail.find(exist => exist.productId === booking.productId);
            if(alreadyExist){
                return res.send({message: 'Already Booked'});
            }
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        });


    }
    finally{

    }
}
run().catch(console.log);


app.get('/', (req, res) => {
    res.send('Smart Phonez Node Server is Running...');
});

app.listen(port, () => {
    console.log(`Smart Phonez Node Server is Running On ${port}`);
})