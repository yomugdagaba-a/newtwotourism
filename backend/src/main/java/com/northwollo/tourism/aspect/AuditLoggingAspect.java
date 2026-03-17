package com.northwollo.tourism.aspect;

import com.northwollo.tourism.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.HashMap;
import java.util.Map;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditLoggingAspect {

    private final AuditLogService auditLogService;

    @Pointcut("@annotation(org.springframework.web.bind.annotation.PostMapping) || " +
              "@annotation(org.springframework.web.bind.annotation.PutMapping) || " +
              "@annotation(org.springframework.web.bind.annotation.DeleteMapping)")
    public void dataModifyingEndpoints() {}

    @Pointcut("execution(* com.northwollo.tourism.controller..*(..))")
    public void controllerMethods() {}

    @Pointcut("execution(* com.northwollo.tourism.service.impl.AuthServiceImpl.login(..))")
    public void loginMethod() {}

    @Pointcut("execution(* com.northwollo.tourism.service.impl.AuthServiceImpl.register(..))")
    public void registerMethod() {}

    @Pointcut("execution(* com.northwollo.tourism.service.impl.PasswordResetServiceImpl.*(..))")
    public void passwordResetMethods() {}

    @Pointcut("execution(* com.northwollo.tourism.service.impl.EmailVerificationServiceImpl.*(..))")
    public void emailVerificationMethods() {}

    @Pointcut("execution(* com.northwollo.tourism.service.impl.AccountSecurityServiceImpl.*(..))")
    public void securityMethods() {}

    @AfterReturning(pointcut = "controllerMethods() && dataModifyingEndpoints()", returning = "result")
    public void logDataModification(JoinPoint joinPoint, Object result) {
        try {
            String methodName = joinPoint.getSignature().getName();
            String className = joinPoint.getTarget().getClass().getSimpleName();
            
            // Extract user information
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Long userId = null;
            String username = "anonymous";
            
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
                username = auth.getName();
                // Try to extract user ID if available
                if (auth.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
                    // You might need to cast to your custom UserDetails implementation to get ID
                    username = ((org.springframework.security.core.userdetails.UserDetails) auth.getPrincipal()).getUsername();
                }
            }
            
            // Extract request information
            HttpServletRequest request = getCurrentRequest();
            String ipAddress = getClientIpAddress(request);
            String userAgent = request != null ? request.getHeader("User-Agent") : "Unknown";
            
            // Determine action and resource type
            String action = determineAction(methodName);
            String resourceType = determineResourceType(className);
            
            // Extract resource ID from method arguments if possible
            String resourceId = extractResourceId(joinPoint.getArgs());
            
            Map<String, Object> details = new HashMap<>();
            details.put("method", methodName);
            details.put("controller", className);
            details.put("success", true);
            
            String description = String.format("%s operation on %s", action, resourceType);
            
            auditLogService.logAudit(userId, username, action, resourceType, resourceId,
                    details, ipAddress, userAgent, description);
            
        } catch (Exception e) {
            log.error("Failed to log audit entry for data modification", e);
        }
    }

    @AfterThrowing(pointcut = "controllerMethods() && dataModifyingEndpoints()", throwing = "exception")
    public void logDataModificationError(JoinPoint joinPoint, Throwable exception) {
        try {
            String methodName = joinPoint.getSignature().getName();
            String className = joinPoint.getTarget().getClass().getSimpleName();
            
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Long userId = null;
            String username = "anonymous";
            
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
                username = auth.getName();
            }
            
            HttpServletRequest request = getCurrentRequest();
            String ipAddress = getClientIpAddress(request);
            String userAgent = request != null ? request.getHeader("User-Agent") : "Unknown";
            
            String action = determineAction(methodName);
            String resourceType = determineResourceType(className);
            String resourceId = extractResourceId(joinPoint.getArgs());
            
            Map<String, Object> details = new HashMap<>();
            details.put("method", methodName);
            details.put("controller", className);
            details.put("success", false);
            details.put("error", exception.getMessage());
            details.put("exceptionType", exception.getClass().getSimpleName());
            
            String description = String.format("Failed %s operation on %s: %s", action, resourceType, exception.getMessage());
            
            auditLogService.logSecurityAudit(userId, username, action, "DATA_CHANGE", "ERROR",
                    ipAddress, userAgent, description);
            
        } catch (Exception e) {
            log.error("Failed to log audit entry for data modification error", e);
        }
    }

    @AfterReturning(pointcut = "loginMethod()", returning = "result")
    public void logLoginAttempt(JoinPoint joinPoint, Object result) {
        try {
            Object[] args = joinPoint.getArgs();
            String username = args.length > 0 ? args[0].toString() : "unknown";
            
            HttpServletRequest request = getCurrentRequest();
            String ipAddress = getClientIpAddress(request);
            String userAgent = request != null ? request.getHeader("User-Agent") : "Unknown";
            
            boolean success = result != null;
            String details = success ? "Login successful" : "Login failed";
            
            auditLogService.logAuthenticationEvent(null, username, "LOGIN", success,
                    ipAddress, userAgent, details);
            
        } catch (Exception e) {
            log.error("Failed to log login attempt", e);
        }
    }

    @AfterReturning(pointcut = "registerMethod()", returning = "result")
    public void logRegistration(JoinPoint joinPoint, Object result) {
        try {
            Object[] args = joinPoint.getArgs();
            String username = "unknown";
            
            // Extract username from registration request
            if (args.length > 0 && args[0] != null) {
                // Assuming first argument is registration request with username field
                username = extractUsernameFromRegistrationRequest(args[0]);
            }
            
            HttpServletRequest request = getCurrentRequest();
            String ipAddress = getClientIpAddress(request);
            String userAgent = request != null ? request.getHeader("User-Agent") : "Unknown";
            
            boolean success = result != null;
            String details = success ? "Registration successful" : "Registration failed";
            
            auditLogService.logAuthenticationEvent(null, username, "REGISTER", success,
                    ipAddress, userAgent, details);
            
        } catch (Exception e) {
            log.error("Failed to log registration attempt", e);
        }
    }

    @AfterReturning(pointcut = "passwordResetMethods()")
    public void logPasswordResetAction(JoinPoint joinPoint) {
        try {
            String methodName = joinPoint.getSignature().getName();
            
            HttpServletRequest request = getCurrentRequest();
            String ipAddress = getClientIpAddress(request);
            String userAgent = request != null ? request.getHeader("User-Agent") : "Unknown";
            
            String action = "PASSWORD_RESET_" + methodName.toUpperCase();
            String description = String.format("Password reset action: %s", methodName);
            
            auditLogService.logSecurityAudit(null, "system", action, "SECURITY", "INFO",
                    ipAddress, userAgent, description);
            
        } catch (Exception e) {
            log.error("Failed to log password reset action", e);
        }
    }

    @AfterReturning(pointcut = "emailVerificationMethods()")
    public void logEmailVerificationAction(JoinPoint joinPoint) {
        try {
            String methodName = joinPoint.getSignature().getName();
            
            HttpServletRequest request = getCurrentRequest();
            String ipAddress = getClientIpAddress(request);
            String userAgent = request != null ? request.getHeader("User-Agent") : "Unknown";
            
            String action = "EMAIL_VERIFICATION_" + methodName.toUpperCase();
            String description = String.format("Email verification action: %s", methodName);
            
            auditLogService.logSecurityAudit(null, "system", action, "SECURITY", "INFO",
                    ipAddress, userAgent, description);
            
        } catch (Exception e) {
            log.error("Failed to log email verification action", e);
        }
    }

    @AfterReturning(pointcut = "securityMethods()")
    public void logSecurityAction(JoinPoint joinPoint) {
        try {
            String methodName = joinPoint.getSignature().getName();
            
            HttpServletRequest request = getCurrentRequest();
            String ipAddress = getClientIpAddress(request);
            String userAgent = request != null ? request.getHeader("User-Agent") : "Unknown";
            
            String action = "SECURITY_" + methodName.toUpperCase();
            String description = String.format("Security action: %s", methodName);
            
            auditLogService.logSecurityAudit(null, "system", action, "SECURITY", "INFO",
                    ipAddress, userAgent, description);
            
        } catch (Exception e) {
            log.error("Failed to log security action", e);
        }
    }

    private HttpServletRequest getCurrentRequest() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            return attributes.getRequest();
        } catch (Exception e) {
            return null;
        }
    }

    private String getClientIpAddress(HttpServletRequest request) {
        if (request == null) {
            return "unknown";
        }
        
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }

    private String determineAction(String methodName) {
        if (methodName.toLowerCase().contains("create") || methodName.toLowerCase().contains("add")) {
            return "CREATE";
        } else if (methodName.toLowerCase().contains("update") || methodName.toLowerCase().contains("edit")) {
            return "UPDATE";
        } else if (methodName.toLowerCase().contains("delete") || methodName.toLowerCase().contains("remove")) {
            return "DELETE";
        } else {
            return "MODIFY";
        }
    }

    private String determineResourceType(String className) {
        if (className.toLowerCase().contains("user")) {
            return "USER";
        } else if (className.toLowerCase().contains("hotel")) {
            return "HOTEL";
        } else if (className.toLowerCase().contains("tourism")) {
            return "TOURISM";
        } else if (className.toLowerCase().contains("booking")) {
            return "BOOKING";
        } else if (className.toLowerCase().contains("guider")) {
            return "GUIDER";
        } else if (className.toLowerCase().contains("map")) {
            return "MAP_POINT";
        } else {
            return "UNKNOWN";
        }
    }

    private String extractResourceId(Object[] args) {
        for (Object arg : args) {
            if (arg instanceof Long) {
                return arg.toString();
            } else if (arg instanceof String && arg.toString().matches("\\d+")) {
                return arg.toString();
            }
        }
        return null;
    }

    private String extractUsernameFromRegistrationRequest(Object registrationRequest) {
        try {
            // Use reflection to get username field
            java.lang.reflect.Field usernameField = registrationRequest.getClass().getDeclaredField("username");
            usernameField.setAccessible(true);
            Object username = usernameField.get(registrationRequest);
            return username != null ? username.toString() : "unknown";
        } catch (Exception e) {
            return "unknown";
        }
    }
}