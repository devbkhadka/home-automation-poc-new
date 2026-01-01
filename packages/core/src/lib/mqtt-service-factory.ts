import { MQTTService, MQTTConfig } from './mqtt-service.js';

export class MQTTServiceFactory {
  /**
   * Creates an instance of MQTTService using credentials from environment variables.
   *
   * Required environment variables:
   * - MQTT_BROKER_URL: The URL of the MQTT broker (e.g., mqtts://example.com:8883)
   * - MQTT_CLIENT_ID: The client identifier
   * - MQTT_USERNAME: The username for authentication
   * - MQTT_PASSWORD: The password for authentication
   *
   * @returns An instance of MQTTService
   * @throws Error if any required environment variable is missing
   */
  static create(): MQTTService {
    const brokerUrl = process.env['MQTT_BROKER_URL'];
    const clientId = process.env['MQTT_CLIENT_ID'];
    const username = process.env['MQTT_USERNAME'];
    const password = process.env['MQTT_PASSWORD'];

    if (!brokerUrl) {
      throw new Error('MQTT_BROKER_URL environment variable is not defined');
    }

    if (!clientId) {
      throw new Error('MQTT_CLIENT_ID environment variable is not defined');
    }

    if (!username) {
      throw new Error('MQTT_USERNAME environment variable is not defined');
    }

    if (!password) {
      throw new Error('MQTT_PASSWORD environment variable is not defined');
    }

    const config: MQTTConfig = {
      brokerUrl,
      clientId,
      username,
      password,
    };

    return new MQTTService(config);
  }
}
