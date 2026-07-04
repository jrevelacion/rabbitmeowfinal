import { useEffect } from 'react';

const Ads = () => {
  useEffect(() => {
    // Add the external script dynamically
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.dataset.cfasync = 'false';
    script.innerHTML = `
      /*<![CDATA[/* */
      (function(){var o=window,q="b896aeb3a17639ab1f2fde0bd9797e69",v=[["siteId",326+316+873-858+754+5304357],["minBid",0],["popundersPerIP","0"],["delayBetween",0],["default",false],["defaultPerDay",0],["topmostLayer","auto"]],b=["d3d3LmNkbjRhZHMuY29tL1VpSnhBaS9zRmZCYy9hY29yZS5qcw==","ZDNnNW92Zm5nanc5YncuY2xvdWRmcm9udC5uZXQvcGluay1hbGwubWluLmpz"],p=-1,l,s,w=function(){clearTimeout(s);p++;if(b[p]&&!(1806775417000<(new Date).getTime()&&1<p)){l=o.document.createElement("script");l.type="text/javascript";l.async=!0;var t=o.document.getElementsByTagName("script")[0];l.src="https://"+atob(b[p]);l.crossOrigin="anonymous";l.onerror=w;l.onload=function(){clearTimeout(s);o[q.slice(0,16)+q.slice(0,16)]||w()};s=setTimeout(w,5E3);t.parentNode.insertBefore(l,t)}};if(!o[q]){try{Object.freeze(o[q]=v)}catch(e){}w()}})();
      /*]]>/* */
    `;
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return null;
};

export default Ads;
