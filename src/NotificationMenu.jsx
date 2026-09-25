import React, { useMemo, useState } from 'react';
import { Bell, CalendarDays, FlaskConical, MessageCircle, Users, X } from 'lucide-react';

function readSeen(key){try{return localStorage.getItem(key)==='true'}catch{return false}}

export function NotificationMenu({user,bookings=[],onNavigate}){
  const key=`20x-notifications-seen:${user?.registration||user?.role||'guest'}`;
  const [open,setOpen]=useState(false);
  const [seen,setSeen]=useState(()=>readSeen(key));
  const items=useMemo(()=>user?.role==='management'?
    [
      {icon:CalendarDays,title:'Campus booking traffic',body:`${bookings.length} confirmed booking${bookings.length===1?'':'s'} in the campus database.`,target:'Admin overview'},
      {icon:FlaskConical,title:'Monthly facility report',body:'Review the busiest facilities, peak hours, and monthly usage.',target:'Monthly analysis'},
      {icon:CalendarDays,title:'Weekly schedule',body:'Publish class, reserved, and available hours for campus facilities.',target:'Admin overview'}
    ]:
    [
      {icon:MessageCircle,title:`${user?.department||'Department'} community`,body:'Department posts and project requests are ready in your community feed.',target:'Communities'},
      {icon:Users,title:'Cross-campus collaboration',body:'A water-quality hackathon team is inviting students from other departments.',target:'Communities'},
      {icon:CalendarDays,title:'Your facility bookings',body:bookings.length?`You have ${bookings.length} confirmed slot${bookings.length===1?'':'s'} in My bookings.`:'Browse lab schedules to find a bookable hour.',target:bookings.length?'My bookings':'Discover'}
    ],[user,bookings]);
  const toggle=()=>{const next=!open;setOpen(next);if(next){setSeen(true);try{localStorage.setItem(key,'true')}catch{}}};
  return <div className="notification-menu">
    <button className="icon-btn notification" onClick={toggle} aria-label="Notifications" aria-expanded={open}><Bell size={17}/>{!seen&&<i/>}</button>
    {open&&<section className="notification-popover" aria-label="Recent notifications"><div className="notification-heading"><div><b>Notifications</b><span>Recent campus updates</span></div><button onClick={()=>setOpen(false)} aria-label="Close notifications"><X size={16}/></button></div>{items.map((item,i)=>{const Icon=item.icon;return <button className="notification-item" key={i} onClick={()=>{onNavigate?.(item.target);setOpen(false)}}><span className="notification-icon"><Icon size={16}/></span><span><b>{item.title}</b><small>{item.body}</small></span></button>})}</section>}
  </div>;
}
