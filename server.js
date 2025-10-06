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
    dbName: "clinica"
})
.then(() => console.log('Conectado a MongoDB - BD'))
.catch(err => console.error('Error de conexión:', err));

// Rutas
const authRoutes = require('./src/adapters/inbound/controllers/AuthController.js'); // Ajustado al nuevo nombre
app.use('/auth', authRoutes);

// Ruta raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html', 'register.html')); // Ajustado si moviste HTML
});

// Servidor
app.listen(5000, () => console.log('Abre en tu navegador: http://localhost:5000'));