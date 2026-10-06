'use client';

import { useEffect } from 'react';

export default function MobileAccordionInit(){
  useEffect(()=>{
    const mq=window.matchMedia('(max-width: 650px)');
    if(!mq.matches) return;
    document.querySelectorAll('details.mobileAccordion').forEach((el)=>{ el.open=false; });
  },[]);
  return null;
}
