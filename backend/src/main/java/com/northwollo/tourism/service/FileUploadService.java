package com.northwollo.tourism.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileUploadService {
    /**
     * Upload a file and return the URL path to access it
     * @param file The file to upload
     * @param subDirectory Optional subdirectory (e.g., "receipts", "hotels")
     * @return The URL path to access the uploaded file
     */
    String uploadFile(MultipartFile file, String subDirectory);
    
    /**
     * Delete a file by its URL path
     * @param fileUrl The URL path of the file to delete
     * @return true if deleted successfully
     */
    boolean deleteFile(String fileUrl);
}
