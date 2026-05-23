# TA Recruitment System - Test Documentation

## Overview

This document describes the test suite for the TA Recruitment System, including how to run tests, test coverage, and test structure.

## Test Structure

```
test/java/
├── com/ta/recruitment/
│   ├── servlet/
│   │   ├── package-info.java
│   │   └── StorageSyncServletTest.java
│   ├── service/
│   │   ├── package-info.java
│   │   └── JsonStorageServiceTest.java
│   └── integration/
│       └── RecruitmentSystemIntegrationTest.java
src/
├── main/
│   ├── java/
│   │   └── com/ta/recruitment/servlet/
│   │       ├── StorageSyncServlet.java
│   │       └── package-info.java
│   └── webapp/
│       ├── WEB-INF/
│       └── ...
```

## Dependencies

The following test dependencies have been added to `pom.xml`:

```xml
<!-- JUnit 5 -->
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter-api</artifactId>
    <version>5.10.0</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter-engine</artifactId>
    <version>5.10.0</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter-params</artifactId>
    <version>5.10.0</version>
    <scope>test</scope>
</dependency>

<!-- Mockito -->
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <version>5.7.0</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-junit-jupiter</artifactId>
    <version>5.7.0</version>
    <scope>test</scope>
</dependency>

<!-- Gson for JSON parsing in tests -->
<dependency>
    <groupId>com.google.code.gson</groupId>
    <artifactId>gson</artifactId>
    <version>2.10.1</version>
    <scope>test</scope>
</dependency>
```

## Running Tests

### Prerequisites

Ensure you have the following environment variables set:

```powershell
$env:JAVA_HOME = "D:\jdk-17.0.11+9"
$env:MAVEN_HOME = "D:\apache-maven-3.9.15"
$env:PATH = "$($env:JAVA_HOME)\bin;$($env:MAVEN_HOME)\bin;$env:PATH"
```

### Run All Tests

To run all tests in the project:

```powershell
mvn test
```

### Run Specific Test Classes

Run a specific test class:

```powershell
mvn test -Dtest=StorageSyncServletTest
```

Run multiple specific test classes:

```powershell
mvn test -Dtest=StorageSyncServletTest,JsonStorageServiceTest
```

### Run Tests by Pattern

Run all tests in a specific package:

```powershell
mvn test -Dtest="com.ta.recruitment.servlet.*"
```

Run tests matching a pattern:

```powershell
mvn test -Dtest="*IntegrationTest"
```

### Run Tests with Verbose Output

For more detailed output during test execution:

```powershell
mvn test -X
```

## Test Coverage

### 1. Servlet Layer Tests (StorageSyncServletTest)

Tests for `StorageSyncServlet` using Mockito to mock HTTP requests and responses.

**Coverage:**
- `doGet()` - Retrieve storage data (empty file, valid data, malformed data)
- `doPost()` - Write valid and invalid JSON (valid JSON, malformed JSON, JSON array, empty body)
- `doOptions()` - CORS preflight handling
- Thread safety for sequential operations
- Edge cases (null realPath, missing storage file)

### 2. File I/O Tests (JsonStorageServiceTest)

Tests for JSON file storage operations using `@TempDir`.

**Coverage:**
- Read operations (valid JSON, empty file, Unicode characters, large files)
- Write operations (create, update, overwrite)
- File existence checks
- Directory operations (create nested directories)
- Error handling (IOException, null content)
- Data integrity (JSON structure, whitespace preservation)

### 3. Integration Tests (RecruitmentSystemIntegrationTest)

End-to-end tests for complete workflows.

**Coverage:**
- User Registration Workflow (register user, prevent duplicate, different roles)
- Job Posting Workflow (create job, update status, track slots)
- Application Submission Workflow (submit application, prevent duplicate, update status)
- Data Persistence Tests (persist all data types, multiple read-write cycles, corruption handling)
- Chat System Workflow (send messages, mark as read)

## Test Approach

### Given / When / Then Format

All test methods follow the Given-When-Then pattern:

```java
@Test
void testName() {
    // Given: Setup test data and conditions
    // ...
    
    // When: Perform the action being tested
    // ...
    
    // Then: Verify the expected outcomes
    // ...
}
```

### Using @TempDir

Temporary directories are automatically created and cleaned up:

```java
@TempDir
Path tempDir;

@Test
void testWithTempDir() {
    Path testFile = tempDir.resolve("test.json");
    // Use testFile for testing
    // Automatically cleaned up after test
}
```

### Mocking with Mockito

Servlet tests use Mockito to mock HTTP components:

```java
@Mock
private HttpServletRequest request;

@Mock
private HttpServletResponse response;

@BeforeEach
void setUp() {
    MockitoAnnotations.openMocks(this);
    // Configure mock behavior
    when(response.getWriter()).thenReturn(printWriter);
}
```

## Container-Agnostic Testing

These tests are designed to work with any Servlet container (Jetty, Tomcat, etc.):

- **No Jetty dependencies** - Tests use only `javax.servlet-api` (test scope)
- **No Tomcat dependencies** - Pure Mockito mocking
- **No deployment required** - All tests run in JVM
- **Temporary files** - Uses `@TempDir` for isolation

## Directory Structure Summary

| Directory | Purpose |
|-----------|---------|
| `test/java/com/ta/recruitment/servlet/` | Servlet unit tests |
| `test/java/com/ta/recruitment/service/` | File I/O and service tests |
| `test/java/com/ta/recruitment/integration/` | End-to-end integration tests |
| `src/main/java/com/ta/recruitment/servlet/` | Production Servlet code |
| `src/main/webapp/` | Web application resources |

## Manual Testing Instructions

For integration testing that requires a running server:

### Using Jetty

1. Start the server:
```powershell
mvn jetty:run
```

2. Test endpoints manually:
```powershell
# Get storage data
Invoke-WebRequest -Uri "http://localhost:8082/ta/api/storage" -Method Get

# Post storage data
$body = '{"test":"data"}'
Invoke-WebRequest -Uri "http://localhost:8082/ta/api/storage" -Method Post -Body $body -ContentType "application/json"
```

### Using Tomcat

1. Build WAR file:
```powershell
mvn clean package -DskipTests
```

2. Deploy to Tomcat:
```powershell
Copy-Item "target\ta-recruitment-system.war" -Destination "TOMCAT_HOME\webapps\"
```

3. Start Tomcat and test endpoints at `http://localhost:8080/ta/`

## CI/CD Integration

To run tests in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run tests
  run: mvn test -B
```

## Coverage Reports

To generate test coverage reports, add this to your `pom.xml`:

```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.11</version>
    <executions>
        <execution>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals>
                <goal>report</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

Then run:
```powershell
mvn test jacoco:report
```

Coverage report will be at `target/site/jacoco/index.html`

---

*For questions or issues, contact the development team.*