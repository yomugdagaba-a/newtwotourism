package com.northwollo.tourism.service.impl;

import com.northwollo.tourism.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@northwollotourism.com}")
    private String fromEmail;

    @Value("${spring.mail.enabled:false}")
    private boolean emailEnabled;

    @Value("${app.frontend.base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    @Override
    public boolean sendPasswordResetEmail(String email, String resetLink) {
        String subject = "Reset Your Password - North Wollo Tourism";
        String htmlContent = buildPasswordResetEmailHtml(resetLink);
        
        return sendEmail(email, subject, htmlContent, "PASSWORD RESET");
    }

    @Override
    public boolean sendEmailVerificationEmail(String email, String verificationLink) {
        String subject = "Verify Your Email - North Wollo Tourism";
        String htmlContent = buildEmailVerificationHtml(verificationLink);
        
        return sendEmail(email, subject, htmlContent, "EMAIL VERIFICATION");
    }

    @Override
    public boolean sendAccountLockoutEmail(String email, String unlockTime) {
        String subject = "Account Temporarily Locked - North Wollo Tourism";
        String htmlContent = buildAccountLockoutEmailHtml(unlockTime);
        
        return sendEmail(email, subject, htmlContent, "ACCOUNT LOCKOUT");
    }

    @Override
    public boolean sendPasswordResetOtpEmail(String email, String otp, int expiryMinutes) {
        String subject = "🔐 Your Password Reset OTP - North Wollo Tourism";
        String htmlContent = buildPasswordResetOtpEmailHtml(otp, expiryMinutes);
        
        // Log OTP for development (remove in production)
        log.info("PASSWORD RESET OTP for {}: {}", email, otp);
        
        return sendEmail(email, subject, htmlContent, "PASSWORD_RESET_OTP");
    }

    @Override
    public boolean sendEmailVerificationOtpEmail(String email, String otp, int expiryMinutes) {
        String subject = "✉️ Verify Your Email - North Wollo Tourism";
        String htmlContent = buildEmailVerificationOtpEmailHtml(otp, expiryMinutes);
        
        // Log OTP for development (remove in production)
        log.info("EMAIL VERIFICATION OTP for {}: {}", email, otp);
        
        return sendEmail(email, subject, htmlContent, "EMAIL_VERIFICATION_OTP");
    }

    private boolean sendEmail(String to, String subject, String htmlContent, String emailType) {
        // Always log the email for debugging
        log.info("=== {} EMAIL ===", emailType);
        log.info("To: {}", to);
        log.info("Subject: {}", subject);
        
        if (!emailEnabled) {
            log.info("Email sending is DISABLED. Set spring.mail.enabled=true to enable.");
            log.info("Email content logged for development purposes.");
            log.info("===========================");
            return true; // Return true to not block the flow in development
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // true = HTML content
            
            mailSender.send(message);
            log.info("Email sent successfully to: {}", to);
            log.info("===========================");
            return true;
        } catch (MessagingException e) {
            log.error("Failed to send {} email to {}: {}", emailType, to, e.getMessage());
            return false;
        }
    }

    private String buildPasswordResetEmailHtml(String resetLink) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 5px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏔️ North Wollo Tourism</h1>
                        <p>Password Reset Request</p>
                    </div>
                    <div class="content">
                        <h2>Reset Your Password</h2>
                        <p>We received a request to reset your password. Click the button below to create a new password:</p>
                        <p style="text-align: center;">
                            <a href="%s" class="button">Reset Password</a>
                        </p>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">%s</p>
                        <div class="warning">
                            <strong>⚠️ Important:</strong> This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
                        </div>
                    </div>
                    <div class="footer">
                        <p>© 2025 North Wollo Tourism. All rights reserved.</p>
                        <p>This is an automated message, please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(resetLink, resetLink);
    }

    private String buildEmailVerificationHtml(String verificationLink) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #11998e 0%%, #38ef7d 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; background: #11998e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    .info { background: #d1ecf1; border: 1px solid #bee5eb; padding: 10px; border-radius: 5px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏔️ North Wollo Tourism</h1>
                        <p>Email Verification</p>
                    </div>
                    <div class="content">
                        <h2>Welcome! Verify Your Email</h2>
                        <p>Thank you for registering with North Wollo Tourism. Please verify your email address to complete your registration:</p>
                        <p style="text-align: center;">
                            <a href="%s" class="button">Verify Email</a>
                        </p>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">%s</p>
                        <div class="info">
                            <strong>ℹ️ Note:</strong> This verification link will expire in 24 hours.
                        </div>
                    </div>
                    <div class="footer">
                        <p>© 2025 North Wollo Tourism. All rights reserved.</p>
                        <p>This is an automated message, please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(verificationLink, verificationLink);
    }

    private String buildAccountLockoutEmailHtml(String unlockTime) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #eb3349 0%%, #f45c43 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    .alert { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔒 Security Alert</h1>
                        <p>Account Temporarily Locked</p>
                    </div>
                    <div class="content">
                        <h2>Your Account Has Been Locked</h2>
                        <div class="alert">
                            <p><strong>⚠️ Multiple failed login attempts detected.</strong></p>
                            <p>For your security, your account has been temporarily locked.</p>
                        </div>
                        <p><strong>Unlock Time:</strong> %s</p>
                        <p>If this wasn't you, we recommend:</p>
                        <ul>
                            <li>Changing your password immediately after unlock</li>
                            <li>Enabling two-factor authentication</li>
                            <li>Reviewing your recent account activity</li>
                        </ul>
                        <p>If you need immediate assistance, please contact our support team.</p>
                    </div>
                    <div class="footer">
                        <p>© 2025 North Wollo Tourism. All rights reserved.</p>
                        <p>This is an automated security notification.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(unlockTime);
    }

    // ==================== OTP EMAIL TEMPLATES ====================

    private String buildPasswordResetOtpEmailHtml(String otp, int expiryMinutes) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0; }
                    .header h1 { margin: 0; font-size: 28px; }
                    .content { background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                    .otp-box { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0; }
                    .otp-code { font-size: 48px; font-weight: bold; color: white; letter-spacing: 12px; font-family: 'Courier New', monospace; margin: 0; }
                    .otp-label { color: rgba(255,255,255,0.9); font-size: 14px; margin-bottom: 10px; }
                    .timer { display: inline-flex; align-items: center; background: #fff3cd; color: #856404; padding: 12px 20px; border-radius: 8px; margin: 20px 0; font-weight: 500; }
                    .timer svg { margin-right: 8px; }
                    .warning { background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                    .divider { height: 1px; background: #eee; margin: 25px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Password Reset</h1>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">North Wollo Tourism</p>
                    </div>
                    <div class="content">
                        <h2 style="margin-top: 0; color: #333;">Your One-Time Password</h2>
                        <p>We received a request to reset your password. Use the OTP below to proceed:</p>
                        
                        <div class="otp-box">
                            <p class="otp-label">YOUR VERIFICATION CODE</p>
                            <p class="otp-code">%s</p>
                        </div>
                        
                        <div class="timer">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12,6 12,12 16,14"></polyline>
                            </svg>
                            This code expires in <strong style="margin-left: 5px;">%d minutes</strong>
                        </div>
                        
                        <div class="divider"></div>
                        
                        <div class="warning">
                            <strong>⚠️ Security Notice:</strong>
                            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                                <li>Never share this code with anyone</li>
                                <li>Our team will never ask for this code</li>
                                <li>If you didn't request this, ignore this email</li>
                            </ul>
                        </div>
                    </div>
                    <div class="footer">
                        <p>© 2025 North Wollo Tourism. All rights reserved.</p>
                        <p>This is an automated message, please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(otp, expiryMinutes);
    }

    private String buildEmailVerificationOtpEmailHtml(String otp, int expiryMinutes) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #11998e 0%%, #38ef7d 100%%); color: white; padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0; }
                    .header h1 { margin: 0; font-size: 28px; }
                    .content { background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                    .otp-box { background: linear-gradient(135deg, #11998e 0%%, #38ef7d 100%%); padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0; }
                    .otp-code { font-size: 48px; font-weight: bold; color: white; letter-spacing: 12px; font-family: 'Courier New', monospace; margin: 0; }
                    .otp-label { color: rgba(255,255,255,0.9); font-size: 14px; margin-bottom: 10px; }
                    .timer { display: inline-flex; align-items: center; background: #d4edda; color: #155724; padding: 12px 20px; border-radius: 8px; margin: 20px 0; font-weight: 500; }
                    .timer svg { margin-right: 8px; }
                    .welcome { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                    .divider { height: 1px; background: #eee; margin: 25px 0; }
                    .features { display: flex; justify-content: space-around; margin: 25px 0; text-align: center; }
                    .feature { flex: 1; padding: 15px; }
                    .feature-icon { font-size: 32px; margin-bottom: 8px; }
                    .feature-text { font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✉️ Verify Your Email</h1>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">Welcome to North Wollo Tourism!</p>
                    </div>
                    <div class="content">
                        <div class="welcome">
                            <strong>🎉 Welcome aboard!</strong>
                            <p style="margin: 10px 0 0 0;">You're just one step away from exploring the beautiful North Wollo region.</p>
                        </div>
                        
                        <h2 style="margin-top: 25px; color: #333;">Your Verification Code</h2>
                        <p>Enter this code to verify your email address:</p>
                        
                        <div class="otp-box">
                            <p class="otp-label">YOUR VERIFICATION CODE</p>
                            <p class="otp-code">%s</p>
                        </div>
                        
                        <div class="timer">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12,6 12,12 16,14"></polyline>
                            </svg>
                            This code expires in <strong style="margin-left: 5px;">%d minutes</strong>
                        </div>
                        
                        <div class="divider"></div>
                        
                        <p style="color: #666; font-size: 14px;">Once verified, you'll be able to:</p>
                        <div class="features">
                            <div class="feature">
                                <div class="feature-icon">🏨</div>
                                <div class="feature-text">Book Hotels</div>
                            </div>
                            <div class="feature">
                                <div class="feature-icon">🏞️</div>
                                <div class="feature-text">Explore Places</div>
                            </div>
                            <div class="feature">
                                <div class="feature-icon">⭐</div>
                                <div class="feature-text">Leave Reviews</div>
                            </div>
                        </div>
                    </div>
                    <div class="footer">
                        <p>© 2025 North Wollo Tourism. All rights reserved.</p>
                        <p>If you didn't create an account, please ignore this email.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(otp, expiryMinutes);
    }

    // ==================== BOOKING NOTIFICATION METHODS ====================

    @Override
    public boolean sendNewBookingNotification(String ownerEmail, String clientName, String hotelName,
                                              String checkIn, String checkOut, int guests) {
        String subject = "🏨 New Booking Request - " + hotelName;
        String htmlContent = buildNewBookingEmailHtml(clientName, hotelName, checkIn, checkOut, guests);
        return sendEmail(ownerEmail, subject, htmlContent, "NEW_BOOKING");
    }

    @Override
    public boolean sendBookingAcceptedNotification(String clientEmail, String hotelName, Long bookingId) {
        String subject = "✓ Booking Accepted - " + hotelName;
        String htmlContent = buildBookingAcceptedEmailHtml(hotelName, bookingId);
        return sendEmail(clientEmail, subject, htmlContent, "BOOKING_ACCEPTED");
    }

    @Override
    public boolean sendCostProposedNotification(String clientEmail, String hotelName, String cost, Long bookingId) {
        String subject = "💰 Cost Proposal - " + hotelName;
        String htmlContent = buildCostProposedEmailHtml(hotelName, cost, bookingId);
        return sendEmail(clientEmail, subject, htmlContent, "COST_PROPOSED");
    }

    @Override
    public boolean sendReceiptUploadedNotification(String ownerEmail, String clientName, String hotelName, Long bookingId) {
        String subject = "🧾 Receipt Uploaded - Booking #" + bookingId;
        String htmlContent = buildReceiptUploadedEmailHtml(clientName, hotelName, bookingId);
        return sendEmail(ownerEmail, subject, htmlContent, "RECEIPT_UPLOADED");
    }

    @Override
    public boolean sendBookingApprovedNotification(String clientEmail, String hotelName,
                                                   String checkIn, String checkOut, Long bookingId) {
        String subject = "🎉 Booking Confirmed! - " + hotelName;
        String htmlContent = buildBookingApprovedEmailHtml(hotelName, checkIn, checkOut, bookingId);
        return sendEmail(clientEmail, subject, htmlContent, "BOOKING_APPROVED");
    }

    @Override
    public boolean sendBookingRejectedNotification(String clientEmail, String hotelName, String reason, Long bookingId) {
        String subject = "❌ Booking Declined - " + hotelName;
        String htmlContent = buildBookingRejectedEmailHtml(hotelName, reason, bookingId);
        return sendEmail(clientEmail, subject, htmlContent, "BOOKING_REJECTED");
    }

    // ==================== BOOKING EMAIL TEMPLATES ====================

    private String buildNewBookingEmailHtml(String clientName, String hotelName, String checkIn, String checkOut, int guests) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
                    .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏨 New Booking Request</h1>
                        <p>%s</p>
                    </div>
                    <div class="content">
                        <h2>You have a new booking request!</h2>
                        <div class="details">
                            <p><strong>👤 Client:</strong> %s</p>
                            <p><strong>📅 Check-in:</strong> %s</p>
                            <p><strong>📅 Check-out:</strong> %s</p>
                            <p><strong>👥 Guests:</strong> %d</p>
                        </div>
                        <p>Please log in to your dashboard to review and respond to this request.</p>
                        <p style="text-align: center;">
                            <a href="%s/owner/bookings" class="button">View Booking</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>© 2025 North Wollo Tourism. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(hotelName, clientName, checkIn, checkOut, guests, frontendBaseUrl);
    }

    private String buildBookingAcceptedEmailHtml(String hotelName, Long bookingId) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #11998e 0%%, #38ef7d 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .success { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; }
                    .button { display: inline-block; background: #11998e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✓ Booking Accepted!</h1>
                        <p>%s</p>
                    </div>
                    <div class="content">
                        <div class="success">
                            <h2 style="color: #155724; margin: 0;">Great news!</h2>
                            <p style="color: #155724;">Your booking request #%d has been accepted.</p>
                        </div>
                        <p>The hotel owner will send you a cost proposal shortly. Please check your booking page for updates.</p>
                        <p style="text-align: center;">
                            <a href="%s/hotels" class="button">View My Bookings</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>© 2025 North Wollo Tourism. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(hotelName, bookingId, frontendBaseUrl);
    }

    private String buildCostProposedEmailHtml(String hotelName, String cost, Long bookingId) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .price { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin: 20px 0; }
                    .price h2 { margin: 0; font-size: 36px; }
                    .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>💰 Cost Proposal</h1>
                        <p>%s</p>
                    </div>
                    <div class="content">
                        <h2>Your booking cost is ready!</h2>
                        <p>The hotel owner has proposed the following cost for your booking #%d:</p>
                        <div class="price">
                            <p style="margin: 0; opacity: 0.8;">Total Amount</p>
                            <h2>%s ETB</h2>
                        </div>
                        <p>To confirm your booking, please upload your payment receipt through your booking page.</p>
                        <p style="text-align: center;">
                            <a href="%s/hotels" class="button">Upload Receipt</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>© 2025 North Wollo Tourism. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(hotelName, bookingId, cost, frontendBaseUrl);
    }

    private String buildReceiptUploadedEmailHtml(String clientName, String hotelName, Long bookingId) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #f093fb 0%%, #f5576c 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .alert { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    .button { display: inline-block; background: #f5576c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🧾 Receipt Uploaded</h1>
                        <p>%s</p>
                    </div>
                    <div class="content">
                        <h2>Payment receipt received!</h2>
                        <div class="alert">
                            <p><strong>Action Required:</strong> Please review and approve the payment.</p>
                        </div>
                        <p><strong>Client:</strong> %s</p>
                        <p><strong>Booking ID:</strong> #%d</p>
                        <p>Please log in to verify the receipt and approve the booking.</p>
                        <p style="text-align: center;">
                            <a href="%s/owner/bookings" class="button">Review Receipt</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>© 2025 North Wollo Tourism. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(hotelName, clientName, bookingId, frontendBaseUrl);
    }

    private String buildBookingApprovedEmailHtml(String hotelName, String checkIn, String checkOut, Long bookingId) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #11998e 0%%, #38ef7d 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .confirmed { background: #d4edda; border: 2px solid #28a745; padding: 30px; border-radius: 10px; text-align: center; margin: 20px 0; }
                    .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Booking Confirmed!</h1>
                        <p>%s</p>
                    </div>
                    <div class="content">
                        <div class="confirmed">
                            <h2 style="color: #28a745; margin: 0;">Congratulations!</h2>
                            <p style="color: #155724; font-size: 18px;">Your booking #%d is confirmed!</p>
                        </div>
                        <div class="details">
                            <h3>📋 Booking Details</h3>
                            <p><strong>🏨 Hotel:</strong> %s</p>
                            <p><strong>📅 Check-in:</strong> %s</p>
                            <p><strong>📅 Check-out:</strong> %s</p>
                        </div>
                        <p>We look forward to welcoming you! If you have any questions, please contact the hotel directly.</p>
                    </div>
                    <div class="footer">
                        <p>© 2025 North Wollo Tourism. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(hotelName, bookingId, hotelName, checkIn, checkOut);
    }

    private String buildBookingRejectedEmailHtml(String hotelName, String reason, Long bookingId) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #eb3349 0%%, #f45c43 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .reason { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>❌ Booking Declined</h1>
                        <p>%s</p>
                    </div>
                    <div class="content">
                        <h2>We're sorry</h2>
                        <p>Unfortunately, your booking request #%d could not be accepted.</p>
                        <div class="reason">
                            <p><strong>Reason:</strong></p>
                            <p>%s</p>
                        </div>
                        <p>Don't worry! There are many other great hotels available. Browse our selection to find your perfect stay.</p>
                        <p style="text-align: center;">
                            <a href="%s/hotels" class="button">Browse Hotels</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>© 2025 North Wollo Tourism. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(hotelName, bookingId, reason, frontendBaseUrl);
    }
}
