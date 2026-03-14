const fs = require('fs');
let s = fs.readFileSync('client/src/components/Dashboard.jsx', 'utf8');

// Filter availableData list based on role
if (!s.includes('const filteredData = availableData')) {
  s = s.replace(/const \[availableData, setAvailableData\] = useState\(\[\]\);/g,
    \const [availableData, setAvailableData] = useState([]);
  
  const allowedCategories = user?.role === 'organization' ? ['technical', 'non-technical'] : (user?.role === 'technical' ? ['technical'] : ['non-technical']);
  const filteredData = availableData.filter(d => allowedCategories.includes(d.category));\
  );

  s = s.replace(/availableData\.map\(\(data, index\)/g, 'filteredData.map((data, index)');
  s = s.replace(/availableData\[selectedDataIndex\]/g, 'filteredData[selectedDataIndex]');
}

// Ensure the UI limits view panels
s = s.replace(/\{processedData\?.technical && \(/g, 
  \{allowedCategories.includes('technical') && processedData?.technical && (\
);

s = s.replace(/\{processedData\?.nonTechnical && \(/g, 
  \{allowedCategories.includes('non-technical') && processedData?.nonTechnical && (\
);

// Conditionally render Settings buttons based on role being organization
s = s.replace(/<button\s*onClick=\{\(\) => navigate\('\/settings'\)\}\s*className="text-\[#8FA89F\]/g, 
  \{user?.role === 'organization' && (<button onClick={() => navigate('/settings')} className="text-[#8FA89F]\);
s = s.replace(/Settings\s*<\/button>/g, \Settings</button>)}\);

// Optional greetings logic
s = s.replace(/<h1 className="text-2xl font-bold text-[#0C1A15] mb-2">Welcome/g, 
  \<h1 className="text-2xl font-bold text-[#0C1A15] mb-2">Welcome, {user?.name} ({user?.role})\
);

// Write changes
fs.writeFileSync('client/src/components/Dashboard.jsx', s);
