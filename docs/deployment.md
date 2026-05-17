# Deployment

The app is intended to run at:

```txt
https://eguchi.evidentco.com
```

## Runtime

- Host: `eguchi.evidentco.com`
- App port: `3002`
- Process manager: PM2
- Reverse proxy: nginx
- TLS: Let's Encrypt certificate for `eguchi.evidentco.com`

## Required Environment

Set these for the PM2 process before relying on real auth/database behavior:

```bash
DATABASE_URL="postgres://postgres:postgres@localhost:5432/eguchi_pitch_training"
BETTER_AUTH_SECRET="replace-with-a-long-random-secret"
BETTER_AUTH_URL="https://eguchi.evidentco.com"
```

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
