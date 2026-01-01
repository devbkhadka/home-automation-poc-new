import mqtt from 'mqtt';

export interface MQTTConfig {
  brokerUrl: string;
  clientId: string;
  username?: string;
  password?: string;
}

export class MQTTService {
  private client: mqtt.MqttClient;
  // private readonly config: MQTTConfig; // Unused

  constructor(config: MQTTConfig) {
    // this.config = config;
    this.client = mqtt.connect(config.brokerUrl, {
      clientId: config.clientId,
      username: config.username,
      password: config.password,
    });

    this.client.on('connect', () => {
      console.log('MQTT client connected');
    });

    this.client.on('error', (error) => {
      console.error('MQTT client error:', error);
    });
  }

  subscribe(topic: string, callback: (message: string) => void): void {
    this.client.subscribe(topic, (error) => {
      if (error) {
        console.error('Failed to subscribe:', error);
      } else {
        console.log(`Subscribed to topic: ${topic}`);
      }
    });

    this.client.on('message', (receivedTopic, message) => {
      if (receivedTopic === topic) {
        callback(message.toString());
      }
    });
  }

  publish(topic: string, message: string, options: mqtt.IClientPublishOptions = {}): void {
    this.client.publish(topic, message, options, (error) => {
      if (error) {
        console.error('Failed to publish:', error);
      }
    });
  }

  disconnect(): void {
    this.client.end();
  }

  isConnected(): boolean {
    return this.client.connected;
  }
}
