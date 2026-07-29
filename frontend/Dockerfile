FROM docker.io/library/node:22-alpine

WORKDIR /app/frontend

COPY frontend/package*.json ./

RUN npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retries 5

RUN npm ci --verbose --progress=true

COPY frontend ./

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]