const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public'))); // Ajustado para servir desde raíz

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "clinica"
})
.then(() => console.log('Conectado a MongoDB - BD'))
.catch(err => console.error('Error de conexión:', err));

// Rutas
const authRoutes = require('./adapters/inbound/controllers/AuthController'); // Ajustado al nuevo nombre
app.use('/auth', authRoutes);

// Ruta raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/html', 'register.html')); // Ajustado si moviste HTML
});

// Servidor
app.listen(5000, () => console.log('Abre en tu navegador: http://localhost:5000'));