import type {Metadata} from 'next';
import {getMe} from '@/lib/session';
import {redirect} from 'next/navigation';
import DeliveryWorkspace,{type DeliveryOption} from '@/components/DeliveryWorkspace';
import {DESTINATIONS,connectionFor} from '@/lib/delivery';
import {canDeliver,deliverySettings,recentDeliveryJobs} from '@/lib/deliveryServer';
import './delivery.css';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Deliver to your tools',robots:{index:false,follow:false}};
export default async function IntegrationsPage(){
  const me=await getMe();if(!me)redirect('/sign-in');
  const names={hubspot:'HubSpot',salesforce:'Salesforce',smartlead:'Smartlead',instantly:'Instantly'};
  const connections:DeliveryOption[]=DESTINATIONS.map(destination=>{
    try{const settings=deliverySettings();const c=connectionFor(settings.connections,me.org.id,destination);return {destination,name:names[destination],label:c?.label||'',configured:!!c};}
    catch{return {destination,name:names[destination],label:'',configured:false};}
  });
  const {jobs,available}=await recentDeliveryJobs();
  return <main className="wrap section"><p className="eyebrow">Your connected workspace</p><h1>Put your selected data to work.</h1><p className="lead">Review your audience, choose your destination, and keep a record of every delivery.</p><DeliveryWorkspace connections={connections} jobs={jobs} permitted={canDeliver(me)} available={available}/></main>;
}
