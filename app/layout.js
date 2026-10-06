import './globals.css';
export const dynamic='force-dynamic';
export const metadata={
  title:'OT Equipment',
  description:'Omaha Track Equipment parts, inventory and service',
  icons:{
    icon:[{url:'/favicon.ico?v=45',type:'image/x-icon'},{url:'/icon.png?v=45',type:'image/png',sizes:'512x512'}],
    shortcut:'/favicon.ico?v=45',
    apple:[{url:'/apple-touch-icon.png?v=45',sizes:'180x180',type:'image/png'}]
  }
};
export const viewport={width:'device-width',initialScale:1};
export default function RootLayout({children}){return <html lang="en"><body>{children}</body></html>}
