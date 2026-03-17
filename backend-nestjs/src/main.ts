import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as https from 'https';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const port = process.env.PORT || 8080;
  
  // Check for SSL certificates
  const certPath = './certificates/localhost.pem';
  const keyPath = './certificates/localhost-key.pem';
  
  let app: NestExpressApplication;
  
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    // HTTPS mode
    const httpsOptions = {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
    };
    
    app = await NestFactory.create<NestExpressApplication>(AppModule, {
      httpsOptions,
    });
  } else {
    // HTTP mode (fallback)
    app = await NestFactory.create<NestExpressApplication>(AppModule);
  }

  // Add security headers middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'",
    );
    
    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions Policy (formerly Feature Policy)
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
    );
    
    // Strict Transport Security (HSTS)
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    
    next();
  });

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'https://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Serve static files from uploads directory
  const uploadsDir = process.env.UPLOAD_DIR || 'uploads';
  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('North Wollo Tourism API')
    .setDescription('Tourism Management System API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    await app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Backend is running on: https://localhost:${port}`);
      console.log(`📚 API Documentation: https://localhost:${port}/api/docs`);
      console.log(`📁 Uploads directory: ${path.resolve(uploadsDir)}`);
    });
  } else {
    await app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Backend is running on: http://localhost:${port}`);
      console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
      console.log(`📁 Uploads directory: ${path.resolve(uploadsDir)}`);
      console.log(`⚠️  SSL certificates not found. Running in HTTP mode.`);
      console.log(`💡 To enable HTTPS, add certificates to ./certificates/`);
    });
  }
}

bootstrap();
