export default function loadGAScript({ sampleRUM, gaId }) {
  window.setTimeout(() => {
    const scriptGA = document.createElement('script');
    scriptGA.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.prepend(scriptGA);

    const scriptTag = document.createElement('script');
    scriptTag.innerHTML = `
  // Google Analytics
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${gaId}');
  `;
    document.head.prepend(scriptTag);
  }, 500);
}
