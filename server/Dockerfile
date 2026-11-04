# Build context is the repo root (npm workspaces share one lockfile).
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci --omit=dev -w server --include-workspace-root=false && npm cache clean --force

COPY server/src server/src

USER node
EXPOSE 5000
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5000/health || exit 1
CMD ["node", "server/src/server.js"]
