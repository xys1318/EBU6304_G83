/**
 * Test suite for TA Recruitment System servlets.
 * 
 * <p>This package contains unit tests for servlet classes using JUnit 5 and Mockito.
 * Tests are container-agnostic and do not depend on Jetty or Tomcat.
 * 
 * <p>Test approach:
 * <ul>
 *   <li>Mock HttpServletRequest and HttpServletResponse using Mockito</li>
 *   <li>Use @TempDir for temporary file storage during tests</li>
 *   <li>Verify HTTP status codes, headers, and response content</li>
 * </ul>
 * 
 * @author G83
 * @version 4.0.4
 * @see com.ta.recruitment.servlet.StorageSyncServletTest
 */
package com.ta.recruitment.servlet;