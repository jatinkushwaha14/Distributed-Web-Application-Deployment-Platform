# Distributed Web Application Deployment Platform

This repository contains three core services for automated, cloud-native web application deployment:

- **APIserver**: Handles API requests and orchestrates build tasks.
- **BuildServer**: Executes build processes and uploads artifacts.
- **ReverseProxy**: Routes incoming requests to deployed applications.

All services are designed for microservices deployment using Node.js, Docker, AWS ECS Fargate, and Redis.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Directory Structure](#directory-structure)
- [Environment Variables](#environment-variables)
- [Setup Instructions](#setup-instructions)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Configure Environment Variables](#2-configure-environment-variables)
  - [3. Install Dependencies](#3-install-dependencies)
  - [4. Running the Services](#4-running-the-services)
- [Service Details](#service-details)
  - [APIserver](#apiserver)
  - [BuildServer](#buildserver)
  - [ReverseProxy](#reverseproxy)
- [Best Practices](#best-practices)
- [License](#license)

## Architecture Overview

- **APIserver** receives build requests, triggers ECS Fargate tasks, and manages real-time log streaming via Redis and Socket.IO.
- **BuildServer** clones the user repository, runs the build process, and uploads the output to AWS S3.
- **ReverseProxy** dynamically routes requests to deployed applications based on subdomain or project ID.

## Directory Structure

```
/APIserver
/BuildServer
/Reverseproxy
```

Each service is an independent Node.js project with its own dependencies and configuration.

## Environment Variables

**Create a `.env` file in each service directory** and set the following variables:

| Variable         | Description                          |
|------------------|--------------------------------------|
| ACCESSKEY        | AWS Access Key ID                    |
| SECRETKEY        | AWS Secret Access Key                |
| REDIS_PASSWORD   | Redis database password              |
| CLUSTER_ARN      | AWS ECS Cluster ARN (APIserver only) |
| TASK_DEFINITION  | AWS ECS Task Definition ARN (APIserver only) |

**Example `.env`:**
```
ACCESSKEY=your_aws_access_key
SECRETKEY=your_aws_secret_key
REDIS_PASSWORD=your_redis_password
CLUSTER_ARN=your_ecs_cluster_arn
TASK_DEFINITION=your_ecs_task_definition_arn
```

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/Distributed-Web-Application-Deployment-Platform.git
cd Distributed-Web-Application-Deployment-Platform
```

### 2. Configure Environment Variables

- Copy the example above into a `.env` file in each service directory.
- Fill in your actual credentials and configuration values.

### 3. Install Dependencies

For each service, run:

```bash
cd APIserver
npm install

cd ../BuildServer
npm install

cd ../Reverseproxy
npm install
```

### 4. Running the Services

You can run each service locally for development:

```bash
# In separate terminals for each service:
cd APIserver && node index
cd BuildServer && docker build -t build-server . && (docker run with projectID and GITURL as env variables)
cd Reverseproxy && node index
```

Or use Docker Compose for orchestration (if provided).

## Service Details

### APIserver

- **Purpose:** Receives build requests, triggers ECS tasks, streams logs via Redis/Socket.IO.
- **Key Env Vars:** `ACCESSKEY`, `SECRETKEY`, `REDIS_PASSWORD`, `CLUSTER_ARN`, `TASK_DEFINITION`
- **Default Port:** 3000 (REST API), 3001 (Socket.IO)

### BuildServer

- **Purpose:** Clones user repos, builds projects, uploads artifacts to S3, publishes logs to Redis.
- **Key Env Vars:** `ACCESSKEY`, `SECRETKEY`, `REDIS_PASSWORD`
- **Default Port:** (as configured)

### ReverseProxy

- **Purpose:** Routes HTTP requests to deployed applications based on subdomain or project ID.
- **Key Env Vars:** (as needed for your setup)
- **Default Port:** (as configured)
