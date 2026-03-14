const fs = require('fs');

const API_PREFIX = "`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}`";
const files = [
    'client/src/components/Dashboard.jsx',
    'client/src/components/Recordings.jsx',
    'client/src/components/Settings.jsx'
];

files.forEach(f => {
    let s = fs.readFileSync(f, 'utf8');

    // Restore from any previous bad edits that just turned it into '`/api/...'
    s = s.replace(/`\/api\/(.*?)`/g, `\`${API_PREFIX}/$1\``);
    s = s.replace(/'\/api\/(.*?)'/g, `\`${API_PREFIX}/$1\``);
    s = s.replace(/"\/api\/(.*?)"/g, `\`${API_PREFIX}/$1\``);

    // Replace the rest of absolute localhosts
    s = s.replace(/'http:\/\/localhost:5000\/api\/(.*?)'/g, `\`${API_PREFIX}/$1\``);
    s = s.replace(/"http:\/\/localhost:5000\/api\/(.*?)"/g, `\`${API_PREFIX}/$1\``);
    s = s.replace(/`http:\/\/localhost:5000\/api\/(.*?)`/g, `\`${API_PREFIX}/$1\``);

    fs.writeFileSync(f, s);
});
console.log("Done fixing files");