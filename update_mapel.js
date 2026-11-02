import fs from 'fs';

const htmlPath = './index.html';
const html = fs.readFileSync(htmlPath, 'utf8');
const regex = /decodeURIComponent\("([^"]+)"\)/;
const match = html.match(regex);

if (match) {
    let decoded = decodeURIComponent(match[1]);

    const oldSelectStr = `<option value="">-- Pilih Mata Pelajaran --</option>
                                <option>Bahasa Indonesia</option>
                                <option>Matematika</option>
                                <option>IPA</option>
                                <option>IPS</option>`;
    
    const newSelectStr = `<option value="">-- Pilih Mata Pelajaran --</option>
                                <option>Bahasa Indonesia</option>
                                <option>Matematika</option>
                                <option>IPA</option>
                                <option>IPS</option>
                                <option>Ilmu Pengetahuan Alam dan Sosial (IPAS)</option>`;
    
    decoded = decoded.replace(oldSelectStr, newSelectStr);

    const oldArrayStr = `'Bahasa Indonesia', 'Matematika', 'IPA', 'IPS', 'PPKn',
                'Bahasa Inggris', 'PJOK', 'Seni Budaya', 'Informatika'`;
                
    const newArrayStr = `'Bahasa Indonesia', 'Matematika', 'IPA', 'IPS', 'Ilmu Pengetahuan Alam dan Sosial (IPAS)', 'PPKn',
                'Bahasa Inggris', 'PJOK', 'Seni Budaya', 'Informatika'`;

    decoded = decoded.replace(oldArrayStr, newArrayStr);

    const reEncoded = encodeURIComponent(decoded);
    const newHtml = html.replace(match[1], reEncoded);
    fs.writeFileSync(htmlPath, newHtml);
    console.log('Successfully updated subjects.');
} else {
    console.log('Match not found');
}
