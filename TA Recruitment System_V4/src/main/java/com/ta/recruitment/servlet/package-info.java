/**
 * Contains servlet classes for the TA Recruitment System.
 * 
 * <p>This package provides REST-like API endpoints for data persistence and synchronization.
 * The main components include:
 * 
 * <ul>
 *   <li>{@link com.ta.recruitment.servlet.StorageSyncServlet} - Handles JSON file-based storage operations
 *       for recruitment data including user profiles, job postings, applications, and chat messages.</li>
 * </ul>
 * 
 * <p>All servlets in this package follow REST principles and support CORS for cross-origin requests.
 * Data is stored in JSON format in the {@code WEB-INF/data/storage.json} file.
 * 
 * @author G83
 * @version 4.0.4
 * @see com.ta.recruitment.servlet.StorageSyncServlet
 */
package com.ta.recruitment.servlet;
