'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function MobileMenu({userName, role, locationName, locationId, accessibleLocations = [], nav = [], active}){
  const [open,setOpen]=useState(false);
  const panelRef=useRef(null);

  useEffect(()=>{
    if(!open) return;
    const prev=document.body.style.overflow;
    document.body.style.overflow='hidden';
    const onKey=(e)=>{ if(e.key==='Escape') setOpen(false); };
    window.addEventListener('keydown',onKey);
    return ()=>{ document.body.style.overflow=prev; window.removeEventListener('keydown',onKey); };
  },[open]);

  return <div className="mobileMenuRoot">
    <button className="mobileMenuTrigger" type="button" aria-label="Open navigation" aria-expanded={open} onClick={()=>setOpen(true)}>☰</button>
    {open?<>
      <button className="mobileMenuBackdrop" type="button" aria-label="Close navigation" onClick={()=>setOpen(false)}/>
      <aside className="mobileMenuPanel" ref={panelRef} aria-label="Mobile navigation">
        <div className="mobileMenuHeading">
          <div className="mobileMenuUser"><b>{userName}</b><small>{role}{locationName?` • ${locationName}`:''}</small></div>
          <button className="mobileMenuClose" type="button" aria-label="Close navigation" onClick={()=>setOpen(false)}>×</button>
        </div>
        {accessibleLocations.length>1?<form action="/api/location/select" method="post" className="mobileLocationSwitch">
          <input type="hidden" name="returnTo" value="/dashboard"/>
          <label htmlFor="mobileLocationId">Working location</label>
          <select id="mobileLocationId" name="locationId" defaultValue={locationId}>{accessibleLocations.map(l=><option key={l.id} value={l.id}>{l.name} — {l.roleName}</option>)}</select>
          <button className="btn small mobileSwitchButton" type="submit">Switch</button>
        </form>:null}
        <form action="/search" className="mobileSearch"><input name="q" placeholder="Search everything..." aria-label="Global search"/></form>
        <nav className="mobileNav">{nav.map(([n,h])=><Link onClick={()=>setOpen(false)} key={n} className={active===n?'active':''} href={h}>{n}</Link>)}</nav>
      </aside>
    </>:null}
  </div>;
}
