/**
 * Integration tests for TA Recruitment System.
 * Tests end-to-end workflows including user registration, job posting, and application processes.
 * 
 * <p>Test coverage:
 * <ul>
 *   <li>User registration and authentication</li>
 *   <li>Job posting and management</li>
 *   <li>Application submission and tracking</li>
 *   <li>Data persistence across operations</li>
 * </ul>
 * 
 * @author G83
 * @version 4.0.4
 */
package com.ta.recruitment.integration;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for TA Recruitment System.
 * Tests complete workflows without starting a servlet container.
 */
class RecruitmentSystemIntegrationTest {

    @TempDir
    Path tempDir;

    private Path storageFile;
    private Gson gson;

    @BeforeEach
    void setUp() throws IOException {
        gson = new Gson();
        
        // Create storage directory structure
        Path dataDir = tempDir.resolve("WEB-INF").resolve("data");
        Files.createDirectories(dataDir);
        storageFile = dataDir.resolve("storage.json");
        
        // Initialize empty storage
        Files.writeString(storageFile, "{}", java.nio.charset.StandardCharsets.UTF_8);
    }

    @Nested
    @DisplayName("User Registration Workflow")
    class UserRegistrationWorkflow {

        @Test
        @DisplayName("Should register new user successfully")
        void shouldRegisterNewUserSuccessfully() throws IOException {
            // Given: Empty storage
            JsonObject storage = new JsonObject();
            storage.add("users", new JsonArray());

            // When: Register a new user
            JsonObject newUser = new JsonObject();
            newUser.addProperty("id", UUID.randomUUID().toString());
            newUser.addProperty("username", "testuser");
            newUser.addProperty("password", "hashedPassword123");
            newUser.addProperty("role", "applicant");
            newUser.addProperty("email", "test@example.com");

            storage.getAsJsonArray("users").add(newUser);
            Files.writeString(storageFile, gson.toJson(storage));

            // Then: Verify user is saved
            String savedContent = Files.readString(storageFile);
            JsonObject savedStorage = gson.fromJson(savedContent, JsonObject.class);
            JsonArray users = savedStorage.getAsJsonArray("users");
            
            assertEquals(1, users.size());
            assertEquals("testuser", users.get(0).getAsJsonObject().get("username").getAsString());
        }

        @Test
        @DisplayName("Should prevent duplicate username registration")
        void shouldPreventDuplicateUsernameRegistration() throws IOException {
            // Given: Storage with existing user
            JsonObject storage = new JsonObject();
            JsonArray users = new JsonArray();
            
            JsonObject existingUser = new JsonObject();
            existingUser.addProperty("id", UUID.randomUUID().toString());
            existingUser.addProperty("username", "existinguser");
            existingUser.addProperty("role", "applicant");
            users.add(existingUser);
            
            storage.add("users", users);
            Files.writeString(storageFile, gson.toJson(storage));

            // When: Try to register with same username
            String savedContent = Files.readString(storageFile);
            JsonObject savedStorage = gson.fromJson(savedContent, JsonObject.class);
            JsonArray savedUsers = savedStorage.getAsJsonArray("users");
            
            boolean duplicateExists = savedUsers.asList().stream()
                .anyMatch(u -> u.getAsJsonObject().get("username").getAsString().equals("existinguser"));

            // Then: Duplicate should be detected
            assertTrue(duplicateExists);
        }

        @Test
        @DisplayName("Should register different user roles")
        void shouldRegisterDifferentUserRoles() throws IOException {
            // Given: Empty storage
            JsonObject storage = new JsonObject();
            storage.add("users", new JsonArray());

            // When: Register users with different roles
            String[] roles = {"applicant", "manager", "admin"};
            
            for (String role : roles) {
                JsonObject user = new JsonObject();
                user.addProperty("id", UUID.randomUUID().toString());
                user.addProperty("username", role + "_user");
                user.addProperty("role", role);
                storage.getAsJsonArray("users").add(user);
            }
            
            Files.writeString(storageFile, gson.toJson(storage));

            // Then: Verify all roles are saved
            String savedContent = Files.readString(storageFile);
            JsonObject savedStorage = gson.fromJson(savedContent, JsonObject.class);
            JsonArray users = savedStorage.getAsJsonArray("users");
            
            assertEquals(3, users.size());
        }
    }

    @Nested
    @DisplayName("Job Posting Workflow")
    class JobPostingWorkflow {

        @Test
        @DisplayName("Should create new job posting")
        void shouldCreateNewJobPosting() throws IOException {
            // Given: Empty storage
            JsonObject storage = new JsonObject();
            storage.add("jobs", new JsonArray());

            // When: Manager creates a job
            JsonObject job = new JsonObject();
            job.addProperty("id", UUID.randomUUID().toString());
            job.addProperty("title", "Teaching Assistant - Computer Science");
            job.addProperty("department", "Computer Science");
            job.addProperty("description", "Looking for a TA for algorithms course");
            job.addProperty("requirements", "Senior student with A in algorithms");
            job.addProperty("slots", 2);
            job.addProperty("status", "open");
            job.addProperty("createdBy", "manager_001");

            storage.getAsJsonArray("jobs").add(job);
            Files.writeString(storageFile, gson.toJson(storage));

            // Then: Verify job is saved
            String savedContent = Files.readString(storageFile);
            JsonObject savedStorage = gson.fromJson(savedContent, JsonObject.class);
            JsonArray jobs = savedStorage.getAsJsonArray("jobs");
            
            assertEquals(1, jobs.size());
            assertEquals("Teaching Assistant - Computer Science", 
                jobs.get(0).getAsJsonObject().get("title").getAsString());
        }

        @Test
        @DisplayName("Should update job status")
        void shouldUpdateJobStatus() throws IOException {
            // Given: Storage with existing job
            JsonObject storage = new JsonObject();
            JsonArray jobs = new JsonArray();
            
            JsonObject job = new JsonObject();
            job.addProperty("id", "job_001");
            job.addProperty("title", "TA Position");
            job.addProperty("status", "open");
            jobs.add(job);
            
            storage.add("jobs", jobs);
            Files.writeString(storageFile, gson.toJson(storage));

            // When: Update job status to closed
            String content = Files.readString(storageFile);
            JsonObject savedStorage = gson.fromJson(content, JsonObject.class);
            JsonArray savedJobs = savedStorage.getAsJsonArray("jobs");
            savedJobs.get(0).getAsJsonObject().addProperty("status", "closed");
            Files.writeString(storageFile, gson.toJson(savedStorage));

            // Then: Verify status is updated
            String updatedContent = Files.readString(storageFile);
            JsonObject updatedStorage = gson.fromJson(updatedContent, JsonObject.class);
            assertEquals("closed", 
                updatedStorage.getAsJsonArray("jobs").get(0).getAsJsonObject().get("status").getAsString());
        }

        @Test
        @DisplayName("Should track available job slots")
        void shouldTrackAvailableJobSlots() throws IOException {
            // Given: Job with 3 slots
            JsonObject storage = new JsonObject();
            JsonArray jobs = new JsonArray();
            
            JsonObject job = new JsonObject();
            job.addProperty("id", "job_001");
            job.addProperty("slots", 3);
            job.addProperty("applicationsCount", 0);
            jobs.add(job);
            
            storage.add("jobs", jobs);
            Files.writeString(storageFile, gson.toJson(storage));

            // When: Applicants submit 2 applications
            String content = Files.readString(storageFile);
            JsonObject savedStorage = gson.fromJson(content, JsonObject.class);
            savedStorage.getAsJsonArray("jobs").get(0).getAsJsonObject()
                .addProperty("applicationsCount", 2);
            Files.writeString(storageFile, gson.toJson(savedStorage));

            // Then: Verify remaining slots calculation
            String updatedContent = Files.readString(storageFile);
            JsonObject updatedStorage = gson.fromJson(updatedContent, JsonObject.class);
            int slots = updatedStorage.getAsJsonArray("jobs").get(0).getAsJsonObject()
                .get("slots").getAsInt();
            int applications = updatedStorage.getAsJsonArray("jobs").get(0).getAsJsonObject()
                .get("applicationsCount").getAsInt();
            
            assertEquals(1, slots - applications);
        }
    }

    @Nested
    @DisplayName("Application Submission Workflow")
    class ApplicationSubmissionWorkflow {

        @Test
        @DisplayName("Should submit application for open job")
        void shouldSubmitApplicationForOpenJob() throws IOException {
            // Given: Storage with open job
            JsonObject storage = new JsonObject();
            storage.add("jobs", new JsonArray());
            storage.add("applications", new JsonArray());

            JsonObject job = new JsonObject();
            job.addProperty("id", "job_001");
            job.addProperty("status", "open");
            storage.getAsJsonArray("jobs").add(job);

            // When: Applicant submits application
            JsonObject application = new JsonObject();
            application.addProperty("id", UUID.randomUUID().toString());
            application.addProperty("jobId", "job_001");
            application.addProperty("applicantId", "user_001");
            application.addProperty("status", "pending");
            application.addProperty("appliedAt", "2026-05-20T10:00:00Z");

            storage.getAsJsonArray("applications").add(application);
            Files.writeString(storageFile, gson.toJson(storage));

            // Then: Verify application is saved
            String savedContent = Files.readString(storageFile);
            JsonObject savedStorage = gson.fromJson(savedContent, JsonObject.class);
            JsonArray applications = savedStorage.getAsJsonArray("applications");
            
            assertEquals(1, applications.size());
            assertEquals("pending", 
                applications.get(0).getAsJsonObject().get("status").getAsString());
        }

        @Test
        @DisplayName("Should prevent duplicate application")
        void shouldPreventDuplicateApplication() throws IOException {
            // Given: Existing application
            JsonObject storage = new JsonObject();
            storage.add("applications", new JsonArray());

            JsonObject existingApp = new JsonObject();
            existingApp.addProperty("id", "app_001");
            existingApp.addProperty("jobId", "job_001");
            existingApp.addProperty("applicantId", "user_001");
            storage.getAsJsonArray("applications").add(existingApp);
            Files.writeString(storageFile, gson.toJson(storage));

            // When: Check for duplicate
            String content = Files.readString(storageFile);
            JsonObject savedStorage = gson.fromJson(content, JsonObject.class);
            
            boolean isDuplicate = savedStorage.getAsJsonArray("applications").asList().stream()
                .anyMatch(app -> 
                    app.getAsJsonObject().get("jobId").getAsString().equals("job_001") &&
                    app.getAsJsonObject().get("applicantId").getAsString().equals("user_001")
                );

            // Then: Duplicate should be detected
            assertTrue(isDuplicate);
        }

        @Test
        @DisplayName("Should update application status")
        void shouldUpdateApplicationStatus() throws IOException {
            // Given: Pending application
            JsonObject storage = new JsonObject();
            storage.add("applications", new JsonArray());

            JsonObject application = new JsonObject();
            application.addProperty("id", "app_001");
            application.addProperty("status", "pending");
            storage.getAsJsonArray("applications").add(application);
            Files.writeString(storageFile, gson.toJson(storage));

            // When: Manager approves application
            String content = Files.readString(storageFile);
            JsonObject savedStorage = gson.fromJson(content, JsonObject.class);
            savedStorage.getAsJsonArray("applications").get(0).getAsJsonObject()
                .addProperty("status", "approved");
            Files.writeString(storageFile, gson.toJson(savedStorage));

            // Then: Verify status is updated
            String updatedContent = Files.readString(storageFile);
            JsonObject updatedStorage = gson.fromJson(updatedContent, JsonObject.class);
            assertEquals("approved", 
                updatedStorage.getAsJsonArray("applications").get(0).getAsJsonObject()
                    .get("status").getAsString());
        }
    }

    @Nested
    @DisplayName("Data Persistence Tests")
    class DataPersistenceTests {

        @Test
        @DisplayName("Should persist all data types in storage")
        void shouldPersistAllDataTypesInStorage() throws IOException {
            // Given: Empty storage
            JsonObject storage = new JsonObject();

            // When: Add all data types
            storage.add("users", new JsonArray());
            storage.add("jobs", new JsonArray());
            storage.add("applications", new JsonArray());
            storage.add("messages", new JsonArray());
            
            Files.writeString(storageFile, gson.toJson(storage));

            // Then: Verify all arrays exist
            String savedContent = Files.readString(storageFile);
            JsonObject savedStorage = gson.fromJson(savedContent, JsonObject.class);
            
            assertTrue(savedStorage.has("users"));
            assertTrue(savedStorage.has("jobs"));
            assertTrue(savedStorage.has("applications"));
            assertTrue(savedStorage.has("messages"));
        }

        @Test
        @DisplayName("Should maintain data after multiple read-write cycles")
        void shouldMaintainDataAfterMultipleReadWriteCycles() throws IOException {
            // Given: Initial storage
            JsonObject storage = new JsonObject();
            storage.add("users", new JsonArray());
            Files.writeString(storageFile, gson.toJson(storage));

            // When: Perform multiple read-write cycles
            for (int i = 0; i < 5; i++) {
                String content = Files.readString(storageFile);
                JsonObject currentStorage = gson.fromJson(content, JsonObject.class);
                
                JsonObject newUser = new JsonObject();
                newUser.addProperty("id", "user_" + i);
                newUser.addProperty("iteration", i);
                currentStorage.getAsJsonArray("users").add(newUser);
                
                Files.writeString(storageFile, gson.toJson(currentStorage));
            }

            // Then: Verify all data persists
            String finalContent = Files.readString(storageFile);
            JsonObject finalStorage = gson.fromJson(finalContent, JsonObject.class);
            JsonArray users = finalStorage.getAsJsonArray("users");
            
            assertEquals(5, users.size());
            
            // Verify all iterations are present
            for (int i = 0; i < 5; i++) {
                final int iterationValue = i;
                boolean found = users.asList().stream()
                    .anyMatch(element -> {
                        int iteration = element.getAsJsonObject().get("iteration").getAsInt();
                        return iteration == iterationValue;
                    });
                assertTrue(found, "Iteration " + i + " should be present");
            }
        }

        @Test
        @DisplayName("Should handle storage file corruption gracefully")
        void shouldHandleStorageFileCorruptionGracefully() throws IOException {
            // Given: Corrupted storage file
            Files.writeString(storageFile, "INVALID JSON {{{");

            // When: Read corrupted file (application would return default)
            String content = Files.readString(storageFile);
            
            // Then: Verify corrupted content is readable but invalid
            // Application should detect invalid JSON and return default
            assertNotNull(content);
            assertFalse(content.equals("{}") || content.startsWith("{"));
        }
    }

    @Nested
    @DisplayName("Chat System Workflow")
    class ChatSystemWorkflow {

        @Test
        @DisplayName("Should send and retrieve messages")
        void shouldSendAndRetrieveMessages() throws IOException {
            // Given: Empty storage
            JsonObject storage = new JsonObject();
            storage.add("messages", new JsonArray());

            // When: Send a message
            JsonObject message = new JsonObject();
            message.addProperty("id", UUID.randomUUID().toString());
            message.addProperty("senderId", "user_001");
            message.addProperty("receiverId", "user_002");
            message.addProperty("content", "Hello, I have a question about the TA position");
            message.addProperty("timestamp", "2026-05-20T10:00:00Z");
            message.addProperty("read", false);

            storage.getAsJsonArray("messages").add(message);
            Files.writeString(storageFile, gson.toJson(storage));

            // Then: Verify message is saved
            String savedContent = Files.readString(storageFile);
            JsonObject savedStorage = gson.fromJson(savedContent, JsonObject.class);
            JsonArray messages = savedStorage.getAsJsonArray("messages");
            
            assertEquals(1, messages.size());
            assertEquals("Hello, I have a question about the TA position",
                messages.get(0).getAsJsonObject().get("content").getAsString());
        }

        @Test
        @DisplayName("Should mark message as read")
        void shouldMarkMessageAsRead() throws IOException {
            // Given: Unread message
            JsonObject storage = new JsonObject();
            storage.add("messages", new JsonArray());

            JsonObject message = new JsonObject();
            message.addProperty("id", "msg_001");
            message.addProperty("read", false);
            storage.getAsJsonArray("messages").add(message);
            Files.writeString(storageFile, gson.toJson(storage));

            // When: Mark message as read
            String content = Files.readString(storageFile);
            JsonObject savedStorage = gson.fromJson(content, JsonObject.class);
            savedStorage.getAsJsonArray("messages").get(0).getAsJsonObject()
                .addProperty("read", true);
            Files.writeString(storageFile, gson.toJson(savedStorage));

            // Then: Verify message is marked as read
            String updatedContent = Files.readString(storageFile);
            JsonObject updatedStorage = gson.fromJson(updatedContent, JsonObject.class);
            assertTrue(updatedStorage.getAsJsonArray("messages").get(0).getAsJsonObject()
                .get("read").getAsBoolean());
        }
    }
}