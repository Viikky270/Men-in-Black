import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { DatabaseSync } from 'node:sqlite';
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const dbPath = resolve(process.cwd(), 'data', '20x-campus.sqlite');
mkdirSync(dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS students (
    registration TEXT PRIMARY KEY,
    department TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    registration TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    resource_name TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(resource_id, date, time)
  );
  CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    day INTEGER NOT NULL,
    time TEXT NOT NULL,
    title TEXT NOT NULL,
    space TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    state TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`);
const scheduleCount = db.prepare('SELECT COUNT(*) AS n FROM schedules').get().n;
if (scheduleCount === 0) {
  const seed = db.prepare('INSERT INTO schedules (id, day, time, title, space, resource_id, state) VALUES (?, ?, ?, ?, ?, ?, ?)');
  [
    ['s1',0,'9 AM','SEM orientation','Materials Science · Lab 204','sem','ongoing'],
    ['s2',0,'1 PM','Dance rehearsal','Arts · Studio 2','dance','reserved'],
    ['s3',1,'10 AM','Study group','Main Library · Room 3B','study','available'],
    ['s4',2,'11 AM','Cell imaging','Bio Tech · Core Facility','confocal','ongoing'],
    ['s5',2,'3 PM','Music practice','Student Center · Music Wing','music','reserved'],
    ['s6',3,'2 PM','Open maker lab','CSE · Maker Space','printer','available'],
    ['s7',4,'12 PM','Quiet study block','Main Library · Room 3B','study','reserved']
  ].forEach(row=>seed.run(...row));
}
const sampleSchedules = db.prepare('INSERT OR IGNORE INTO schedules (id, day, time, title, space, resource_id, state) VALUES (?, ?, ?, ?, ?, ?, ?)');
for (let day=0; day<7; day++) {
  [
    [`sample-sem-${day}`,day,'10 AM','Microscopy lab class','Materials Science · Lab 204','sem','ongoing'],
    [`sample-digital-${day}`,day,'1 PM','Digital systems practical','CSE · Block A, Lab 201','digital','ongoing'],
    [`sample-aero-${day}`,day,'3 PM','Flight systems class','Aero Space · Flight Systems Block','aerospace','ongoing'],
    [`sample-laser-${day}`,day,'11 AM','Prototype equipment booking','Design & Innovation · Workshop','laser','reserved'],
    [`sample-mac-${day}`,day,'2 PM','Media lab reservation','Visual Communication · Media Wing','maclab','reserved'],
    [`sample-study-${day}`,day,'4 PM','Quiet study reservation','Main Library · Room 3B','study','reserved'],
    [`sample-music-${day}`,day,'5 PM','Music hall reservation','Student Center · Music Wing','music','reserved']
  ].forEach(row=>sampleSchedules.run(...row));
}
const availabilitySeeded = db.prepare('SELECT value FROM app_meta WHERE key = ?').get('availability-v1');
if (!availabilitySeeded) {
const demoResources = [
  ['sem','Scanning Electron Microscope','Materials Science · Lab 204'],['laser','Laser Cutter','Design & Innovation · Workshop'],['spectro','Spectrophotometer','Chemistry · Lab 118'],['printer','3D Printer Farm','CSE · Maker Space'],['confocal','Confocal Microscope','Bio Tech · Core Facility'],['utm','Universal Testing Machine','Civil · Lab 06'],['music','Music Practice Hall','Student Center · Music Wing'],['dance','Dance Studio','Arts Building · Studio 2'],['study','Quiet Study Room','Main Library · Room 3B'],['bioanalyzer','Biomolecular Analyzer','Bio Tech · Lab 112'],['hydraulic','Hydraulic Test Bench','Civil · Lab 09'],['robotics','Robotics Workbench','Robotics · Lab 3'],['digital','Digital Systems Lab','CSE · Block A, Lab 201'],['maclab','Mac Lab','Visual Communication · Media Wing'],['viscom','Visual Communication Studio','Visual Communication · Studio 2'],['aerospace','Aerospace Systems Lab','Aero Space · Flight Systems Block'],['foodtech','Food Technology Pilot Plant','Food Technology · Process Lab'],['agri','Agriculture Field Lab','Agri · Greenhouse'],['physio','Physiotherapy Skills Lab','Physio · Health Sciences'],['law','Moot Court Hall','Law · Academic Block C'],['architecture','Architecture Design Studio','Architectural · Design Block'],['mechatronics','Mechatronics Prototyping Lab','Mechatronics · Engineering Block']
];
const timetableHours=['9 AM','10 AM','11 AM','12 PM','1 PM','2 PM','3 PM','4 PM','5 PM'];
const findSchedule = db.prepare('SELECT id FROM schedules WHERE day = ? AND resource_id = ? AND time = ?');
const normalizeSchedule = db.prepare('UPDATE schedules SET title = ?, space = ?, state = ? WHERE day = ? AND resource_id = ? AND time = ?');
const addSchedule = db.prepare('INSERT INTO schedules (id, day, time, title, space, resource_id, state) VALUES (?, ?, ?, ?, ?, ?, ?)');
for (let day=0; day<7; day++) {
  demoResources.forEach(([resourceId,name,space],resourceIndex)=>timetableHours.forEach((time,hourIndex)=>{
    const offset=resourceIndex+hourIndex+day;
    const sampleBooked=(day===4&&((resourceId==='laser'&&hourIndex===2)||(resourceId==='study'&&hourIndex===7)||(resourceId==='music'&&hourIndex===8)));
    const state=sampleBooked?'reserved':offset%3===0?'available':offset%2===0?'ongoing':'reserved';
    const title=state==='available'?'Open for student booking':state==='ongoing'?'Scheduled class / lab': 'Student reservation';
    const existing=findSchedule.all(day,resourceId,time);
    if(existing.length) normalizeSchedule.run(title,space,state,day,resourceId,time);
    else addSchedule.run(`hour-${day}-${resourceId}-${hourIndex}`,day,time,title,space,resourceId,state);
  }));
}
db.prepare('INSERT INTO app_meta (key, value) VALUES (?, ?)').run('availability-v1','seeded');
}
if (db.prepare('SELECT COUNT(*) AS n FROM bookings').get().n === 0) {
  const sampleBooking = db.prepare('INSERT OR IGNORE INTO bookings (id, registration, resource_id, resource_name, date, time) VALUES (?, ?, ?, ?, ?, ?)');
  [
    ['sample-booking-1','DEMO','laser','Laser Cutter','2026-09-25','11 AM – 12 PM'],
    ['sample-booking-2','DEMO','study','Quiet Study Room','2026-09-25','4 PM – 5 PM'],
    ['sample-booking-3','DEMO','music','Music Practice Hall','2026-09-25','5 PM – 6 PM']
  ].forEach(row=>sampleBooking.run(...row));
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}
async function body(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}
const analyticsResources = [
  ['sem','Scanning Electron Microscope'],['laser','Laser Cutter'],['spectro','Spectrophotometer'],['printer','3D Printer Farm'],['confocal','Confocal Microscope'],['utm','Universal Testing Machine'],['music','Music Practice Hall'],['dance','Dance Studio'],['study','Quiet Study Room'],['bioanalyzer','Biomolecular Analyzer'],['hydraulic','Hydraulic Test Bench'],['robotics','Robotics Workbench'],['digital','Digital Systems Lab'],['maclab','Mac Lab'],['viscom','Visual Communication Studio'],['aerospace','Aerospace Systems Lab'],['foodtech','Food Technology Pilot Plant'],['agri','Agriculture Field Lab'],['physio','Physiotherapy Skills Lab'],['law','Moot Court Hall'],['architecture','Architecture Design Studio'],['mechatronics','Mechatronics Prototyping Lab']
];
function safeEqual(value, expected) {
  const actualBuffer = Buffer.from(String(value || ''));
  const expectedBuffer = Buffer.from(String(expected || ''));
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}
function routeApi(server, managementCredentials) {
  server.middlewares.use(async (req, res, next) => {
    const url = new URL(req.url || '/', 'http://localhost');
    if (!url.pathname.startsWith('/api/')) return next();
    try {
      if (req.method === 'POST' && url.pathname === '/api/management/login') {
        if (!managementCredentials.username || !managementCredentials.password) {
          return send(res, 503, { error: 'Management demo sign-in is not configured on the server.' });
        }
        const { username, password } = await body(req);
        if (!safeEqual(username, managementCredentials.username) || !safeEqual(password, managementCredentials.password)) {
          return send(res, 401, { error: 'Management user ID or password did not match.' });
        }
        return send(res, 200, { ok: true });
      }
      if (req.method === 'POST' && url.pathname === '/api/students/register') {
        const { registration, department, password } = await body(req);
        const id = String(registration || '').trim().toUpperCase();
        if (!id || !department || String(password || '').length < 6) return send(res, 400, { error: 'Enter your registration number, department, and a password of at least 6 characters.' });
        const salt = randomBytes(16).toString('hex');
        const hash = scryptSync(String(password), salt, 64).toString('hex');
        try {
          db.prepare('INSERT INTO students (registration, department, password_salt, password_hash) VALUES (?, ?, ?, ?)').run(id, department, salt, hash);
        } catch { return send(res, 409, { error: 'That registration number already has an account. Sign in instead.' }); }
        return send(res, 201, { registration: id, department });
      }
      if (req.method === 'POST' && url.pathname === '/api/students/login') {
        const { registration, password } = await body(req);
        const id = String(registration || '').trim().toUpperCase();
        const row = db.prepare('SELECT registration, department, password_salt, password_hash FROM students WHERE registration = ?').get(id);
        if (!row || !password) return send(res, 401, { error: 'No matching account. Check your details or create an account.' });
        const hash = scryptSync(String(password), row.password_salt, 64);
        if (!timingSafeEqual(hash, Buffer.from(row.password_hash, 'hex'))) return send(res, 401, { error: 'No matching account. Check your details or create an account.' });
        return send(res, 200, { registration: row.registration, department: row.department });
      }
      if (req.method === 'GET' && url.pathname === '/api/students') {
        const students = db.prepare('SELECT registration, department, created_at AS createdAt FROM students ORDER BY created_at DESC').all();
        return send(res, 200, students);
      }
      if (req.method === 'GET' && url.pathname === '/api/bookings') {
        const registration = url.searchParams.get('student');
        const bookings = registration
          ? db.prepare('SELECT id, registration AS student, resource_id AS resourceId, resource_name AS name, date, time, \'Booked\' AS status FROM bookings WHERE registration = ? ORDER BY date, time').all(registration)
          : db.prepare('SELECT id, registration AS student, resource_id AS resourceId, resource_name AS name, date, time, \'Booked\' AS status FROM bookings ORDER BY date, time').all();
        return send(res, 200, bookings);
      }
      if (req.method === 'POST' && url.pathname === '/api/bookings') {
        const { registration, resourceId, name, date, time } = await body(req);
        if (!registration || !resourceId || !name || !date || !time) return send(res, 400, { error: 'Booking details are incomplete.' });
        if (!db.prepare('SELECT registration FROM students WHERE registration = ?').get(registration)) return send(res, 401, { error: 'Sign in with a student account before booking.' });
        const day = (new Date(`${date}T12:00:00`).getDay() + 6) % 7;
        const match = String(time).match(/(\d{1,2})(?::\d{2})?\s*(AM|PM)/i);
        if (match) {
          let wantedHour = Number(match[1]) % 12;
          if (match[2].toUpperCase() === 'PM') wantedHour += 12;
          const dayEntries = db.prepare('SELECT time, state FROM schedules WHERE resource_id = ? AND day = ? ORDER BY rowid').all(resourceId, day);
          const occupied = dayEntries.filter(entry => {
            const parsed = String(entry.time).match(/(\d{1,2})(?::\d{2})?\s*(AM|PM)/i);
            if (!parsed) return false;
            let hour = Number(parsed[1]) % 12;
            if (parsed[2].toUpperCase() === 'PM') hour += 12;
            return hour === wantedHour;
          }).at(-1);
          if (occupied && occupied.state !== 'available') return send(res, 409, { error: 'Management has marked that hour as in use. Choose a green hour.' });
        }
        const id = randomBytes(12).toString('hex');
        try { db.prepare('INSERT INTO bookings (id, registration, resource_id, resource_name, date, time) VALUES (?, ?, ?, ?, ?, ?)').run(id, registration, resourceId, name, date, time); }
        catch { return send(res, 409, { error: 'That slot has just been booked. Please choose another hour.' }); }
        return send(res, 201, { id, student: registration, resourceId, name, date, time, status: 'Booked' });
      }
      if (req.method === 'DELETE' && url.pathname.startsWith('/api/bookings/')) {
        db.prepare('DELETE FROM bookings WHERE id = ?').run(decodeURIComponent(url.pathname.split('/').pop()));
        return send(res, 200, { ok: true });
      }
      if (req.method === 'GET' && url.pathname === '/api/traffic') {
        const totals = db.prepare('SELECT COUNT(*) AS bookings, COUNT(DISTINCT registration) AS students, COUNT(DISTINCT resource_id) AS resourcesInUse FROM bookings').get();
        const byResource = db.prepare('SELECT resource_name AS resource, COUNT(*) AS bookings FROM bookings GROUP BY resource_id ORDER BY bookings DESC LIMIT 8').all();
        return send(res, 200, { ...totals, byResource });
      }
      if (req.method === 'GET' && url.pathname === '/api/analytics/monthly') {
        const supplied = url.searchParams.get('month') || new Date().toISOString().slice(0,7);
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(supplied)) return send(res, 400, { error: 'Use a month in YYYY-MM format.' });
        const [year,monthNumber]=supplied.split('-').map(Number);
        const start=`${supplied}-01`, nextDate=new Date(Date.UTC(year,monthNumber,1)), end=nextDate.toISOString().slice(0,10), daysInMonth=new Date(Date.UTC(year,monthNumber,0)).getUTCDate();
        const monthlyRows=db.prepare('SELECT registration, resource_id AS resourceId, resource_name AS resource, date, time FROM bookings WHERE date >= ? AND date < ? ORDER BY date, time').all(start,end);
        const counts=new Map();for(const booking of monthlyRows)counts.set(booking.resourceId,(counts.get(booking.resourceId)||0)+1);
        const byResource=analyticsResources.map(([id,name])=>({id,name,bookings:counts.get(id)||0})).sort((a,b)=>b.bookings-a.bookings||a.name.localeCompare(b.name));
        const dailyMap=new Map();for(const booking of monthlyRows)dailyMap.set(booking.date,(dailyMap.get(booking.date)||0)+1);
        const daily=Array.from({length:daysInMonth},(_,i)=>({day:i+1,bookings:dailyMap.get(`${supplied}-${String(i+1).padStart(2,'0')}`)||0}));
        const busiestDay=[...daily].sort((a,b)=>b.bookings-a.bookings)[0];
        const timeMap=new Map();for(const booking of monthlyRows){const label=booking.time.split(' – ')[0];timeMap.set(label,(timeMap.get(label)||0)+1)}
        const peakTime=[...timeMap].sort((a,b)=>b[1]-a[1])[0]||null;
        const occupied=byResource.filter(x=>x.bookings>0);
        return send(res,200,{month:supplied,bookings:monthlyRows.length,students:new Set(monthlyRows.map(x=>x.registration)).size,resourcesBooked:occupied.length,totalResources:analyticsResources.length,topResource:occupied[0]||null,leastUsed:byResource.at(-1)||null,unusedResources:byResource.filter(x=>x.bookings===0).length,busiestDay:busiestDay?.bookings?busiestDay:null,peakTime,byResource,daily});
      }
      if (req.method === 'GET' && url.pathname === '/api/schedules') return send(res, 200, db.prepare('SELECT id, day, time, title, space, resource_id AS resourceId, state FROM schedules ORDER BY rowid').all());
      if (req.method === 'POST' && url.pathname === '/api/schedules') {
        const item = await body(req);
        if (!item.id || !item.resourceId || !item.time || !item.title || !item.space) return send(res, 400, { error: 'Schedule details are incomplete.' });
        db.prepare('INSERT INTO schedules (id, day, time, title, space, resource_id, state) VALUES (?, ?, ?, ?, ?, ?, ?)').run(item.id, item.day, item.time, item.title, item.space, item.resourceId, item.state);
        return send(res, 201, item);
      }
      if (req.method === 'DELETE' && url.pathname.startsWith('/api/schedules/')) {
        db.prepare('DELETE FROM schedules WHERE id = ?').run(decodeURIComponent(url.pathname.split('/').pop()));
        return send(res, 200, { ok: true });
      }
      return send(res, 404, { error: 'API route not found.' });
    } catch (error) {
      console.error('20X API error:', error);
      return send(res, 500, { error: 'The local campus database could not complete that operation.' });
    }
  });
}

export default defineConfig(({ mode }) => {
  const serverEnv = loadEnv(mode, process.cwd(), '');
  const managementCredentials = {
    username: serverEnv.MANAGEMENT_DEMO_USERNAME || process.env.MANAGEMENT_DEMO_USERNAME || '',
    password: serverEnv.MANAGEMENT_DEMO_PASSWORD || process.env.MANAGEMENT_DEMO_PASSWORD || ''
  };
  return { plugins: [react(), {
    name: '20x-campus-api',
    configureServer: server => routeApi(server, managementCredentials),
    configurePreviewServer: server => routeApi(server, managementCredentials)
  }] };
});
