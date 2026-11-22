# ---------- Backend (Node.js + Express) ----------
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# Copy the application source
COPY . .

# Folders the app writes to at runtime
RUN mkdir -p uploads attendance_records

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server.js"]