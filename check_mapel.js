import fs from 'fs';

const htmlPath = './index.html';
const html = fs.readFileSync(htmlPath, 'utf8');
const regex = /decodeURIComponent\("([^"]+)"\)/;
const match = html.match(regex);

if (match) {
    let decoded = decodeURIComponent(match[1]);
    console.log(decoded.includes('IPAS'));
}
