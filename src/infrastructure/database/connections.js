const mongoose = require('mongoose');

class MongoDBConnections {
  constructor() {
    this.authConnection = null;
    this.clinicConnection = null;
  }

  async connectAuth() {
    try {
      if (this.authConnection?.readyState === 1) {
        return this.authConnection;
      }
      
      this.authConnection = await mongoose.createConnection(process.env.MONGO_URI, {
        dbName: 'auth',
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 2,
        retryWrites: true,
        w: 'majority'
      });

      await new Promise((resolve, reject) => {
        this.authConnection.once('open', resolve);
        this.authConnection.once('error', reject);
      });

      this.authConnection.on('error', (err) => {
        console.error('Error en conexión Auth:', err.message);
      });

      this.authConnection.on('disconnected', () => {
        console.warn('Desconectado de Auth DB');
      });

      return this.authConnection;
    } catch (error) {
      console.error('Error conectando a Auth DB:', error.message);
      throw error;
    }
  }

  async connectClinic() {
    try {
      if (this.clinicConnection?.readyState === 1) {
        return this.clinicConnection;
      }
      
      this.clinicConnection = await mongoose.createConnection(process.env.MONGO_URI, {
        dbName: 'dclinica',
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 2,
        retryWrites: true,
        w: 'majority'
      });

      await new Promise((resolve, reject) => {
        this.clinicConnection.once('open', resolve);
        this.clinicConnection.once('error', reject);
      });

      this.clinicConnection.on('error', (err) => {
        console.error('Error en conexión Clinica:', err.message);
      });

      this.clinicConnection.on('disconnected', () => {
        console.warn('Desconectado de Clinica DB');
      });

      console.log(`✅ Conectado a base de datos: ${this.clinicConnection.name}`);

      return this.clinicConnection;
    } catch (error) {
      console.error('Error conectando a Clinica DB:', error.message);
      throw error;
    }
  }

  async closeAll() {
    try {
      if (this.authConnection) {
        await this.authConnection.close();
      }
      if (this.clinicConnection) {
        await this.clinicConnection.close();
      }
    } catch (error) {
      console.error('Error cerrando conexiones:', error.message);
    }
  }

  getStatus() {
    return {
      auth: {
        status: this.authConnection?.readyState === 1 ? 'connected' : 'disconnected',
        database: this.authConnection?.name || 'N/A'
      },
      clinic: {
        status: this.clinicConnection?.readyState === 1 ? 'connected' : 'disconnected',
        database: this.clinicConnection?.name || 'N/A'
      }
    };
  }
}

module.exports = new MongoDBConnections();