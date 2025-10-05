const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "clinica"
})
.then(() => console.log('Conectado a MongoDB - BD'))
.catch(err => console.error('Error de conexión:', err));

const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.listen(5000, () => console.log('Abre en tu navegador: http://localhost:5000'));