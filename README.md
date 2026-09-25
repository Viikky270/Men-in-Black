# 20X

20X is a campus resource, booking, student database, and community MVP.

## Run locally

Requires Node.js 22.5 or later (uses the built-in `node:sqlite` module) and pnpm or npm.

```sh
pnpm install
pnpm start
```

Open the local URL printed by Vite. Student accounts, bookings, and published schedule items are stored in `data/20x-campus.sqlite` and survive app restarts. To create a production build, run `pnpm build`.

## Student flow

- Create an account using a college registration number and select a department. Passwords are salted and hashed in the local SQLite database.
- Browse campus facilities, then choose a date from a resource's booking sheet. Each day shows hourly slots from 9 AM to 6 PM: red is class/in use, yellow is booked, and green is available.
- Selecting a green slot confirms the booking immediately. No staff approval step is used. Students can see and cancel their bookings.
- Open General or one of the department communities to share achievements, ask for project help, and post activities.
- Appreciate posts, add replies, share post links, and add collaboration help offers to My bookings.

## Management flow

- Management sign-in credentials are read only by the local server from `MANAGEMENT_DEMO_USERNAME` and `MANAGEMENT_DEMO_PASSWORD`. Set these in an ignored `.env` file or the server environment before signing in; they are never included in the browser bundle.
- Publish class, reserved, or available hours to the weekly timetable.
- Monitor confirmed booking traffic and inspect the student account directory.
- Open Monthly analysis for monthly booking traffic, most and least used resources, active students, unused facilities, peak day/hour, and daily trends.

## Demo boundaries

The SQLite database is local to the machine running this app. It does not sync between separate deployments or devices. The management demo login is not production authentication, and this local Vite API does not provide production-grade authorization or college identity verification. Before deployment, move the API to a secured server, connect college SSO, and configure a shared hosted database. Facility names, access rules, and sample schedule entries are illustrative.

## Stack

React, Vite, lucide-react, SQLite (`node:sqlite`), and custom responsive CSS.
