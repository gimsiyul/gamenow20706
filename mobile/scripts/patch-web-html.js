const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const distHtml = path.join(distDir, 'index.html');
const faviconSrc = path.join(__dirname, '..', 'assets', 'favicon.png');
const faviconDest = path.join(distDir, 'favicon.png');

if (!fs.existsSync(distHtml)) {
  console.error('dist/index.html 이 없습니다. 먼저 expo export 를 실행하세요.');
  process.exit(1);
}

if (fs.existsSync(faviconSrc)) {
  fs.copyFileSync(faviconSrc, faviconDest);
}

const raw = fs.readFileSync(distHtml, 'utf8');
const scriptMatch = raw.match(/<script[^>]+src="([^"]+)"[^>]*><\/script>/i);
const scriptSrc = scriptMatch ? scriptMatch[1] : '/_expo/static/js/web/index.js';

const html = `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <title>지금게임</title>
    <style>
      html, body {
        margin: 0;
        min-height: 100%;
        height: auto;
        background: #eaf0f6;
      }
      body {
        overflow-y: auto !important;
        overflow-x: hidden !important;
      }
      #root {
        display: block;
        min-height: 100vh;
        height: auto !important;
      }
    </style>
    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="apple-touch-icon" href="/favicon.png" />
  </head>
  <body>
    <noscript>이 사이트를 보려면 JavaScript가 필요합니다.</noscript>
    <div id="root"></div>
    <script src="${scriptSrc}" defer></script>
  </body>
</html>
`;

fs.writeFileSync(distHtml, html, 'utf8');
console.log('웹용 index.html 패치 완료:', scriptSrc);
