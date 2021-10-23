import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { SchwenzoClient } from '../../SchwenzoBot';
import path from 'path';

export default class ImageBlob {
  baseDir: string;

  constructor(baseDir: string, client: SchwenzoClient) {
    this.baseDir = baseDir;
  }

  retrieveByName(relPath: string): string {
    const abPath = this.toAbsolute(`${this.baseDir}/${relPath}`);

    if (!fs.existsSync(abPath)) throw new Error('File does not exist.');
    return this.toAbsolute(`${this.baseDir}/${relPath}`);
  }

  delete(fileName: string) {
    const abFilePath = this.toAbsolute(`${this.baseDir}/${fileName}`);
    fs.rmSync(abFilePath);
  }

  async save(image: Buffer, fileType: string): Promise<string> {
    // Save file to directory
    const id = uuidv4();

    const abWriteDir = this.toAbsolute(this.baseDir);
    if (!fs.existsSync(abWriteDir))
      fs.mkdirSync(abWriteDir, { recursive: true });

    const relWritePath = `${this.baseDir}/${id}.${fileType}`;
    const abWritePath = this.toAbsolute(relWritePath);

    fs.writeFileSync(abWritePath, image, 'base64');

    return `${id}.${fileType}`;
  }

  private toAbsolute(relPath: string) {
    return path.resolve(relPath);
  }
}

// class Db {
//   prisma: PrismaClient;

//   constructor(prisma: PrismaClient) {
//     this.prisma = prisma;
//   }

//   async saveImagePath(relPath: string) {
//     await this.prisma.image.create({
//       data: {
//         path: relPath,
//       },
//     });
//   }

//   async deleteImagePath(relPath: string) {
//     try {
//       await this.prisma.image.deleteMany({
//         where: {
//           path: relPath,
//         },
//       });
//     } catch (e) {
//       console.error(`Failed to delete image path "${relPath}" from database.`);
//     }
//   }
// }
