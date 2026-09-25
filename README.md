# 20X — Campus Resource & Community Hub

20X brings campus spaces, equipment, schedules, and student communities into one place. Students can find a lab or practice space, check its timetable, book an open hour, ask for collaborators across departments, and organize activities. College management can publish facility schedules and view basic traffic and usage reports.

> **Hackathon prototype:** campus resources, schedules, accounts, and posts in this repository are for demonstration. The app is not connected to a college identity provider or live campus systems.

## Contents

- The problem
- How 20X addresses it
- Student experience
- Management experience
- UX and interaction design
- Demo catalogue
- Technology and architecture
- Run it locally
- Management demo credentials
- Data and persistence
- API overview
- Build and share a temporary preview
- Hosting considerations
- Current limitations and next steps

## The problem

Campus facilities and student knowledge are often difficult to discover outside a student's own department. Equipment details may live in separate lists, lab schedules may be posted in different places, and students may have to ask several people before they know whether a space is available or what access training it requires.

The same fragmentation affects student collaboration. A project team may need skills held by students in another department, while someone looking for a study partner, music practice group, or casual basketball game may have no shared place to ask. Management also needs a clearer view of the facilities it coordinates and how students use them.

## How 20X addresses it

20X combines three campus tasks in one app:

1. **Discover resources:** browse equipment, labs, study rooms, and practice spaces with location, access notes, current status, and booking times.
2. **Find people and activities:** use department communities and a college-wide General community to share achievements, request project help, tag a department, and invite students to activities.
3. **Coordinate operations:** let management publish the facility timetable and review booking traffic and monthly usage summaries.

The prototype uses sample campus data so that the complete flow can be demonstrated without connecting to college systems.

## Student experience

### Sign in or create an account

Students register with a college registration number, department, and password. The server stores a salted password hash in SQLite. After signing in, the student sees the student workspace; management pages are shown only in the management view.

### Discover and match

The Discover page is the starting point for finding a facility. Students can search by facility name, type, or location, narrow the list by category, and open a resource to see its timetable. The “Find a match” flow accepts a plain-language need—such as a microscope, a quiet room, or a teammate—and compares it with the sample resource catalogue and sample student skills.

Resource cards surface the details students need to decide what to do next:

- Facility name, category, and campus location
- Current illustrative state and next listed opening
- Access note such as open access, lab induction, or safety training
- A direct path to choose a date and book an available hour

### Read the timetable and book

The booking sheet divides a day into hourly slots. Its colors communicate the slot state:

| Color | Meaning | Student action |
| --- | --- | --- |
| Red | Class or facility in use | Cannot book this hour |
| Yellow | Reserved or already booked | Cannot book this hour |
| Green | Available in the demo schedule | Can select and book this hour |

When a student chooses a green slot, the app submits the booking immediately—there is no staff approval step in this prototype. The booking appears in My bookings and is stored by the local API. Students can cancel a booking from that page.

### Connect through Communities

Communities has a General group and department groups. The selected department's feed is shown by default, and students can use the group selector and search to explore other communities. Posts support several campus use cases:

- **Project help:** describe a project or hackathon and ask for specific skills.
- **Competition/team requests:** find students who want to join a team.
- **Achievements:** share milestones and student work with the community.
- **Activity / meetup:** include a time, place, and optional capacity so other students can join or leave and see the attendee count.
- **Department tags:** direct a post to a particular department while keeping cross-department collaboration discoverable.

Students can appreciate a post, reply, share a link, join an activity, and offer help on an open collaboration post. Help offers and event sign-ups are shown in the student's My bookings/activity area.

## Management experience

The management portal is a separate role-specific workspace with its own navigation:

- **Admin overview:** inspect current booking traffic and operational summary information.
- **Weekly schedule:** add, update, or remove illustrative schedule entries and set a slot as a class/in-use period, reserved, or available.
- **Monthly analysis:** review bookings for a selected month, most and least used resources, number of active students, facilities with bookings, unused facilities, busiest day, peak time, and daily booking counts.
- **People & access:** inspect the student directory stored in the local database.

The management role is intended to post schedules and oversee operations. It does not approve individual student bookings.

## UX and interaction design

20X is organized around the decisions students and coordinators need to make, rather than around database records.

- **Start from the task:** the resource search and match flow helps answer “where can I do this?” before asking the student to navigate a catalogue.
- **Show availability at a glance:** red, yellow, and green states make occupied and bookable hours easy to distinguish before opening a booking form.
- **Keep the path short:** a student can move from a resource card to an hourly slot and confirm a booking without an approval queue.
- **Support cross-department discovery:** department groups preserve local context, while the General feed, cross-department posts, and department tags make collaboration beyond a student's home group visible.
- **Separate student and management tasks:** role-specific navigation keeps operational controls away from the student discovery flow.
- **Make status readable:** the timetable uses explicit state labels as well as color, while monthly analysis uses summary cards and readable resource comparisons.
- **Work on smaller screens:** the layout adapts its navigation, columns, cards, and timetable for narrower screens. The student and management sidebars collapse behind a menu on mobile widths.
- **Use a practical visual system:** white surfaces and a restrained campus palette use sunset orange (`#FF5841`) for primary actions and red-violet (`#C53678`) for selected and social states. Typography pairs DM Sans for interface text with Manrope for display headings and DM Mono for compact labels.

## Demo catalogue

### Sample facilities

The demo catalogue includes:

- **Labs and equipment:** Scanning Electron Microscope, Spectrophotometer, Confocal Microscope, Biomolecular Analyzer, Universal Testing Machine, Hydraulic Test Bench, Robotics Workbench, Digital Systems Lab, Mac Lab, Aerospace Systems Lab, Food Technology Pilot Plant, Agriculture Field Lab, Physiotherapy Skills Lab, and Mechatronics Prototyping Lab.
- **Creative and shared spaces:** Laser Cutter workshop, Visual Communication Studio, Architecture Design Studio, Moot Court Hall, Music Practice Hall, Dance Studio, and Quiet Study Room.
- **Other equipment:** 3D Printer Farm.

Facility locations, access notes, and availability are sample data; they do not represent verified campus operations.

### Sample department groups

The department selector includes CSE, ECE, ESE, Bio Tech, BCA, BBA, Aero Space, Food Technology, Mechanical, Civil, Automobile, Agri, Chemical, Architectural, Mechatronics, Robotics, Law, Physio, Commerce, Mathematics, Physics, Chemistry, Visual Communication, Design & Innovation, English, Psychology, and Environmental Science, plus General.

## Technology and architecture

| Layer | Current implementation |
| --- | --- |
| UI | React, JSX, Lucide icons, and responsive custom CSS |
| Build and local web server | Vite with the React plugin |
| Demo API | API routes attached to Vite's development and preview servers |
| Student accounts, bookings, schedules, analytics | SQLite through Node.js's built-in `node:sqlite` module |
| Community posts and per-student interactions | Browser `localStorage` |
| Password hashing | Node.js `scrypt` with a random salt for student account passwords |

The API and frontend are served from the same origin, so the UI calls relative paths such as `/api/bookings` and `/api/schedules`. The local database is created and initialized by the server configuration. Initial schedule rows and sample bookings make the demo useful on a fresh local run.

## Run it locally

### Requirements

- Node.js **22.5 or later** (the app uses the built-in `node:sqlite` module)
- pnpm (recommended; a `pnpm-lock.yaml` is included) or npm

### Start the development server

From the project root:

```sh
pnpm install
pnpm start
```

Open the local address Vite prints in the terminal. The development server uses port `5175` by default.

With npm, use:

```sh
npm install
npm run start
```

### Create and preview a production build

```sh
pnpm build
pnpm preview
```

`pnpm build` writes optimized frontend assets to `dist/`. `pnpm preview` serves those built assets locally and uses the Vite preview API hook for the demo backend. The preview command uses port `5175` in this project.

## Management demo credentials

The management portal reads its credentials on the server from environment variables. Create a `.env` file in the project root for local use:

```dotenv
MANAGEMENT_DEMO_USERNAME=your-demo-user
MANAGEMENT_DEMO_PASSWORD=use-a-private-demo-password
```

Restart the server after changing `.env`. The file is excluded by `.gitignore`; do not commit it or paste real credentials into the README. These credentials are for the hackathon demo, not an institutional management identity system.

## Data and persistence

The application currently stores different data in different places:

| Data | Storage | What that means |
| --- | --- | --- |
| Student registration numbers, departments, and password hashes | `data/20x-campus.sqlite` | Stored on the machine running the app; the SQLite file is excluded from Git. |
| Resource bookings and management schedule entries | `data/20x-campus.sqlite` | Shared by browser sessions that reach this same running server and database. |
| Resource schedule sample rows | Seeded into SQLite | Illustrative availability is created for the demo. |
| Community posts | Browser `localStorage` | Posts are available in the browser profile where they were created, not automatically across devices. |
| Reactions, replies, RSVPs, and help offers | Browser `localStorage`, keyed by student registration | These interactions are separated by account in that browser profile, but are not a shared campus feed across browsers. |
| Login session | Browser storage/UI state | This prototype does not issue a production-grade secure session token. |

The local SQLite file, `.env`, `node_modules/`, and `dist/` are ignored by Git. The database should not be copied into the public repository.

## API overview

The Vite server provides the demo API used by the React interface:

| Method and path | Purpose |
| --- | --- |
| `POST /api/students/register` | Create a student account and salted password hash. |
| `POST /api/students/login` | Verify student registration number and password. |
| `POST /api/management/login` | Verify management demo credentials. |
| `GET /api/students` | Return the student directory for the management view. |
| `GET /api/bookings?student=<registration>` | List a student's bookings; without the query, list all demo bookings. |
| `POST /api/bookings` | Book a resource and time slot. |
| `DELETE /api/bookings/:id` | Cancel a booking. |
| `GET /api/schedules` | Read weekly schedule entries. |
| `POST /api/schedules` | Publish a schedule entry. |
| `DELETE /api/schedules/:id` | Remove a schedule entry. |
| `GET /api/traffic` | Return total traffic and booking counts by resource. |
| `GET /api/analytics/monthly?month=YYYY-MM` | Return monthly usage, resource rankings, peak period, and daily counts. |

## Build and share a temporary preview

For a temporary Cloudflare Quick Tunnel preview, first build the site and start the production preview server:

```sh
pnpm build
pnpm preview
```

In another terminal, point `cloudflared` directly to the IPv4 loopback address:

```sh
cloudflared tunnel --url http://127.0.0.1:5175
```

Use the HTTPS URL printed by Cloudflare. Quick Tunnel addresses are temporary and change when a new tunnel is created. The local app and tunnel process must both stay running, and the current tunnel hostname must be allowed in Vite's `preview.allowedHosts` configuration. This is useful for a demo, but it is not a permanent hosted deployment.

## Hosting considerations

`pnpm build` creates the frontend files, but the current app is **not frontend-only**. Accounts, booking operations, schedules, and analytics depend on the Node API and SQLite database. A static-only deployment—such as uploading `dist/` by itself—can display the page but will not provide those API operations.

To host the complete demo, deploy a Node.js service that runs the Vite preview API and serves `dist/`, use Node 22.5 or later, configure the management environment variables, and give the SQLite database persistent storage. If choosing a serverless/static platform, the API must be moved into that platform's server functions and SQLite must be replaced with a supported hosted database. The application has not yet been adapted for Netlify, Vercel, or Cloudflare Workers/D1.

## Current limitations and next steps

20X demonstrates the campus workflow, but it is not ready for real student records or production operations:

- Facility inventory, eligibility rules, room locations, sample traffic, and schedules need confirmation from the college.
- Student identity is self-registered; there is no college SSO or registration-number verification.
- The management demo login is not a complete authorization system. Several data APIs are intended for a local demonstration and do not enforce production role permissions.
- Community posts and interactions live in each browser's local storage; students on other devices do not see a shared live feed.
- SQLite is local to one server instance. There is no hosted multi-instance database, backups, or cross-campus synchronization.
- There are no push notifications, email notifications, or integrations with real lab equipment and access systems.

Before a campus-wide launch, the next steps are to add server-enforced role-based authorization, connect a shared hosted database with backups, integrate the college's identity provider, centralize community data, define verified facility access rules, and add moderation and notification workflows.

---

Built as a hackathon prototype for campus resource discovery, student collaboration, and facility operations.
