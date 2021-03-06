import { Message } from 'discord.js';
import { SchwenzoClient } from './SchwenzoBot';

export default abstract class Component {
  client: SchwenzoClient;

  constructor(client: SchwenzoClient) {
    this.client = client;
  }

  onReady(): void | Promise<void> {}

  async onMessage(message: Message): Promise<void> {}
}
