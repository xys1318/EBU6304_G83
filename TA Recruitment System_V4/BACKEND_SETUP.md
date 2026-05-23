# TA Recruitment System Backend Setup

## Tech Stack

- Lightweight Java Servlet/JSP web app
- JSON plain-text persistence file: `WEB-INF/data/storage.json`
- JUnit 5 + Mockito for testing

## System Roles

The system supports three user roles with different permissions:

| Role | Description | Key Features |
|------|-------------|--------------|
| **TA** (Teaching Assistant) | Job applicants | Browse jobs, apply for positions, manage resume, view application status, chat with MO |
| **MO** (Management Officer) | Recruitment managers | Post jobs, review applications, approve/reject candidates, chat with TAs |
| **Admin** | System administrator | Manage users, export data, view TA workload overview, operation timeline |

## Admin Dashboard Features

The Admin dashboard (`admin_dashboard.html`) provides the following features:

- **Application Records**: View and manage all application records with status filtering
- **Account Management**: Manage TA and MO accounts, edit email, change roles, delete users
- **Export Center**: Export data as JSON files (Users, Jobs, Applications, All Data)
- **Job & Application Overview**: View all jobs and TA submissions
- **TA Workload Overview**: View each TA's total workload across approved applications
- **Operation Timeline**: View recent application activities and status changes
- **System Notice Center**: Broadcast notices to all TAs or MOs

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
│           └── ... (HTML, JS, CSS files)
├── test/
│   └── java/
│       └── com/ta/recruitment/
│           ├── servlet/
│           │   └── StorageSyncServletTest.java
│           ├── service/
│           │   └── JsonStorageServiceTest.java
│           └── integration/
│               └── RecruitmentSystemIntegrationTest.java
└── pom.xml
```

## What Was Added

- `pom.xml`: Maven WAR project with Jetty plugin and test dependencies
- `src/main/java/com/ta/recruitment/servlet/StorageSyncServlet.java`: Main storage API servlet
- `src/main/java/com/ta/recruitment/servlet/package-info.java`: Package documentation
- `src/main/webapp/index.jsp`: Default landing page
- `src/main/webapp/WEB-INF/data/storage.json`: JSON data storage file
- `test/java/com/ta/recruitment/servlet/StorageSyncServletTest.java`: Servlet unit tests
- `test/java/com/ta/recruitment/service/JsonStorageServiceTest.java`: File I/O tests
- `test/java/com/ta/recruitment/integration/RecruitmentSystemIntegrationTest.java`: Integration tests
- Frontend sync in `storage_service.js`

## API

### Storage API

- `GET /api/storage`
  - Returns the full JSON snapshot object.
  - Response: `application/json`

- `POST /api/storage`
  - Request body must be a JSON object string.
  - Replaces the full storage snapshot.
  - Response: `{"ok":true}` on success, `{"ok":false,"message":"..."}` on failure

- `OPTIONS /api/storage`
  - Handles CORS preflight requests
  - Returns CORS headers

### CORS Support

All endpoints support CORS with the following headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET,POST,OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

## Run

### Development Mode (Jetty)

```bash
mvn jetty:run
```

The application will be available at `http://localhost:8082/ta/`

### Build for Deployment

```bash
mvn clean package -DskipTests
```

Deploy the generated WAR (`target/ta-recruitment-system.war`) to Tomcat 9+ or any Servlet 4.0 compatible container.

## Testing

### Run All Tests

```bash
mvn test
```

### Run Specific Tests

```bash
# Run Servlet tests
mvn test -Dtest=StorageSyncServletTest

# Run integration tests
mvn test -Dtest=RecruitmentSystemIntegrationTest
```

### Test Coverage

- **Servlet Layer**: Tests for `StorageSyncServlet` using Mockito to mock HTTP requests/responses
- **Service Layer**: Tests for JSON file I/O operations using JUnit 5 `@TempDir`
- **Integration Layer**: End-to-end workflow tests covering user registration, job posting, and application submission

## Data Storage

All data is stored and transmitted as JSON text in `WEB-INF/data/storage.json`. The storage structure includes:

- `users`: User profiles (applicants, managers, admins)
- `jobs`: Job postings
- `applications`: Application records
- `messages`: Chat messages

## Frontend Integration

The frontend (`storage_service.js`) automatically syncs localStorage changes to the backend via the `/api/storage` endpoint, ensuring data persistence across sessions and users.
