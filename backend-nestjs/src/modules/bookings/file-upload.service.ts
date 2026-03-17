import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class FileUploadService {
  private readonly uploadDir = process.env.UPLOAD_DIR || 'uploads';
  private readonly allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'];
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB

  constructor() {
    this.ensureUploadDirExists();
  }

  private ensureUploadDirExists() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      console.log(`✓ Created upload directory: ${this.uploadDir}`);
    }
  }

  uploadFile(file: MulterFile, subDirectory?: string): string {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException('File size exceeds maximum allowed size of 10MB');
    }

    // Validate file extension
    const extension = this.getFileExtension(file.originalname).toLowerCase();
    if (!this.allowedExtensions.includes(extension)) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: ${this.allowedExtensions.join(', ')}`,
      );
    }

    // Create subdirectory if specified
    let targetDir = this.uploadDir;
    if (subDirectory) {
      targetDir = path.join(this.uploadDir, subDirectory);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
    }

    // Generate unique filename using timestamp and random hash
    const timestamp = Date.now();
    const randomHash = crypto.randomBytes(8).toString('hex');
    const uniqueFilename = `${timestamp}-${randomHash}.${extension}`;
    const targetPath = path.join(targetDir, uniqueFilename);

    // Write file to disk
    fs.writeFileSync(targetPath, file.buffer);
    console.log(`✓ File uploaded successfully: ${targetPath}`);

    // Return the URL path
    if (subDirectory) {
      return `/uploads/${subDirectory}/${uniqueFilename}`;
    }
    return `/uploads/${uniqueFilename}`;
  }

  deleteFile(fileUrl: string): boolean {
    if (!fileUrl) {
      return false;
    }

    try {
      // Convert URL path to file path
      const relativePath = fileUrl.replace('/uploads/', '');
      const filePath = path.join(this.uploadDir, relativePath);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✓ File deleted successfully: ${filePath}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to delete file: ${error}`);
      return false;
    }
  }

  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
      return '';
    }
    return filename.substring(lastDotIndex + 1);
  }
}
