/**
 * Servlet that handles data persistence and synchronization between in-memory state and JSON file storage.
 * Provides REST-like API endpoints for reading and writing recruitment system data.
 * 
 * <p>Supported HTTP methods:
 * <ul>
 *   <li>GET - Retrieves the entire storage JSON content</li>
 *   <li>POST - Writes JSON data to storage file</li>
 *   <li>OPTIONS - Handles CORS preflight requests</li>
 * </ul>
 * 
 * <p>Data storage location: {@code WEB-INF/data/storage.json} (or fallback to system temp directory)
 * 
 * @author G83
 * @version 4.0.4
 * @see <a href="/ta/admin_dashboard.html">Admin Dashboard</a>
 * @see <a href="/ta/personal_center.html">Personal Center</a>
 */
package com.ta.recruitment.servlet;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Servlet mapped to {@code /api/storage} that provides JSON file-based storage operations.
 * Handles reading from and writing to the recruitment system's data file with thread-safe operations.
 */
@WebServlet(name = "StorageSyncServlet", urlPatterns = "/api/storage")
public class StorageSyncServlet extends HttpServlet {
    
    /** Default JSON content when storage file doesn't exist or is corrupted */
    private static final String DEFAULT_JSON_OBJECT = "{}";
    
    /** Path to the JSON storage file */
    private transient Path dataFilePath;

    /**
     * Initializes the servlet by setting up the data storage directory and file.
     * Creates the storage directory and initializes an empty JSON object file if it doesn't exist.
     * 
     * <p>Storage path priority:
     * <ol>
     *   <li>First attempts to use {@code WEB-INF/data/storage.json} relative to webapp root</li>
     *   <li>Falls back to {@code java.io.tmpdir/ta-recruitment-data/storage.json} if webapp path is unavailable</li>
     * </ol>
     * 
     * @throws ServletException if directory creation or file initialization fails
     */
    @Override
    public void init() throws ServletException {
        super.init();
        String basePath = getServletContext().getRealPath("/WEB-INF/data");
        if (basePath == null || basePath.trim().isEmpty()) {
            basePath = System.getProperty("java.io.tmpdir") + "/ta-recruitment-data";
        }
        Path dir = Paths.get(basePath);
        try {
            Files.createDirectories(dir);
            dataFilePath = dir.resolve("storage.json");
            if (Files.notExists(dataFilePath)) {
                Files.write(dataFilePath, DEFAULT_JSON_OBJECT.getBytes(StandardCharsets.UTF_8));
            }
        } catch (IOException ex) {
            throw new ServletException("Failed to initialize JSON storage file.", ex);
        }
    }

    /**
     * Handles GET requests to retrieve the entire storage JSON content.
     * 
     * <p>Request parameters: None
     * 
     * <p>Response:
     * <ul>
     *   <li>Content-Type: application/json; charset=UTF-8</li>
     *   <li>Body: JSON string containing all recruitment system data</li>
     *   <li>Status: 200 OK</li>
     * </ul>
     * 
     * @param req  the HTTP request (no parameters required)
     * @param resp the HTTP response containing JSON data
     * @throws IOException if reading the storage file or writing the response fails
     */
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        setCorsHeaders(resp);
        resp.setCharacterEncoding(StandardCharsets.UTF_8.name());
        resp.setContentType("application/json; charset=UTF-8");

        String content = readStorageText();
        try (PrintWriter writer = resp.getWriter()) {
            writer.write(content);
        }
    }

    /**
     * Handles POST requests to write JSON data to the storage file.
     * 
     * <p>Request requirements:
     * <ul>
     *   <li>Content-Type: application/json</li>
     *   <li>Body: Valid JSON object string (must start with '{' and end with '}')</li>
     * </ul>
     * 
     * <p>Response:
     * <ul>
     *   <li>Success (200 OK): {@code {"ok":true}}</li>
     *   <li>Failure (400 Bad Request): {@code {"ok":false,"message":"Request body must be a JSON object string."}}</li>
     * </ul>
     * 
     * <p>Concurrency: This method is synchronized to ensure thread-safe write operations.
     * 
     * @param req  the HTTP request containing JSON data in the body
     * @param resp the HTTP response indicating success or failure
     * @throws IOException if reading the request body or writing the response fails
     */
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        setCorsHeaders(resp);
        req.setCharacterEncoding(StandardCharsets.UTF_8.name());
        resp.setCharacterEncoding(StandardCharsets.UTF_8.name());
        resp.setContentType("application/json; charset=UTF-8");

        String body = readBody(req);
        if (!looksLikeJsonObject(body)) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"ok\":false,\"message\":\"Request body must be a JSON object string.\"}");
            return;
        }

        synchronized (this) {
            Files.write(dataFilePath, body.getBytes(StandardCharsets.UTF_8));
        }

        resp.getWriter().write("{\"ok\":true}");
    }

    /**
     * Handles OPTIONS requests for CORS preflight support.
     * Sets appropriate CORS headers to allow cross-origin requests from any domain.
     * 
     * @param req  the HTTP OPTIONS request
     * @param resp the HTTP response with CORS headers set
     */
    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) {
        setCorsHeaders(resp);
        resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    /**
     * Reads the entire content of the storage file.
     * Creates a default empty JSON object if the file doesn't exist or contains invalid content.
     * 
     * <p>This method is synchronized to ensure thread-safe read operations.
     * 
     * @return the JSON string content of the storage file, or {@code "{}"} if an error occurs
     */
    private String readStorageText() {
        try {
            synchronized (this) {
                if (Files.notExists(dataFilePath)) {
                    Files.write(dataFilePath, DEFAULT_JSON_OBJECT.getBytes(StandardCharsets.UTF_8));
                }
                String text = Files.readString(dataFilePath, StandardCharsets.UTF_8).trim();
                if (!looksLikeJsonObject(text)) {
                    return DEFAULT_JSON_OBJECT;
                }
                return text;
            }
        } catch (IOException ex) {
            return DEFAULT_JSON_OBJECT;
        }
    }

    /**
     * Reads the entire request body as a string.
     * 
     * @param req the HTTP request to read from
     * @return the trimmed request body string
     * @throws IOException if reading the request body fails
     */
    private String readBody(HttpServletRequest req) throws IOException {
        StringBuilder body = new StringBuilder();
        try (BufferedReader reader = req.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                body.append(line);
            }
        }
        return body.toString().trim();
    }

    /**
     * Validates if a string looks like a valid JSON object.
     * Simple validation that checks if the string starts with '{' and ends with '}'.
     * 
     * @param text the string to validate
     * @return true if the string appears to be a JSON object, false otherwise
     */
    private boolean looksLikeJsonObject(String text) {
        if (text == null) return false;
        String trimmed = text.trim();
        return trimmed.startsWith("{") && trimmed.endsWith("}");
    }

    /**
     * Sets CORS (Cross-Origin Resource Sharing) headers on the response.
     * Allows cross-origin requests from any domain with GET, POST, and OPTIONS methods.
     * 
     * @param resp the HTTP response to set headers on
     */
    private void setCorsHeaders(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }
}
