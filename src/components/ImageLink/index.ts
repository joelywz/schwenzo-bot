import Jimp, { MIME_PNG } from 'jimp';
import { SchwenzoClient } from '../../core/SchwenzoBot';
import { Message } from 'discord.js';
import { PrismaClient } from '@prisma/client';
import Component from '../../core/Component';
import ImageBlob from '../ImageBlob';

class Link {
  private message: string;
  private imageName: string;

  constructor(message: string, imageName: string) {
    this.message = message;
    this.imageName = imageName;
  }

  getMessage() {
    return this.message;
  }

  getImageName() {
    return this.imageName;
  }
}

class LinkGuild {
  private guildId: string;
  private links: Link[] = [];
  private max: number = 5;

  constructor(guildId: string, max?: number) {
    this.guildId = guildId;
    if (max) this.max = max;
  }

  getGuildId() {
    return this.guildId;
  }

  getLinkMessages() {
    return this.links.map((l) => l.getMessage());
  }

  getMax() {
    return this.max;
  }

  add(message: string, fileName: string) {
    this.links.push(new Link(message, fileName));
  }

  remove(message: string) {
    for (let i = 0; i < this.links.length; i++) {
      if (this.links[i].getMessage() == message) {
        this.links.splice(i, 1);
        return;
      }
    }
    throw new Error("I don't think this message is linked to anything.");
  }

  hasMaxReached() {
    return this.links.length >= this.max;
  }

  hasMessage(message: string) {
    for (const l of this.links) {
      if (l.getMessage() == message) return true;
    }
    return false;
  }

  getImageName(message: string) {
    for (const l of this.links) {
      if (l.getMessage() == message) return l.getImageName();
    }
    throw new Error("I can't seem to find the image");
  }
}

export default class ImageLink extends Component {
  imageBlob: ImageBlob;
  db: Db;
  linkGuilds: LinkGuild[] = [];
  maxWidthHeight: number;

  constructor(
    client: SchwenzoClient,
    imageBlob: ImageBlob,
    maxWidthHeight: number = 128
  ) {
    super(client);
    this.imageBlob = imageBlob;
    this.db = new Db(client.prisma);
    this.maxWidthHeight = maxWidthHeight;
  }

  async onReady() {
    await this.loadFromDb();
  }

  private async loadFromDb() {
    try {
      const linkedImages = await this.db.getLinks();

      let count = 0;
      for (const l of linkedImages) {
        const lg = this.getLinkGuild(l.guildId);
        lg.add(l.message, l.path);
        count++;
      }
      console.info(`ImageLink: Linked ${count} image(s).`);
    } catch (e) {
      console.info(`ImageLink: Failed to load from database.`);
      console.error(e);
    }
  }

  async add(guildId: string, message: string, url: string) {
    const linkGuild = this.getLinkGuild(guildId);
    if (linkGuild.hasMaxReached()) throw new Error('Maximum limit reached');

    let image;

    imageMod: try {
      image = await Jimp.read(url);
      // Resize
      const width = image.getWidth();
      const height = image.getHeight();

      if (width <= this.maxWidthHeight && height <= this.maxWidthHeight)
        break imageMod;
      if (width > height) {
        const ratio = this.maxWidthHeight / width;
        image.resize(width * ratio, height * ratio);
      } else if (height > width) {
        const ratio = this.maxWidthHeight / height;
        image.resize(width * ratio, height * ratio);
      } else {
        image.resize(this.maxWidthHeight, this.maxWidthHeight);
      }
    } catch (e) {
      throw new Error('Bad url.');
    }

    const buffer = await image.getBufferAsync(MIME_PNG);

    const fileName = await this.imageBlob.save(buffer, 'png');
    linkGuild.add(message, fileName);

    // Save to database
    await this.db.save(guildId, message, fileName);

    return fileName;
  }

  async remove(guildId: string, message: string) {
    const linkGuild = this.getLinkGuild(guildId);
    const imageName = linkGuild.getImageName(message);

    // Remove references to the image
    linkGuild.remove(message);
    // Remove file
    this.imageBlob.delete(imageName);

    // Remove from database
    await this.db.delete(guildId, message);
  }

  async onMessage(message: Message) {
    const guildId = message.guildId;
    if (!guildId) return;

    const linkGuild = this.getLinkGuild(guildId);
    if (!linkGuild.hasMessage(message.content)) return;

    try {
      const imageName = linkGuild.getImageName(message.content);
      const filePath = this.imageBlob.retrieveByName(imageName);
      message.reply({
        files: [filePath],
      });
      return;
    } catch (e) {
      const error = e as Error;
      if (error.message) console.error(`ImageLink: ${error.message}`);
      message.reply("I can't seem to find the image on my side anymore. :(");
      console.info(
        `ImageLink: Cleaning up link "${message.content}" for guild ${guildId}.`
      );
      try {
        await this.remove(guildId, message.content);
      } catch (e) {}
    }
  }

  private getLinkGuild(guildId: string): LinkGuild {
    let linkGuild = this.linkGuilds.filter(
      (linkGuild) => linkGuild.getGuildId() == guildId
    )[0];
    if (linkGuild) return linkGuild;

    linkGuild = new LinkGuild(guildId);
    this.linkGuilds.push(linkGuild);
    return linkGuild;
  }

  getLinkMessages(guildId: string) {
    const lg = this.getLinkGuild(guildId);
    return lg.getLinkMessages();
  }
}

class Db {
  prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async save(guildId: string, message: string, fileName: string) {
    await this.prisma.linkedImage.create({
      data: {
        guildId,
        message,
        path: fileName,
      },
    });
  }

  async getLinks() {
    return await this.prisma.linkedImage.findMany();
  }

  async delete(guildId: string, message: string) {
    await this.prisma.linkedImage.deleteMany({
      where: {
        guildId,
        message,
      },
    });
  }
}
