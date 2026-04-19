export const exportElementToPDF = async (elementId, fileName = 'report') => {
  const element = document.getElementById(elementId);
  if (!element) return false;

  try {
    // Collect all stylesheets from the parent document
    const styleNodes = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(node => node.outerHTML)
      .join('\n');

    // Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '-10000px';
    iframe.style.bottom = '-10000px';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;

    // We add specific print CSS to handle table pagination natively!
    const printCSS = `
      <style>
        @page {
          size: A4 landscape;
          margin: 10mm;
        }
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          background-color: white !important;
          direction: rtl;
          font-family: inherit;
        }
        
        /* Prevent elements from being cut in half */
        tr, li, .card, img, svg {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Repeat table headers on every page */
        thead {
          display: table-header-group !important;
        }
        
        /* Ensure tables break properly */
        table {
          page-break-inside: auto !important;
          width: 100% !important;
          border-collapse: collapse !important;
        }

        /* Fix cropped tables */
        .overflow-x-auto, .overflow-y-auto, .overflow-hidden {
          overflow: visible !important;
          max-height: none !important;
        }
        
        /* Hide UI buttons you don't want exported */
        button {
          display: none !important;
        }
      </style>
    `;

    doc.open();
    doc.write(`
      <html dir="rtl" class="light">
        <head>
          <title>${fileName}</title>
          <meta charset="utf-8">
          ${styleNodes}
          ${printCSS}
        </head>
        <body class="p-8">
          ${element.outerHTML}
        </body>
      </html>
    `);
    doc.close();

    // Wait for the iframe's content to load perfectly before printing
    return new Promise((resolve) => {
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          document.body.removeChild(iframe);
          resolve(true);
        }, 800); // Give fonts & charts a moment to render
      };

      // Fallback in case onload doesn't fire nicely
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          document.body.removeChild(iframe);
          resolve(true);
        }
      }, 1500);
    });

  } catch (err) {
    console.error('Error exporting PDF via native print:', err);
    return false;
  }
};
