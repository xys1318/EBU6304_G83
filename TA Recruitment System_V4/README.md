# TA Recruitment System

A lightweight Teaching Assistant recruitment management system built with Java Servlet/JSP and JSON text storage.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
    - [Java Development Kit (JDK)](#java-development-kit-jdk)
    - [Apache Maven](#apache-maven)
    - [Apache Tomcat](#apache-tomcat)
3. [Project Structure](#project-structure)
4. [Building the Project](#building-the-project)
5. [Running the Application](#running-the-application)
    - [Development Mode (Jetty)](#development-mode-jetty)
    - [Deploying to Tomcat](#deploying-to-tomcat)
    - [Using Tomcat Maven Plugin](#using-tomcat-maven-plugin)
6. [Running Tests](#running-tests)
7. [Accessing the Application](#accessing-the-application)
8. [Application Features](#application-features)
9. [Troubleshooting](#troubleshooting)
10. [FAQ - Frequently Asked Questions](#faq---frequently-asked-questions)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Java Development Kit (JDK) 11 or higher** - The project is configured to compile with Java 11
- **Apache Maven 3.6+** - For building and managing the project

## Environment Setup

### Java Development Kit (JDK)

1. **Check current Java version:**
    ```powershell
    java -version
    ```

2. **Install JDK 11 or higher** (if not installed):
    - Download from [Adoptium](https://adoptium.net/temurin/releases/) or [Oracle](https://www.oracle.com/java/technologies/downloads/)
    - Recommended path: `D:\jdk-17.0.11+9` (avoid C:\Program Files due to permission issues)

3. **Set JAVA_HOME environment variable:**
    ```powershell
    # Set for current session only
    $env:JAVA_HOME = "D:\jdk-17.0.11+9"
    $env:PATH = "$($env:JAVA_HOME)\bin;$env:PATH"
    ```

### Apache Maven

1. **Check Maven installation:**
    ```powershell
    mvn -v
    ```

2. **Install Maven** (if not installed):
    - Download from [Apache Maven](https://maven.apache.org/download.cgi)
    - Extract to a directory (e.g., `D:\apache-maven-3.9.15`)

3. **Set MAVEN_HOME environment variable:**
    ```powershell
    # Set for current session only
    $env:MAVEN_HOME = "D:\apache-maven-3.9.15"
    $env:PATH = "$($env:MAVEN_HOME)\bin;$env:PATH"
    ```

4. **Verify Maven installation:**
    ```powershell
    mvn -v
    ```

    Expected output:
    ```
    Apache Maven 3.9.15 (98b2cdbfdb5f1ac8781f537ea9acccaed7922349)
    Maven home: D:\apache-maven-3.9.15
    Java version: 17.0.11, vendor: Eclipse Adoptium
    ```

### Apache Tomcat

1. **Download Apache Tomcat:**
    - Download from [Apache Tomcat 9](https://tomcat.apache.org/download-90.cgi) (recommended for this project)
    - Extract to a directory (e.g., `D:\apache-tomcat-9.0.85`)
    - Avoid installing in `C:\Program Files` due to permission issues

2. **Set CATALINA_HOME environment variable:**
    ```powershell
    # Set for current session only
    $env:CATALINA_HOME = "D:\apache-tomcat-9.0.85"
    $env:PATH = "$($env:CATALINA_HOME)\bin;$env:PATH"
    ```

3. **Verify Tomcat installation:**
    ```powershell
    cd $env:CATALINA_HOME\bin
    .\version.bat
    ```

    Expected output:
    ```
    Using CATALINA_BASE:   "D:\apache-tomcat-9.0.85"
    Using CATALINA_HOME:   "D:\apache-tomcat-9.0.85"
    Using CATALINA_TMPDIR: "D:\apache-tomcat-9.0.85\temp"
    Using JRE_HOME:        "D:\jdk-17.0.11+9"
    Using CLASSPATH:       "D:\apache-tomcat-9.0.85\bin\bootstrap.jar;D:\apache-tomcat-9.0.85\bin\tomcat-juli.jar"
    Server version: Apache Tomcat/9.0.85
    Server built:   May 2 2024 10:06:14 UTC
    Server number:  9.0.85.0
    OS Name:        Windows 11
    OS Version:     10.0
    Architecture:   amd64
    JVM Version:    17.0.11+9
    JVM Vendor:     Eclipse Adoptium
    ```

## Project Structure

```
TA Recruitment System_V4/
├── src/
│   └── main/
│       ├── java/
│       │   └── com/ta/recruitment/servlet/
│       │       ├── StorageSyncServlet.java
│       │       └── package-info.java
│       └── webapp/
│           ├── WEB-INF/
│           │   └── data/
│           │       └── storage.json
│           ├── assets/
│           │   ├── bupt-logo.png
│           │   └── qmul-logo.png
│           ├── admin_dashboard.html
│           ├── application_records.html
│           ├── application_records.js
│           ├── chat_list.html
│           ├── chat_service.js
│           ├── feedback-ui.js
│           ├── index.jsp
│           ├── job.html
│           ├── job.js
│           ├── job_detail.html
│           ├── login.html
│           ├── login.js
│           ├── mo_dashboard.html
│           ├── mo_edit_job.html
│           ├── personal_center.html
│           ├── personal_center_card.html
│           ├── profile.html
│           ├── recruitment_data.js
│           ├── register.html
│           ├── role_access.js
│           ├── storage_service.js
│           ├── ta_resume.js
│           ├── theme.css
│           └── theme.js
├── test/
│   └── java/
│       └── com/ta/recruitment/
│           ├── servlet/
│           │   ├── StorageSyncServletTest.java
│           │   └── package-info.java
│           ├── service/
│           │   ├── JsonStorageServiceTest.java
│           │   └── package-info.java
│           └── integration/
│               └── RecruitmentSystemIntegrationTest.java
├── pom.xml
├── README.md
├── TESTING.md
└── BACKEND_SETUP.md
```

### Directory Summary

| Directory | Purpose |
|-----------|---------|
| `src/main/java/` | Production Java source code (Servlets, services) |
| `src/main/webapp/` | Web application resources (HTML, JS, CSS, images) |
| `src/main/webapp/WEB-INF/data/` | JSON data storage files |
| `test/java/` | Test source code (JUnit 5, Mockito) |

## Building the Project

1. **Navigate to the project directory (according to your own path):**
    ```powershell
    cd "C:\Users\lenovo\Desktop\TA.Recruitment.System_V4.0.5\TA Recruitment System_V4"
    ```

2. **Set environment variables (if not already set):**
    ```powershell
    $env:JAVA_HOME = "D:\jdk-17.0.11+9"
    $env:MAVEN_HOME = "D:\apache-maven-3.9.15"
    $env:PATH = "$($env:JAVA_HOME)\bin;$($env:MAVEN_HOME)\bin;$env:PATH"
    ```

3. **Build the project with Maven:**
    ```powershell
    mvn clean install -DskipTests
    ```

    This command will:
    - Clean any previous builds
    - Compile Java sources
    - Package the web application into a WAR file
    - Install the artifact to local Maven repository

4. **Expected successful build output:**
    ```
    [INFO] ------------------------------------------------------------------------
    [INFO] BUILD SUCCESS
    [INFO] ------------------------------------------------------------------------
    [INFO] Total time:  4.548 s
    [INFO] Finished at: 2026-05-20T18:11:51+08:00
    [INFO] ------------------------------------------------------------------------
    ```

## Running the Application

The project uses **Jetty Maven Plugin** for development and testing.

### Development Mode (Jetty)

1. **Start Jetty server:**
    ```powershell
    mvn jetty:run
    ```

2. **Expected startup output:**
    ```
    [INFO] jetty-9.4.53.v20231009; built: 2023-10-09T12:29:09.265Z; git: 27bde00a0b95a1d5bbee0eae7984f891d2d0f8c9; jvm 17.0.11+9
    [INFO] Started o.e.j.m.p.JettyWebAppContext@235c997d{/ta,file:///...,AVAILABLE}
    [INFO] Started ServerConnector@60deefed{HTTP/1.1, (http/1.1)}{0.0.0.0:8082}
    [INFO] Started @3120ms
    [INFO] Started Jetty Server
    ```

3. **Stop the server:**
    - Press `Ctrl + C` in the terminal

### Deploying to Tomcat

#### Method 1: Manual Deployment

1. **Build the WAR file:**
    ```powershell
    mvn clean package -DskipTests
    ```

2. **Copy the WAR file to Tomcat's webapps directory:**
    ```powershell
    Copy-Item "target\ta-recruitment-system.war" -Destination "$($env:CATALINA_HOME)\webapps\"
    ```

3. **Start Tomcat:**
    ```powershell
    cd $env:CATALINA_HOME\bin
    .\startup.bat
    ```

4. **Expected startup output:**
    ```
    Using CATALINA_BASE:   "D:\apache-tomcat-9.0.85"
    Using CATALINA_HOME:   "D:\apache-tomcat-9.0.85"
    Using CATALINA_TMPDIR: "D:\apache-tomcat-9.0.85\temp"
    Using JRE_HOME:        "D:\jdk-17.0.11+9"
    Using CLASSPATH:       "D:\apache-tomcat-9.0.85\bin\bootstrap.jar;D:\apache-tomcat-9.0.85\bin\tomcat-juli.jar"
    INFO [main] org.apache.catalina.startup.VersionLoggerListener.log Server version name:   Apache Tomcat/9.0.85
    INFO [main] org.apache.catalina.startup.VersionLoggerListener.log Server built:          May 2 2024 10:06:14 UTC
    INFO [main] org.apache.catalina.startup.VersionLoggerListener.log Server version number: 9.0.85.0
    INFO [main] org.apache.catalina.startup.Catalina.start Server startup in [xxx] milliseconds
    ```

5. **Stop Tomcat:**
    ```powershell
    cd $env:CATALINA_HOME\bin
    .\shutdown.bat
    ```

#### Method 2: Using Tomcat Maven Plugin

1. **Add Tomcat Maven Plugin to pom.xml:**
    ```xml
    <plugin>
        <groupId>org.apache.tomcat.maven</groupId>
        <artifactId>tomcat7-maven-plugin</artifactId>
        <version>2.2</version>
        <configuration>
            <port>8080</port>
            <path>/ta</path>
            <update>true</update>
        </configuration>
    </plugin>
    ```

2. **Start the application with Tomcat Maven Plugin:**
    ```powershell
    mvn tomcat7:run
    ```

3. **Expected startup output:**
    ```
    [INFO] Scanning for projects...
    [INFO] 
    [INFO] ------------------------------------------------------------------------
    [INFO] Building TA Recruitment System 1.0.0
    [INFO] ------------------------------------------------------------------------
    [INFO] 
    [INFO] >>> tomcat7-maven-plugin:2.2:run (default-cli) @ ta-recruitment-system >>>
    [INFO] 
    [INFO] --- maven-resources-plugin:3.4.0:resources (default-resources) @ ta-recruitment-system ---
    [INFO] skip non existing resourceDirectory C:\Users\lenovo\Desktop\TA.Recruitment.System_V4.0.4\TA Recruitment System_V4\src\main\resources
    [INFO] 
    [INFO] --- maven-compiler-plugin:3.15.0:compile (default-compile) @ ta-recruitment-system ---
    [INFO] Nothing to compile - all classes are up to date
    [INFO] 
    [INFO] --- maven-resources-plugin:3.4.0:testResources (default-testResources) @ ta-recruitment-system ---
    [INFO] skip non existing resourceDirectory C:\Users\lenovo\Desktop\TA.Recruitment.System_V4.0.4\TA Recruitment System_V4\src\test\resources
    [INFO] 
    [INFO] --- maven-compiler-plugin:3.15.0:testCompile (default-testCompile) @ ta-recruitment-system ---
    [INFO] No sources to compile
    [INFO] 
    [INFO] <<< tomcat7-maven-plugin:2.2:run (default-cli) @ ta-recruitment-system <<<
    [INFO] 
    [INFO] 
    [INFO] --- tomcat7-maven-plugin:2.2:run (default-cli) @ ta-recruitment-system ---
    [INFO] Running war on http://localhost:8080/ta
    [INFO] Using existing Tomcat server configuration at C:\Users\lenovo\AppData\Local\Temp\tomcat_maven_plugin_1234567890
    [INFO] create webapp with contextPath: /ta
    ```

4. **Stop the server:**
    - Press `Ctrl + C` in the terminal

### Production Deployment

For production, deploy the WAR file (`target/ta-recruitment-system.war`) to:
- Apache Tomcat 9+
- Jetty 9+
- Any Java Servlet 4.0 compatible container

## Running Tests

The project includes comprehensive unit tests and integration tests using JUnit 5 and Mockito.

### Test Structure

| Test Class | Location | Description |
|------------|----------|-------------|
| `StorageSyncServletTest` | `test/java/com/ta/recruitment/servlet/` | Servlet unit tests with Mockito |
| `JsonStorageServiceTest` | `test/java/com/ta/recruitment/service/` | File I/O and JSON storage tests |
| `RecruitmentSystemIntegrationTest` | `test/java/com/ta/recruitment/integration/` | End-to-end workflow tests |

### Running All Tests

```powershell
mvn test
```

### Running Specific Tests

```powershell
# Run a specific test class
mvn test -Dtest=StorageSyncServletTest

# Run multiple test classes
mvn test -Dtest=StorageSyncServletTest,JsonStorageServiceTest

# Run tests by package
mvn test -Dtest="com.ta.recruitment.servlet.*"
```

### Test Dependencies

The project uses the following testing frameworks:
- **JUnit 5** - Test framework
- **Mockito** - Mocking framework for HTTP requests/responses
- **Gson** - JSON parsing for tests

For detailed test documentation, see [TESTING.md](TESTING.md).

## Accessing the Application

Once the server is running, access the application at:

### Jetty (Default - Port 8082)

| Page | URL | Description |
|------|-----|-------------|
| Login | http://localhost:8082/ta/login.html | User login page |
| Register | http://localhost:8082/ta/register.html | User registration |
| Home | http://localhost:8082/ta/ | Main application entry |
| Admin Dashboard | http://localhost:8082/ta/admin_dashboard.html | Admin panel |
| MO Dashboard | http://localhost:8082/ta/mo_dashboard.html | Manager dashboard |
| Job Listings | http://localhost:8082/ta/job.html | Job listings page |
| Personal Center | http://localhost:8082/ta/personal_center.html | User profile |

### Tomcat (Port 8080)

| Page | URL | Description |
|------|-----|-------------|
| Login | http://localhost:8080/ta/login.html | User login page |
| Register | http://localhost:8080/ta/register.html | User registration |
| Home | http://localhost:8080/ta/ | Main application entry |
| Admin Dashboard | http://localhost:8080/ta/admin_dashboard.html | Admin panel |
| MO Dashboard | http://localhost:8080/ta/mo_dashboard.html | Manager dashboard |
| Job Listings | http://localhost:8080/ta/job.html | Job listings page |
| Personal Center | http://localhost:8080/ta/personal_center.html | User profile |

## Application Features

### User Roles
- **Applicant**: Browse jobs, submit applications, view application status
- **Manager (MO)**: Manage job listings, review applications
- **Admin**: System administration, user management

### Core Features
1. **User Authentication**: Login, registration, role-based access control
2. **Job Management**: Create, edit, delete job listings
3. **Application Management**: Submit applications, track application status
4. **Chat System**: Communication between applicants and recruiters
5. **Profile Management**: Update personal information and resume
6. **Theme Support**: UI theme customization

### Technical Stack
- **Backend**: Java Servlet 4.0
- **Frontend**: HTML5, JavaScript, CSS3
- **Database**: JSON file-based storage (`storage.json`)
- **Server**: Jetty (embedded) / Tomcat
- **Build Tool**: Apache Maven
- **Testing**: JUnit 5, Mockito

## Troubleshooting

### Common Issues

1. **Java version mismatch**:
    ```
    [ERROR] Failed to execute goal org.apache.maven.plugins:maven-compiler-plugin:3.15.0:compile
    ```
    **Solution**: Ensure JDK 11+ is installed and JAVA_HOME is set correctly.

2. **Maven not found**:
    ```
    'mvn' is not recognized as an internal or external command
    ```
    **Solution**: Set MAVEN_HOME and add Maven bin to PATH.

3. **Port 8082 already in use**:
    ```
    java.net.BindException: Address already in use
    ```
    **Solution**: Kill the process using port 8082 or change the port in `pom.xml`:
    ```xml
    <configuration>
        <httpConnector>
            <port>8083</port>  <!-- Change to available port -->
        </httpConnector>
    </configuration>
    ```

4. **Permission denied when writing files**:
    ```
    java.io.IOException: Permission denied
    ```
    **Solution**: Ensure the project directory has write permissions, avoid placing the project in `C:\Program Files`.

5. **Tomcat startup failed - Port 8080 already in use**:
    ```
    SEVERE [main] org.apache.catalina.core.StandardService.initInternal Failed to initialize connector [Connector[HTTP/1.1-8080]]
    org.apache.catalina.LifecycleException: Protocol handler initialization failed
    ```
    **Solution**: Kill the process using port 8080 or change the port in `conf/server.xml`:
    ```xml
    <Connector port="8081" protocol="HTTP/1.1"
                connectionTimeout="20000"
                redirectPort="8443" />
    ```

6. **Tomcat war deployment failed - Permission denied**:
    ```
    SEVERE [localhost-startStop-1] org.apache.catalina.startup.HostConfig.deployWAR Error deploying web application archive
    java.io.IOException: Permission denied
    ```
    **Solution**: Ensure Tomcat has write permissions to the `webapps` directory. Avoid installing Tomcat in `C:\Program Files`.

7. **Tomcat Maven Plugin not found**:
    ```
    [ERROR] No plugin found for prefix 'tomcat7' in the current project
    ```
    **Solution**: Ensure the Tomcat Maven Plugin is added to `pom.xml` as shown in the "Using Tomcat Maven Plugin" section.

### Debug Mode

To run in debug mode:
```powershell
mvn jetty:run -Djetty.debug=8000
```

Then connect your IDE debugger to port 8000.

### Logs

Application logs are printed to the console during runtime. For production, configure logging in Jetty or Tomcat.

## FAQ - Frequently Asked Questions

### 1. Testing Related

**Q: Tests pass but with warnings, is this normal?**
```
A: Yes, this is normal. Warning messages are usually:
   - Missing Javadoc comments
   - Unused imports
   - Encoding related warnings
   As long as tests pass (BUILD SUCCESS), the project is ready to use.

Q: How to run a specific test class?
```powershell
mvn test -Dtest=StorageSyncServletTest
mvn test -Dtest=JsonStorageServiceTest
mvn test -Dtest=RecruitmentSystemIntegrationTest
```

**Q: Will test data pollute real data?**
```
A: Tests use @TempDir to create temporary directories, so they won't affect real data.
   Real data location: src/main/webapp/WEB-INF/data/storage.json
   Test data location: System temp directory (e.g., C:\Users\xxx\AppData\Local\Temp\...)
```

---

### 2. Javadoc Generation Related

**Q: Javadoc generation failed with garbled text errors?**
```
A: Cause: HTML syntax errors or encoding issues in overview.html file.
   Solution: Ensure all HTML tags are properly closed, check for unescaped special characters.

Q: Where is the generated Javadoc?
```powershell
# Generation command
mvn javadoc:javadoc

# Default location: target/reports/apidocs/
# If outputDirectory is configured in pom.xml: target/site/apidocs/
```

**Q: How to include overview page in Javadoc?**
```xml
<!-- Add to maven-javadoc-plugin in pom.xml -->
<configuration>
    <overview>${project.basedir}/overview.html</overview>
    <charset>UTF-8</charset>
    <encoding>UTF-8</encoding>
    <docencoding>UTF-8</docencoding>
    <failOnError>false</failOnError>
</configuration>
```

---

### 3. Jetty Development Server Related

**Q: Jetty started successfully but page shows 404?**
```
A: Check the following:
   1. Is the context path correct? (should be /ta)
      Correct: http://localhost:8082/ta/
      Wrong:   http://localhost:8082/
   
   2. Is web.xml present?
      Location: src/main/webapp/WEB-INF/web.xml
   
   3. Is the port being used?
      netstat -ano | findstr :8082
```

**Q: How to hot-reload frontend code changes?**
```
A: Jetty has auto-reload enabled by default (Reload Mechanic: automatic).
   After modifying HTML/CSS/JS files, refresh the browser to see updates.
   If Java code is modified, recompile:
   mvn compile
```

**Q: How to shut down Jetty?**
```
A: Press Ctrl+C in the terminal running Jetty
   Or close the terminal window
   Do not close IDE directly, otherwise the process may still be running
```

---

### 4. Data Storage Related

**Q: How to backup and restore data?**
```
A: Backup:
   Copy src/main/webapp/WEB-INF/data/storage.json to a safe location

Restore:
   Copy the backup file back to the original location, overwrite existing file
   Restart the server

Note: Stop the server before backup to avoid write conflicts
```

**Q: storage.json file is too large, what to do?**
```
A: Periodically clean up expired application records:
   1. Open storage.json
   2. Delete applications with status "Rejected" older than 3 months
   3. Save the file
```

**Q: Data not syncing to other pages?**
```
A: Data syncs through localStorage, ensure:
   1. Using the same localStorage key
   2. Page refreshes re-read localStorage
   3. StorageSyncServlet is used for Servlet layer sync
```

---

### 5. Permissions and Roles Related

**Q: Why can't newly created users see any features after login?**
```
A: By default, newly created users have no permissions.
   You need to manually assign roles:
   1. Login with admin account
   2. Go to Admin Console > Account Management
   3. Find the user, click "Edit Role"
   4. Enter role: ta / mo / admin
```

**Q: What is the difference between the three roles?**
```
A: 
   TA (Teaching Assistant): Apply for positions, manage resume
   MO (Management Officer): Post positions, review applications
   Admin: System management, data export, workload statistics

Specific permissions are defined in role_access.js
```

**Q: How to modify user's email or password?**
```
A: Currently, only admin can modify emails:
   1. Login as Admin > Account Management
   2. Click user's "Edit Email"
   3. Enter new email

   Password modification is not yet implemented (requires backend support)
```

---

### 6. CORS and API Related

**Q: CORS error when calling Servlet from frontend?**
```
A: Servlets are configured with CORS headers:
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: GET, POST, OPTIONS
   Access-Control-Allow-Headers: Content-Type

   If still having CORS issues, check:
   1. Is the request URL correct?
   2. Does the request method match?
   3. Are there custom headers not declared?
```

**Q: How to view API call logs?**
```
A: Browser side:
   Open Developer Tools (F12) > Network tab
   
   Server side:
   Jetty console prints all HTTP request logs
```

---

### 7. Frontend Images Related

**Q: Image failed to load, showing default image?**
```
A: Possible causes:
   1. AI image generation API unavailable
      Solution: All AI images have been replaced with local assets images
   
   2. assets folder path incorrect
      Check: src/main/webapp/assets/ - does the corresponding image exist?
   
   3. Avatar data in localStorage corrupted
      Solution: Go to Personal Center, click "Remove" to delete avatar
```

**Q: How to add custom logo?**
```
A: 1. Put the image into src/main/webapp/assets/ directory
   2. Reference in HTML:
      <img src="assets/your-logo.png" alt="Logo">
   
   Note: Keep assets folder under src/main/webapp/
```

---

### 8. Deployment Related

**Q: After deploying to Tomcat, page styles are lost?**
```
A: Possible causes:
   1. context path mismatch
      Ensure URL starts with /ta
   
   2. assets path issue
      Check if assets folder is under webapp directory
   
   3. Check error messages in Tomcat logs
```

**Q: How to generate WAR package for external Tomcat deployment?**
```powershell
mvn clean package
# Generated file: target/ta-recruitment-system.war
# Copy to Tomcat webapps directory
# Access via http://localhost:8080/ta/
```

**Q: External Tomcat access path is inconsistent?**
```
A: 
   Internal Jetty: http://localhost:8082/ta/
   External Tomcat: http://localhost:8080/ta/
   
   If Tomcat is deployed to root path:
   http://localhost:8080/
   
   How to modify:
   1. Modify <contextPath> in pom.xml
   2. Or configure Context path in Tomcat conf/server.xml
```

---

### 9. Performance Related

**Q: Page loads very slowly?**
```
A: Possible causes and solutions:
   1. Large localStorage data
      Solution: Periodically clean up expired application records
   
   2. Large JSON file
      Solution: Use the large JSON file test in JUnit tests to verify
               Ensure file size is within reasonable range (<1MB)
   
   3. Network issues (AI images)
      Solution: Use local assets images instead
```

**Q: Concurrent writes causing data loss?**
```
A: The system uses localStorage for storage, with the following limitations:
   1. Within the same browser tab: Normal
   2. Multiple tabs writing simultaneously: May overwrite
   3. Multiple browsers writing simultaneously: May overwrite
   
   Recommendation: Avoid multiple users operating the same account simultaneously
```

---

### 10. Other Common Issues

**Q: How to check the current system version?**
```
A: Check the <version> tag in pom.xml
   Or visit: http://localhost:8082/ta/
   See version info at the bottom of the page
```

**Q: How to reset system data?**
```
A: 1. Stop the server
   2. Delete or rename storage.json
   3. Clear browser localStorage:
      Developer Tools > Application > Local Storage > Clear
   4. Restart the server
   5. System will automatically create a new empty storage.json
```

**Q: Does test code need a separate directory?**
```
A: Can be placed in test/java directory (parallel to src)
   Need to configure in pom.xml:
   <testSourceDirectory>test/java</testSourceDirectory>
   
   Or use standard Maven structure:
   src/test/java/
```

---

## Documentation

- **README.md**: This file - Project overview, setup, and usage instructions
- **TESTING.md**: Test documentation with test coverage and running instructions
- **BACKEND_SETUP.md**: Backend development setup guide

## Support

For issues or questions, please contact the development team.

---

*Built with Java Servlet and Jetty*
