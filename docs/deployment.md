# Deployment

The app is intended to run at:

```txt
https://pitch-patch.bradstalcup.com
```

## Runtime

- Host: `pitch-patch.bradstalcup.com`
- App port: `3002`
- Process manager: PM2
- Reverse proxy: nginx
- TLS: Let's Encrypt certificate for `eguchi.evidentco.com`

## Required Environment

Set these for the PM2 process before relying on real auth/database behavior:

```bash
DATABASE_URL="postgres://eguchi_app:replace-with-db-password@localhost:5432/eguchi_pitch_training"
BETTER_AUTH_SECRET="replace-with-a-long-random-secret"
BETTER_AUTH_URL="https://pitch-patch.bradstalcup.com"
```

Use a long generated value for `BETTER_AUTH_SECRET` and a unique strong password for
`eguchi_app`. Do not run the app against the `postgres` superuser in production.

`https://pitch-patch.bradstalcup.com` is also listed in Better Auth's
`trustedOrigins` config so auth requests from the Cloudflare custom domain pass
origin validation.

## Database Rollout

Target production database and role:

```txt
Database: eguchi_pitch_training
Role: eguchi_app
Migration: scripts/db/0001_initial_auth_training.sql
```

Create the dedicated role and database before starting the production PM2 process:

```bash
ADMIN_DATABASE_URL='postgres://postgres:replace-with-admin-password@localhost:5432/postgres'
DB_PASSWORD='replace-with-strong-password'
psql "${ADMIN_DATABASE_URL}" -v ON_ERROR_STOP=1 -c "CREATE ROLE eguchi_app LOGIN PASSWORD '${DB_PASSWORD}';"
psql "${ADMIN_DATABASE_URL}" -v ON_ERROR_STOP=1 -c "CREATE DATABASE eguchi_pitch_training OWNER eguchi_app;"
```

Apply the initial migration as the app role:

```bash
PGPASSWORD="${DB_PASSWORD}" psql -h localhost -U eguchi_app -d eguchi_pitch_training -v ON_ERROR_STOP=1 -f scripts/db/0001_initial_auth_training.sql
```

Verify the schema and seed data:

```bash
PGPASSWORD="${DB_PASSWORD}" psql -h localhost -U eguchi_app -d eguchi_pitch_training -c "\dt"
PGPASSWORD="${DB_PASSWORD}" psql -h localhost -U eguchi_app -d eguchi_pitch_training -c "SELECT count(*) FROM chord_definitions;"
```

Expected seed count is `14`.

If the database or role already exists, stop and inspect ownership/privileges before
rerunning these commands. Do not drop or recreate production objects unless a backup
and rollback plan have been confirmed.

## Build And Start

```bash
cd /home/bstalcup/eguchi-pitch-training
npm run build
pm2 restart eguchi-pitch-training
```

If the PM2 process does not exist yet:

```bash
cd /home/bstalcup/eguchi-pitch-training
npm run build
pm2 start npm --name eguchi-pitch-training -- start -- --port 3002
pm2 save
```

After setting or changing PM2 environment variables, restart with the updated
environment:

```bash
pm2 restart eguchi-pitch-training --update-env
pm2 save
```

## nginx

The active nginx config is in:

```txt
/etc/nginx/conf.d/evident.conf
```

The `eguchi.evidentco.com` server block should proxy to:

```txt
http://127.0.0.1:3002
```

TLS certificate paths:

```txt
/etc/letsencrypt/live/eguchi.evidentco.com/fullchain.pem
/etc/letsencrypt/live/eguchi.evidentco.com/privkey.pem
```

After nginx edits:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Health Checks

```bash
curl -I http://127.0.0.1:3002
curl -I https://eguchi.evidentco.com
pm2 list
```

Expected result for both curl commands is an HTTP 200 response.

## Rollback Notes

- If the app fails after an environment change, restore the previous PM2 environment
  values and run `pm2 restart eguchi-pitch-training --update-env`.
- If the migration fails partway through, capture the exact error and inspect the
  database before retrying. The initial table/index creation and chord seed insert
  are written to tolerate reruns, but a failed production migration should still be
  reviewed before the app is pointed at it.
- Keep the previous deploy artifact or git revision available so the app can be
  rebuilt and restarted if the current revision fails health checks.
