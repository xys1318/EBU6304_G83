/**
 * Comprehensive test suite for StorageSyncServlet.
 * Tests HTTP request/response handling, JSON storage operations, and CORS support.
 * 
 * <p>Test coverage:
 * <ul>
 *   <li>GET requests - retrieve storage data</li>
 *   <li>POST requests - write valid and invalid JSON</li>
 *   <li>OPTIONS requests - CORS preflight handling</li>
 *   <li>Error scenarios - malformed JSON, file access issues</li>
 * </ul>
 * 
 * @author G83
 * @version 4.0.4
 */
package com.ta.recruitment.servlet;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringReader;
import java.io.StringWriter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for StorageSyncServlet.
 * Uses Mockito to mock HttpServletRequest and HttpServletResponse.
 */
class StorageSyncServletTest {

    private StorageSyncServlet servlet;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private ServletContext servletContext;

    @Mock
    private ServletConfig servletConfig;

    @TempDir
    Path tempDir;

    private Path testStorageFile;

    @BeforeEach
    void setUp() throws ServletException, IOException {
        MockitoAnnotations.openMocks(this);

        // Create test storage directory and file
        Path testDataDir = tempDir.resolve("WEB-INF").resolve("data");
        Files.createDirectories(testDataDir);
        testStorageFile = testDataDir.resolve("storage.json");
        
        // Use lenient stubbing for methods that may be called multiple times
        lenient().when(response.getWriter()).thenReturn(new PrintWriter(new StringWriter()));
        lenient().doNothing().when(response).setHeader(anyString(), anyString());
        lenient().doNothing().when(response).setCharacterEncoding(anyString());
        lenient().doNothing().when(response).setContentType(anyString());

        // Initialize servlet with test configuration
        servlet = new StorageSyncServlet();

        // Mock ServletConfig
        when(servletConfig.getServletContext()).thenReturn(servletContext);
        when(servletContext.getRealPath("/WEB-INF/data")).thenReturn(testDataDir.toString());

        // Initialize servlet
        servlet.init(servletConfig);
    }

    @Nested
    @DisplayName("doGet - Retrieve Storage Data")
    class DoGetTests {

        @Test
        @DisplayName("Should return empty JSON object when storage file is empty")
        void shouldReturnEmptyJsonWhenStorageFileIsEmpty() throws IOException {
            // Given: Empty storage file
            Files.writeString(testStorageFile, "{}");

            StringWriter stringWriter = new StringWriter();
            PrintWriter printWriter = new PrintWriter(stringWriter);

            when(response.getWriter()).thenReturn(printWriter);

            // When: Call doGet
            servlet.doGet(request, response);

            // Then: Verify empty JSON is returned
            String result = stringWriter.toString();
            assertEquals("{}", result);
            verify(response).setContentType("application/json; charset=UTF-8");
        }

        @Test
        @DisplayName("Should return stored JSON data")
        void shouldReturnStoredJsonData() throws IOException {
            // Given: Storage file with data
            String testData = "{\"users\":[],\"jobs\":[],\"applications\":[]}";
            Files.writeString(testStorageFile, testData);

            StringWriter stringWriter = new StringWriter();
            PrintWriter printWriter = new PrintWriter(stringWriter);

            when(response.getWriter()).thenReturn(printWriter);

            // When: Call doGet
            servlet.doGet(request, response);

            // Then: Verify stored data is returned
            String result = stringWriter.toString();
            assertTrue(result.contains("\"users\":[]"));
            assertTrue(result.contains("\"jobs\":[]"));
        }

        @Test
        @DisplayName("Should return default JSON for malformed storage content")
        void shouldReturnDefaultJsonForMalformedContent() throws IOException {
            // Given: Malformed storage file (not a valid JSON object)
            Files.writeString(testStorageFile, "This is not JSON");

            StringWriter stringWriter = new StringWriter();
            PrintWriter printWriter = new PrintWriter(stringWriter);

            when(response.getWriter()).thenReturn(printWriter);

            // When: Call doGet
            servlet.doGet(request, response);

            // Then: Verify default empty JSON is returned
            String result = stringWriter.toString();
            assertEquals("{}", result);
        }

        @Test
        @DisplayName("Should set CORS headers on GET request")
        void shouldSetCorsHeadersOnGet() throws IOException {
            // Given: Valid storage file
            Files.writeString(testStorageFile, "{}");

            StringWriter stringWriter = new StringWriter();
            PrintWriter printWriter = new PrintWriter(stringWriter);

            when(response.getWriter()).thenReturn(printWriter);

            // When: Call doGet
            servlet.doGet(request, response);

            // Then: Verify CORS headers are set
            verify(response).setHeader("Access-Control-Allow-Origin", "*");
            verify(response).setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        }
    }

    @Nested
    @DisplayName("doPost - Write Storage Data")
    class DoPostTests {

        @Test
        @DisplayName("Should successfully write valid JSON to storage file")
        void shouldWriteValidJsonToStorage() throws IOException {
            // Given: Valid JSON object in request body
            String validJson = "{\"users\":[{\"id\":\"1\",\"name\":\"Test User\"}]}";
            when(request.getReader()).thenReturn(new BufferedReader(new StringReader(validJson)));

            StringWriter stringWriter = new StringWriter();
            PrintWriter printWriter = new PrintWriter(stringWriter);
            when(response.getWriter()).thenReturn(printWriter);

            // When: Call doPost
            servlet.doPost(request, response);

            // Then: Verify data is written and success response
            String fileContent = Files.readString(testStorageFile);
            assertTrue(fileContent.contains("\"id\":\"1\""));
            assertTrue(fileContent.contains("\"name\":\"Test User\""));

            String responseContent = stringWriter.toString();
            assertTrue(responseContent.contains("\"ok\":true"));
        }

        @Test
        @DisplayName("Should return 400 for malformed JSON body")
        void shouldReturn400ForMalformedJson() throws IOException {
            // Given: Invalid JSON (not starting with { or ending with })
            String invalidJson = "This is not a JSON object";
            when(request.getReader()).thenReturn(new BufferedReader(new StringReader(invalidJson)));

            StringWriter stringWriter = new StringWriter();
            PrintWriter printWriter = new PrintWriter(stringWriter);
            when(response.getWriter()).thenReturn(printWriter);

            // When: Call doPost
            servlet.doPost(request, response);

            // Then: Verify 400 status and error message
            verify(response).setStatus(HttpServletResponse.SC_BAD_REQUEST);
            String responseContent = stringWriter.toString();
            assertTrue(responseContent.contains("\"ok\":false"));
            assertTrue(responseContent.contains("must be a JSON object string"));
        }

        @Test
        @DisplayName("Should reject JSON array instead of object")
        void shouldRejectJsonArray() throws IOException {
            // Given: JSON array instead of object
            String jsonArray = "[{\"id\":\"1\"},{\"id\":\"2\"}]";
            when(request.getReader()).thenReturn(new BufferedReader(new StringReader(jsonArray)));

            StringWriter stringWriter = new StringWriter();
            PrintWriter printWriter = new PrintWriter(stringWriter);
            when(response.getWriter()).thenReturn(printWriter);

            // When: Call doPost
            servlet.doPost(request, response);

            // Then: Verify 400 status (JSON arrays are not valid JSON objects)
            verify(response).setStatus(HttpServletResponse.SC_BAD_REQUEST);
        }

        @Test
        @DisplayName("Should handle empty request body")
        void shouldHandleEmptyRequestBody() throws IOException {
            // Given: Empty request body
            when(request.getReader()).thenReturn(new BufferedReader(new StringReader("")));

            StringWriter stringWriter = new StringWriter();
            PrintWriter printWriter = new PrintWriter(stringWriter);
            when(response.getWriter()).thenReturn(printWriter);

            // When: Call doPost
            servlet.doPost(request, response);

            // Then: Verify 400 status
            verify(response).setStatus(HttpServletResponse.SC_BAD_REQUEST);
        }

        @Test
        @DisplayName("Should trim whitespace from request body")
        void shouldTrimWhitespaceFromRequestBody() throws IOException {
            // Given: JSON with surrounding whitespace
            String jsonWithWhitespace = "   {\"users\":[]}   ";
            when(request.getReader()).thenReturn(new BufferedReader(new StringReader(jsonWithWhitespace)));

            StringWriter stringWriter = new StringWriter();
            PrintWriter printWriter = new PrintWriter(stringWriter);
            when(response.getWriter()).thenReturn(printWriter);

            // When: Call doPost
            servlet.doPost(request, response);

            // Then: Verify data is written (whitespace trimmed)
            String fileContent = Files.readString(testStorageFile);
            assertFalse(fileContent.contains("   "));
        }
    }

    @Nested
    @DisplayName("doOptions - CORS Preflight")
    class DoOptionsTests {

        @Test
        @DisplayName("Should set CORS headers and return 204 for OPTIONS request")
        void shouldHandleCorsPreflightRequest() {
            // When: Call doOptions
            servlet.doOptions(request, response);

            // Then: Verify CORS headers and 204 status
            verify(response).setHeader("Access-Control-Allow-Origin", "*");
            verify(response).setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
            verify(response).setHeader("Access-Control-Allow-Headers", "Content-Type");
            verify(response).setStatus(HttpServletResponse.SC_NO_CONTENT);
        }
    }

    @Nested
    @DisplayName("Thread Safety")
    class ThreadSafetyTests {

        @Test
        @DisplayName("Should handle multiple sequential read operations safely")
        void shouldHandleMultipleSequentialReadOperations() throws IOException {
            // Given: Storage file with data
            String testData = "{\"test\":\"data\",\"count\":10}";
            Files.writeString(testStorageFile, testData);

            // When: Perform multiple sequential reads
            for (int i = 0; i < 10; i++) {
                StringWriter stringWriter = new StringWriter();
                PrintWriter printWriter = new PrintWriter(stringWriter);
                when(response.getWriter()).thenReturn(printWriter);

                servlet.doGet(request, response);

                // Then: Each read should succeed and return data
                String result = stringWriter.toString();
                assertNotNull(result);
                assertTrue(result.contains("\"test\":\"data\""));
            }
        }
    }

    @Nested
    @DisplayName("Edge Cases")
    class EdgeCaseTests {

        @Test
        @DisplayName("Should handle null ServletContext realPath")
        void shouldHandleNullRealPath() throws ServletException {
            // Given: Servlet with null realPath (uses temp directory fallback)
            StorageSyncServlet newServlet = new StorageSyncServlet();
            when(servletContext.getRealPath("/WEB-INF/data")).thenReturn(null);

            // This should not throw exception - falls back to temp directory
            assertDoesNotThrow(() -> newServlet.init(servletConfig));
        }

        @Test
        @DisplayName("Should create storage file if it does not exist")
        void shouldCreateStorageFileIfNotExists() throws ServletException, IOException {
            // Given: No storage file exists (file deleted after initialization)
            Files.deleteIfExists(testStorageFile);

            StringWriter stringWriter = new StringWriter();
            PrintWriter printWriter = new PrintWriter(stringWriter);
            when(response.getWriter()).thenReturn(printWriter);

            // When: Call doGet (should recreate file)
            servlet.doGet(request, response);

            // Then: File should be recreated with default content
            assertTrue(Files.exists(testStorageFile));
            assertEquals("{}", Files.readString(testStorageFile));
        }
    }
}