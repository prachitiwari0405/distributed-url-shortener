# Distributed URL Shortener

## Overview

This project is a **URL Shortener application** designed with scalability and backend system design principles in mind. It allows users to convert long URLs into short, shareable links and provides basic analytics such as click counts and creation timestamps.

The goal of this project is not only functional URL shortening but also to demonstrate **backend engineering fundamentals**, clean architecture, and readiness for future **distributed system scaling**.

---

## Key Features

* Shorten long URLs into compact, unique links
* Redirect short URLs to the original long URLs
* Track basic analytics (click count, creation date)
* RESTful backend API
* Clean separation between frontend and backend
* Basic automated tests

---

## Tech Stack

### Frontend

* TypeScript
* JavaScript
* Modern UI components (mobile-first design)

### Backend

* Python
* REST APIs
* URL hashing / code generation logic

### Testing

* Python-based backend tests

---

## Project Structure

```
distributed-url-shortener/
├── backend/        # Backend services and API logic
├── frontend/       # Frontend UI and client-side logic
├── tests/          # Automated backend tests
├── README.md       # Project documentation
└── .gitignore
```

---

## System Design Overview

The application is designed as a **stateless backend service**, which enables horizontal scaling in the future.

### Current Design

* Client sends a long URL to the backend
* Backend generates a unique short code
* Mapping is stored in persistent storage
* Redirect endpoint resolves short code to original URL

### Scalability Considerations (Planned)

* Stateless backend services behind a load balancer
* Hash-based or ID-based short code generation
* Redis caching for frequently accessed URLs
* Database sharding for large-scale URL storage
* Rate limiting to prevent abuse

---

## API Endpoints (High Level)

* `POST /shorten` – Create a short URL
* `GET /{shortCode}` – Redirect to original URL
* `GET /stats/{shortCode}` – Retrieve analytics

---

## Running the Project Locally

### Backend

1. Navigate to the backend directory
2. Install dependencies
3. Run the server

### Frontend

1. Navigate to the frontend directory
2. Install dependencies
3. Start the development server

(Exact commands may vary based on environment setup.)

---

## Testing

* Backend tests are available in the `tests/` directory
* Tests validate URL creation, redirection, and edge cases

To run tests:

```
python backend_test.py
```

---

## Future Improvements

* Authentication and user-specific URLs
* Advanced analytics dashboard
* Redis-based caching
* Rate limiting and abuse prevention
* Full CI/CD pipeline
* Deployment on cloud infrastructure

---

## Why This Project

This project was built to strengthen understanding of:

* Backend API design
* Scalable system architecture
* Clean code organization
* Practical system design concepts used in real-world engineering teams

---
#   Previwe of the project



## Author

**Prachi Tiwari**
Final-year B.Tech CSE student (2026)

