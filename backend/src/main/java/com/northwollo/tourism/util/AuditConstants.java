package com.northwollo.tourism.util;

/**
 * Constants for audit logging system
 */
public final class AuditConstants {

    private AuditConstants() {
        // Utility class
    }

    // Actions
    public static final String ACTION_CREATE = "CREATE";
    public static final String ACTION_UPDATE = "UPDATE";
    public static final String ACTION_DELETE = "DELETE";
    public static final String ACTION_LOGIN = "LOGIN";
    public static final String ACTION_LOGOUT = "LOGOUT";
    public static final String ACTION_REGISTER = "REGISTER";
    public static final String ACTION_PASSWORD_RESET_REQUEST = "PASSWORD_RESET_REQUEST";
    public static final String ACTION_PASSWORD_RESET_CONFIRM = "PASSWORD_RESET_CONFIRM";
    public static final String ACTION_EMAIL_VERIFICATION_SEND = "EMAIL_VERIFICATION_SEND";
    public static final String ACTION_EMAIL_VERIFICATION_CONFIRM = "EMAIL_VERIFICATION_CONFIRM";
    public static final String ACTION_ACCOUNT_LOCKED = "ACCOUNT_LOCKED";
    public static final String ACTION_ACCOUNT_UNLOCKED = "ACCOUNT_UNLOCKED";
    public static final String ACTION_AUTHORIZATION_CHECK = "AUTHORIZATION_CHECK";
    public static final String ACTION_TOKEN_REFRESH = "TOKEN_REFRESH";
    public static final String ACTION_SESSION_EXPIRED = "SESSION_EXPIRED";

    // Resource Types
    public static final String RESOURCE_USER = "USER";
    public static final String RESOURCE_HOTEL = "HOTEL";
    public static final String RESOURCE_TOURISM = "TOURISM";
    public static final String RESOURCE_BOOKING = "BOOKING";
    public static final String RESOURCE_GUIDER = "GUIDER";
    public static final String RESOURCE_MAP_POINT = "MAP_POINT";
    public static final String RESOURCE_PERMISSION = "PERMISSION";
    public static final String RESOURCE_ROLE = "ROLE";
    public static final String RESOURCE_SESSION = "SESSION";
    public static final String RESOURCE_TOKEN = "TOKEN";

    // Categories
    public static final String CATEGORY_AUTHENTICATION = "AUTHENTICATION";
    public static final String CATEGORY_AUTHORIZATION = "AUTHORIZATION";
    public static final String CATEGORY_DATA_CHANGE = "DATA_CHANGE";
    public static final String CATEGORY_SECURITY = "SECURITY";
    public static final String CATEGORY_MAINTENANCE = "MAINTENANCE";
    public static final String CATEGORY_SYSTEM = "SYSTEM";

    // Severity Levels
    public static final String SEVERITY_INFO = "INFO";
    public static final String SEVERITY_WARN = "WARN";
    public static final String SEVERITY_ERROR = "ERROR";
    public static final String SEVERITY_CRITICAL = "CRITICAL";

    // System User
    public static final String SYSTEM_USER = "system";
    public static final String ANONYMOUS_USER = "anonymous";

    // Integrity Status
    public static final String INTEGRITY_GOOD = "GOOD";
    public static final String INTEGRITY_NEEDS_REPAIR = "NEEDS_REPAIR";
    public static final String INTEGRITY_COMPROMISED = "COMPROMISED";

    // Risk Levels
    public static final String RISK_LOW = "LOW";
    public static final String RISK_MEDIUM = "MEDIUM";
    public static final String RISK_HIGH = "HIGH";
    public static final String RISK_CRITICAL = "CRITICAL";
}