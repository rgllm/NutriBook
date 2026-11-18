# Keep in step with /.nvmrc.
FROM node:24.21.0-slim

ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# compose.yaml mounts ./frontend over /app, so the dev server picks up edits.
EXPOSE 3000
CMD ["pnpm", "dev", "--hostname", "0.0.0.0"]
