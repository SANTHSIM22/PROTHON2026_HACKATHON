const fs = require('fs');

let d = fs.readFileSync('client/src/components/Dashboard.jsx', 'utf8');

// Undo the blind replacement for Settings button
d = d.replace(/\{user\?\.role === 'organization' && \(\<button onClick=\{\(\) => navigate\('\/settings'\)\}/g, 
  \<button onClick={() => navigate('/settings')}\);
  
d = d.replace(/Settings<\/button>\)\}/g, \Settings</button>\);
d = d.replace(/Configure \u2192 Settings<\/button>\)\}/g, \Configure \u2192</button>\);

fs.writeFileSync('client/src/components/Dashboard.jsx', d);

