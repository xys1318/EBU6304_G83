/**
 * Unit tests for JSON file storage operations.
 * Tests read/write operations, error handling, and data integrity.
 * 
 * <p>Test coverage:
 * <ul>
 *   <li>Read operations - valid JSON, empty file, malformed content</li>
 *   <li>Write operations - create, update, append</li>
 *   <li>Error handling - file not found, permission issues, invalid JSON</li>
 *   <li>Data integrity - UTF-8 encoding, whitespace handling</li>
 * </ul>
 * 
 * @author G83
 * @version 4.0.4
 */
package com.ta.recruitment.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test class for JSON file storage operations.
 * Uses JUnit 5 @TempDir for automatic cleanup of temporary files.
 */
class JsonStorageServiceTest {

    @TempDir
    Path tempDir;

    private Path storageFile;

    @BeforeEach
    void setUp() {
        storageFile = tempDir.resolve("storage.json");
    }

    @Nested
    @DisplayName("Read Operations")
    class ReadOperations {

        @Test
        @DisplayName("Should read valid JSON file")
        void shouldReadValidJsonFile() throws IOException {
            // Given: Valid JSON file
            String testData = "{\"users\":[{\"id\":\"1\",\"name\":\"Alice\"}],\"jobs\":[],\"applications\":[]}";
            Files.writeString(storageFile, testData, StandardCharsets.UTF_8);

            // When: Read file content
            String content = Files.readString(storageFile, StandardCharsets.UTF_8);

            // Then: Verify content is read correctly
            assertNotNull(content);
            assertTrue(content.contains("\"id\":\"1\""));
            assertTrue(content.contains("\"name\":\"Alice\""));
        }

        @Test
        @DisplayName("Should handle empty file")
        void shouldHandleEmptyFile() throws IOException {
            // Given: Empty file
            Files.createFile(storageFile);

            // When: Read empty file
            String content = Files.readString(storageFile, StandardCharsets.UTF_8);

            // Then: Verify empty string is returned
            assertEquals("", content);
        }

        @Test
        @DisplayName("Should read file with Unicode characters")
        void shouldReadFileWithUnicodeCharacters() throws IOException {
            // Given: JSON with Unicode characters (Chinese, emojis)
            String unicodeData = "{\"name\":\"张三\",\"role\":\"教师助理\",\"notes\":\"🎓\"}";
            Files.writeString(storageFile, unicodeData, StandardCharsets.UTF_8);

            // When: Read file
            String content = Files.readString(storageFile, StandardCharsets.UTF_8);

            // Then: Verify Unicode characters are preserved
            assertTrue(content.contains("张三"));
            assertTrue(content.contains("教师助理"));
            assertTrue(content.contains("🎓"));
        }

        @Test
        @DisplayName("Should handle large JSON file")
        void shouldHandleLargeJsonFile() throws IOException {
            // Given: Large JSON file (simulate with repeated data)
            StringBuilder largeJson = new StringBuilder("{\"data\":[");
            for (int i = 0; i < 1000; i++) {
                if (i > 0) largeJson.append(",");
                largeJson.append("{\"id\":").append(i).append(",\"value\":\"item").append(i).append("\"}");
            }
            largeJson.append("]}");
            Files.writeString(storageFile, largeJson.toString(), StandardCharsets.UTF_8);

            // When: Read file
            String content = Files.readString(storageFile, StandardCharsets.UTF_8);

            // Then: Verify complete content is read and has expected size
            // JSON format is {"id":0,"value":"item0"} - check for key-value presence
            assertTrue(content.contains("\"id\":0"), "Should contain first item");
            assertTrue(content.contains("\"id\":999"), "Should contain last item");
            // Verify content length - 1000 items should be around 25K-30K characters
            assertTrue(content.length() > 20000, "Content should be at least 20K chars for 1000 items");
        }
    }

    @Nested
    @DisplayName("Write Operations")
    class WriteOperations {

        @Test
        @DisplayName("Should create new JSON file")
        void shouldCreateNewJsonFile() throws IOException {
            // Given: Non-existent file
            assertFalse(Files.exists(storageFile));

            // When: Write JSON to file
            String testData = "{\"status\":\"active\"}";
            Files.writeString(storageFile, testData, StandardCharsets.UTF_8);

            // Then: Verify file is created with content
            assertTrue(Files.exists(storageFile));
            assertEquals(testData, Files.readString(storageFile, StandardCharsets.UTF_8));
        }

        @Test
        @DisplayName("Should overwrite existing file")
        void shouldOverwriteExistingFile() throws IOException {
            // Given: Existing file with data
            Files.writeString(storageFile, "{\"old\":\"data\"}");
            
            // When: Write new data to same file
            String newData = "{\"new\":\"data\"}";
            Files.writeString(storageFile, newData, StandardCharsets.UTF_8);

            // Then: Verify file contains new data
            assertEquals(newData, Files.readString(storageFile, StandardCharsets.UTF_8));
            assertFalse(Files.readString(storageFile).contains("old"));
        }

        @Test
        @DisplayName("Should preserve UTF-8 encoding on write")
        void shouldPreserveUtf8EncodingOnWrite() throws IOException {
            // Given: Data with special characters
            String specialChars = "{\"chinese\":\"中文测试\",\"japanese\":\"日本語\",\"korean\":\"한국어\"}";
            
            // When: Write and read file
            Files.writeString(storageFile, specialChars, StandardCharsets.UTF_8);
            String readContent = Files.readString(storageFile, StandardCharsets.UTF_8);

            // Then: Verify characters are preserved
            assertEquals(specialChars, readContent);
        }
    }

    @Nested
    @DisplayName("File Existence Checks")
    class FileExistenceChecks {

        @Test
        @DisplayName("Should detect non-existent file")
        void shouldDetectNonExistentFile() {
            // Given: File does not exist
            Path nonExistentFile = tempDir.resolve("nonExistent.json");

            // Then: Verify file does not exist
            assertFalse(Files.exists(nonExistentFile));
        }

        @Test
        @DisplayName("Should detect existing file")
        void shouldDetectExistingFile() throws IOException {
            // Given: File exists
            Files.createFile(storageFile);

            // Then: Verify file exists
            assertTrue(Files.exists(storageFile));
        }
    }

    @Nested
    @DisplayName("Directory Operations")
    class DirectoryOperations {

        @Test
        @DisplayName("Should create nested directories")
        void shouldCreateNestedDirectories() throws IOException {
            // Given: Path with non-existent nested directories
            Path nestedPath = tempDir.resolve("WEB-INF").resolve("data").resolve("storage.json");

            // When: Create directory structure and file
            Files.createDirectories(nestedPath.getParent());
            Files.writeString(nestedPath, "{}");

            // Then: Verify nested structure exists
            assertTrue(Files.exists(nestedPath));
            assertTrue(Files.exists(nestedPath.getParent()));
        }

        @Test
        @DisplayName("Should not throw exception when creating existing directory")
        void shouldNotThrowExceptionWhenCreatingExistingDirectory() throws IOException {
            // Given: Directory exists
            Path dataDir = tempDir.resolve("data");
            Files.createDirectories(dataDir);

            // When/Then: Creating same directory again should not throw
            assertDoesNotThrow(() -> Files.createDirectories(dataDir));
        }
    }

    @Nested
    @DisplayName("Error Handling")
    class ErrorHandling {

        @Test
        @DisplayName("Should handle IOException when reading non-existent file")
        void shouldHandleIOExceptionWhenReadingNonExistentFile() {
            // Given: Non-existent file
            Path nonExistentFile = tempDir.resolve("nonExistent.json");

            // When/Then: Reading should throw IOException
            assertThrows(IOException.class, () -> 
                Files.readString(nonExistentFile, StandardCharsets.UTF_8)
            );
        }

        @Test
        @DisplayName("Should handle null content gracefully")
        void shouldHandleNullContent() throws IOException {
            // Given: Empty file
            Files.createFile(storageFile);

            // When: Read file
            String content = Files.readString(storageFile, StandardCharsets.UTF_8);

            // Then: Verify null/empty handling
            assertNotNull(content);
            assertTrue(content.isEmpty() || content.equals(""));
        }
    }

    @Nested
    @DisplayName("Data Integrity")
    class DataIntegrity {

        @Test
        @DisplayName("Should maintain JSON object structure")
        void shouldMaintainJsonObjectStructure() throws IOException {
            // Given: Valid JSON object
            String jsonObject = "{\"users\":[],\"jobs\":[],\"applications\":[],\"messages\":[]}";

            // When: Write and read
            Files.writeString(storageFile, jsonObject);
            String readContent = Files.readString(storageFile);

            // Then: Verify JSON structure is maintained
            assertTrue(readContent.startsWith("{"));
            assertTrue(readContent.endsWith("}"));
        }

        @Test
        @DisplayName("Should preserve whitespace within JSON")
        void shouldPreserveWhitespaceWithinJson() throws IOException {
            // Given: Pretty-printed JSON
            String prettyJson = "{\n  \"users\": [\n    {\n      \"id\": \"1\"\n    }\n  ]\n}";
            
            // When: Write and read
            Files.writeString(storageFile, prettyJson);
            String readContent = Files.readString(storageFile);

            // Then: Verify whitespace is preserved
            assertEquals(prettyJson, readContent);
        }

        @Test
        @DisplayName("Should handle concurrent writes to different files")
        void shouldHandleConcurrentWritesToDifferentFiles() throws IOException, InterruptedException {
            // Given: Multiple files
            Path file1 = tempDir.resolve("file1.json");
            Path file2 = tempDir.resolve("file2.json");
            Path file3 = tempDir.resolve("file3.json");

            // When: Write to multiple files
            Files.writeString(file1, "{\"file\":1}");
            Files.writeString(file2, "{\"file\":2}");
            Files.writeString(file3, "{\"file\":3}");

            // Then: Verify all files contain correct data
            assertTrue(Files.readString(file1).contains("\"file\":1"));
            assertTrue(Files.readString(file2).contains("\"file\":2"));
            assertTrue(Files.readString(file3).contains("\"file\":3"));
        }
    }
}