export function getServiceStatus(interval,currentHours,now=new Date()){
  const remainingHours = interval.hoursValue == null || interval.lastServiceHours == null ? null : (interval.lastServiceHours + interval.hoursValue - currentHours);
  const remainingDays = interval.daysValue == null || !interval.lastServiceDate ? null : Math.ceil((new Date(interval.lastServiceDate).getTime()+interval.daysValue*86400000-now.getTime())/86400000);
  const vals=[remainingHours,remainingDays].filter(v=>v!=null);
  if(!vals.length) return {key:'not_set',label:'Not set',remainingHours,remainingDays};
  const min=Math.min(...vals);
  if(min<0) return {key:'overdue',label:'Overdue',remainingHours,remainingDays};
  const hourDue = remainingHours!=null && remainingHours<=100;
  const dayDue = remainingDays!=null && remainingDays<=30;
  if(hourDue||dayDue) return {key:'due_soon',label:'Due Soon',remainingHours,remainingDays};
  return {key:'on_track',label:'On Track',remainingHours,remainingDays};
}
