const amqp = require('amqplib');

class RabbitMQClient {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.url = process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672';
  }

  async connect() {
    try {
      console.log('🔌 Intentando conectar a RabbitMQ:', this.url);
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      
      console.log('✅ Conectado a RabbitMQ');

      // Manejar cierre de conexión
      this.connection.on('close', () => {
        console.warn('⚠️ Conexión a RabbitMQ cerrada. Reconectando...');
        this.channel = null;
        setTimeout(() => this.connect(), 5000);
      });

      this.connection.on('error', (err) => {
        console.error(' Error en conexión RabbitMQ:', err.message);
        this.channel = null;
      });

      return this.channel;
    } catch (error) {
      console.error(' Error conectando a RabbitMQ:', error.message);
      this.channel = null;
      this.connection = null;
      setTimeout(() => this.connect(), 5000);
      return null;
    }
  }

  async assertQueue(queueName, options = {}) {
    if (!this.channel) {
      await this.connect();
    }
    
    const defaultOptions = {
      durable: true,
      ...options
    };
    
    return await this.channel.assertQueue(queueName, defaultOptions);
  }

  async assertExchange(exchangeName, type = 'topic', options = {}) {
    if (!this.channel) {
      await this.connect();
    }
    
    const defaultOptions = {
      durable: true,
      ...options
    };
    
    return await this.channel.assertExchange(exchangeName, type, defaultOptions);
  }

  async sendToQueue(queueName, message, options = {}) {
    try {
      if (!this.channel) {
        await this.connect();
      }

      await this.assertQueue(queueName);

      const messageBuffer = Buffer.from(JSON.stringify(message));
      const defaultOptions = {
        persistent: true,
        timestamp: Date.now(),
        ...options
      };

      this.channel.sendToQueue(queueName, messageBuffer, defaultOptions);
      console.log(`📤 Mensaje enviado a cola [${queueName}]:`, message);
      
      return true;
    } catch (error) {
      console.error(` Error enviando mensaje a [${queueName}]:`, error.message);
      return false;
    }
  }

  async publish(exchangeName, routingKey, message, options = {}) {
    try {
      if (!this.channel) {
        await this.connect();
      }

      await this.assertExchange(exchangeName);

      const messageBuffer = Buffer.from(JSON.stringify(message));
      const defaultOptions = {
        persistent: true,
        timestamp: Date.now(),
        ...options
      };

      this.channel.publish(exchangeName, routingKey, messageBuffer, defaultOptions);
      console.log(`📤 Mensaje publicado en [${exchangeName}] con key [${routingKey}]:`, message);
      
      return true;
    } catch (error) {
      console.error(` Error publicando mensaje:`, error.message);
      return false;
    }
  }

  async consume(queueName, callback, options = {}) {
    try {
      if (!this.channel) {
        await this.connect();
      }

      await this.assertQueue(queueName);

      const defaultOptions = {
        noAck: false,
        ...options
      };

      console.log(`👂 Escuchando cola [${queueName}]...`);

      this.channel.consume(queueName, async (msg) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            console.log(`📥 Mensaje recibido de [${queueName}]:`, content);
            
            await callback(content, msg);
            
            if (!defaultOptions.noAck) {
              this.channel.ack(msg);
            }
          } catch (error) {
            console.error(` Error procesando mensaje de [${queueName}]:`, error.message);
            // Rechazar y reencolar el mensaje
            this.channel.nack(msg, false, true);
          }
        }
      }, defaultOptions);

      return true;
    } catch (error) {
      console.error(` Error consumiendo de [${queueName}]:`, error.message);
      return false;
    }
  }

  async bindQueue(queueName, exchangeName, routingKey) {
    try {
      if (!this.channel) {
        await this.connect();
      }

      await this.assertQueue(queueName);
      await this.assertExchange(exchangeName);
      await this.channel.bindQueue(queueName, exchangeName, routingKey);
      
      console.log(`🔗 Cola [${queueName}] vinculada a exchange [${exchangeName}] con key [${routingKey}]`);
      
      return true;
    } catch (error) {
      console.error(` Error vinculando cola:`, error.message);
      return false;
    }
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log('🔌 Conexión a RabbitMQ cerrada');
    } catch (error) {
      console.error(' Error cerrando conexión RabbitMQ:', error.message);
    }
  }
}

module.exports = new RabbitMQClient();