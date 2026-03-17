#!/usr/bin/env node

/**
 * Gmail SMTP Connection Test
 * 
 * This script tests if your Gmail app password is correct and SMTP is working.
 * 
 * Usage:
 *   node test-gmail.js
 * 
 * What it does:
 *   1. Reads SMTP config from .env
 *   2. Attempts to connect to Gmail SMTP
 *   3. Sends a test email
 *   4. Reports success or failure
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

const config = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
};

const fromEmail = process.env.SMTP_FROM || 'noreply@northwollotourism.com';
const testEmail = process.env.SMTP_USER; // Send to the same email

console.log('\n📧 Gmail SMTP Connection Test\n');
console.log('Configuration:');
console.log(`  Host: ${config.host}`);
console.log(`  Port: ${config.port}`);
console.log(`  Secure: ${config.secure}`);
console.log(`  User: ${config.auth.user}`);
console.log(`  From: ${fromEmail}`);
console.log(`  Test Email To: ${testEmail}`);
console.log('\n⏳ Connecting to Gmail SMTP...\n');

const transporter = nodemailer.createTransport(config);

// Test connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code}`);
    
    if (error.code === 'EAUTH') {
      console.error('\n   💡 This is an authentication error. Check:');
      console.error('      1. Gmail app password is correct (16 chars, no spaces)');
      console.error('      2. 2-Factor Authentication is enabled on Gmail');
      console.error('      3. App password was generated for "Mail" app');
      console.error('      4. SMTP_USER matches your Gmail address');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n   💡 Connection refused. Check:');
      console.error('      1. Internet connection is working');
      console.error('      2. SMTP_HOST is correct (smtp.gmail.com)');
      console.error('      3. SMTP_PORT is correct (587)');
    }
    
    process.exit(1);
  } else {
    console.log('✅ SMTP Connection Successful!\n');
    console.log('⏳ Sending test email...\n');
    
    // Send test email
    transporter.sendMail({
      from: fromEmail,
      to: testEmail,
      subject: '🧪 Tourism Platform - SMTP Test Email',
      html: `
        <h2>✅ SMTP Test Successful!</h2>
        <p>If you're reading this, your Gmail SMTP configuration is working correctly.</p>
        <hr>
        <p><strong>Configuration Details:</strong></p>
        <ul>
          <li>Host: ${config.host}</li>
          <li>Port: ${config.port}</li>
          <li>User: ${config.auth.user}</li>
          <li>From: ${fromEmail}</li>
        </ul>
        <hr>
        <p>You can now proceed with email verification in the application.</p>
        <p><small>This is an automated test email. Please do not reply.</small></p>
      `,
    }, (err, info) => {
      if (err) {
        console.error('❌ Email Send Failed:');
        console.error(`   Error: ${err.message}`);
        process.exit(1);
      } else {
        console.log('✅ Test Email Sent Successfully!\n');
        console.log('📧 Email Details:');
        console.log(`   To: ${testEmail}`);
        console.log(`   Subject: 🧪 Tourism Platform - SMTP Test Email`);
        console.log(`   Response: ${info.response}\n`);
        console.log('✨ Your Gmail SMTP is configured correctly!');
        console.log('   You can now use email verification in the application.\n');
        process.exit(0);
      }
    });
  }
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('\n❌ Test Timeout: No response from Gmail SMTP after 10 seconds');
  console.error('   Check your internet connection and firewall settings.\n');
  process.exit(1);
}, 10000);
