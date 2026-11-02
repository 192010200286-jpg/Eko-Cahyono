import fs from 'fs';

const htmlPath = './index.html';
const html = fs.readFileSync(htmlPath, 'utf8');
const regex = /decodeURIComponent\("([^"]+)"\)/;
const match = html.match(regex);

if (match) {
    let decoded = decodeURIComponent(match[1]);

    const oldSelectRegex = /<option>IPS<\/option>\s*<option>PPKn<\/option>/;
    decoded = decoded.replace(oldSelectRegex, "<option>IPS</option>\n                                <option>Ilmu Pengetahuan Alam dan Sosial (IPAS)</option>\n                                <option>PPKn</option>");

    const oldArrayRegex = /'IPS',\s*'PPKn'/;
    decoded = decoded.replace(oldArrayRegex, "'IPS', 'Ilmu Pengetahuan Alam dan Sosial (IPAS)', 'PPKn'");

    const reEncoded = encodeURIComponent(decoded);
    const newHtml = html.replace(match[1], reEncoded);
    fs.writeFileSync(htmlPath, newHtml);
    console.log('Successfully updated subjects with regex.');
} else {
    console.log('Match not found');
}
