# AWS Deployment Guide (EC2 + Docker)

This guide describes how AttendEase is deployed on AWS using the Docker setup in this repository.

> **Status:** deployment procedure documented. Live deployment on AWS is planned as the next step.

## Architecture

```
Browser --> EC2 instance (Ubuntu, Docker)
              |-- frontend  (Nginx, port 80)  --proxies /api --> backend
              |-- backend   (Node/Express, port 5000)
              |-- mongo     (MongoDB 6, volume mongo_data)
```

## Steps

1. **Launch an EC2 instance**
   - Ubuntu 22.04, `t2.micro` or `t3.micro` (free tier)
   - Security group inbound rules: SSH (22) from your IP, HTTP (80), HTTPS (443) from anywhere
2. **Connect and install Docker**
   ```bash
   ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
   sudo apt update && sudo apt install -y docker.io docker-compose-v2 git
   sudo usermod -aG docker ubuntu   # log out and back in afterwards
   ```
3. **Get the code**
   ```bash
   git clone https://github.com/atharvacloudops/Attendance-Project.git
   cd Attendance-Project
   ```
4. **Create the environment file** (`.env` in the project root, never commit it)
   ```env
   JWT_SECRET=<long random string>
   GEMINI_API_KEY=<your key, optional>
   CLIENT_URL=http://<EC2_PUBLIC_IP>
   REACT_APP_API_URL=http://<EC2_PUBLIC_IP>/api
   ```
5. **Build and start**
   ```bash
   docker compose up -d --build
   ```
6. **Seed demo accounts (optional)**
   ```bash
   docker compose exec backend node utils/seed.js
   ```
7. Open `http://<EC2_PUBLIC_IP>` in the browser.

## Notes

- **Camera needs HTTPS.** Browsers only allow camera access on `localhost` or HTTPS. For face recognition on a real server, point a domain at the instance and add a free Let's Encrypt certificate (or put the app behind an Application Load Balancer with an ACM certificate).
- **Uploads** (face images, study-material PDFs) are stored in Docker volumes; S3 can replace this later.
- **Database:** the Compose file runs MongoDB in a container. MongoDB Atlas can be used instead by changing `MONGO_URI`.