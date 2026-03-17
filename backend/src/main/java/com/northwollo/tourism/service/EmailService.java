package com.northwollo.tourism.service;

public interface EmailService {

    /**
     * Send password reset email
     * @param email Recipient email address
     * @param resetLink Password reset link
     * @return true if email was sent successfully
     */
    boolean sendPasswordResetEmail(String email, String resetLink);

    /**
     * Send email verification email
     * @param email Recipient email address
     * @param verificationLink Email verification link
     * @return true if email was sent successfully
     */
    boolean sendEmailVerificationEmail(String email, String verificationLink);

    /**
     * Send account lockout notification
     * @param email Recipient email address
     * @param unlockTime When the account will be unlocked
     * @return true if email was sent successfully
     */
    boolean sendAccountLockoutEmail(String email, String unlockTime);

    // ==================== OTP EMAIL METHODS ====================

    /**
     * Send password reset OTP email
     * @param email Recipient email address
     * @param otp 6-digit OTP code
     * @param expiryMinutes Minutes until OTP expires
     * @return true if email was sent successfully
     */
    boolean sendPasswordResetOtpEmail(String email, String otp, int expiryMinutes);

    /**
     * Send email verification OTP email
     * @param email Recipient email address
     * @param otp 6-digit OTP code
     * @param expiryMinutes Minutes until OTP expires
     * @return true if email was sent successfully
     */
    boolean sendEmailVerificationOtpEmail(String email, String otp, int expiryMinutes);

    // ==================== BOOKING NOTIFICATIONS ====================

    /**
     * Send notification to hotel owner about new booking request
     * @param ownerEmail Hotel owner's email
     * @param clientName Client's name
     * @param hotelName Hotel name
     * @param checkIn Check-in date
     * @param checkOut Check-out date
     * @param guests Number of guests
     * @return true if email was sent successfully
     */
    boolean sendNewBookingNotification(String ownerEmail, String clientName, String hotelName, 
                                       String checkIn, String checkOut, int guests);

    /**
     * Send notification to client that booking was accepted
     * @param clientEmail Client's email
     * @param hotelName Hotel name
     * @param bookingId Booking ID
     * @return true if email was sent successfully
     */
    boolean sendBookingAcceptedNotification(String clientEmail, String hotelName, Long bookingId);

    /**
     * Send notification to client about proposed cost
     * @param clientEmail Client's email
     * @param hotelName Hotel name
     * @param cost Proposed cost
     * @param bookingId Booking ID
     * @return true if email was sent successfully
     */
    boolean sendCostProposedNotification(String clientEmail, String hotelName, String cost, Long bookingId);

    /**
     * Send notification to hotel owner about receipt upload
     * @param ownerEmail Hotel owner's email
     * @param clientName Client's name
     * @param hotelName Hotel name
     * @param bookingId Booking ID
     * @return true if email was sent successfully
     */
    boolean sendReceiptUploadedNotification(String ownerEmail, String clientName, String hotelName, Long bookingId);

    /**
     * Send notification to client that booking was approved
     * @param clientEmail Client's email
     * @param hotelName Hotel name
     * @param checkIn Check-in date
     * @param checkOut Check-out date
     * @param bookingId Booking ID
     * @return true if email was sent successfully
     */
    boolean sendBookingApprovedNotification(String clientEmail, String hotelName, 
                                            String checkIn, String checkOut, Long bookingId);

    /**
     * Send notification to client that booking was rejected
     * @param clientEmail Client's email
     * @param hotelName Hotel name
     * @param reason Rejection reason
     * @param bookingId Booking ID
     * @return true if email was sent successfully
     */
    boolean sendBookingRejectedNotification(String clientEmail, String hotelName, String reason, Long bookingId);
}