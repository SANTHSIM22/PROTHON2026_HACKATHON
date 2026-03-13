const fs = require('fs');
let s = fs.readFileSync('client/src/components/Dashboard.jsx', 'utf8');

// 1. Hide Settings button from non-organization users
s = s.replace(/<button\s*onClick=\{\(\) => navigate\('\/settings'\)\}\s*className="text-\[#8FA89F\]/g, 
  \{user?.role === 'organization' && (<button onClick={() => navigate('/settings')} className="text-[#8FA89F]\);
s = s.replace(/Settings\s*<\/button>/g, \Settings</button>)}\);

// 2. Hide Configure Settings button
s = s.replace(/<button\s*onClick=\{\(\) => navigate\('\/settings'\)\}\s*className="text-\[#D97706\]/g, 
  \{user?.role === 'organization' && (<button onClick={() => navigate('/settings')} className="text-[#D97706]\);
s = s.replace(/Configure →\s*<\/button>/g, \Configure →</button>)}\);
s = s.replace(/Configure \u2192\s*<\/button>/g, \Configure \u2192</button>)}\);


// 3. Add greeting and role logic
s = s.replace(/<h1 className="text-2xl font-bold text-white mb-2">Welcome/g, 
  \<h1 className="text-2xl font-bold text-white mb-2">Welcome, {user?.name || 'User'} ({user?.role || 'Guest'})\);

// 4. Wrap action sections so technical sees technical stuff, non-technical sees non-technical, organization sees all
// This part modifies the availableData rendering if it exists, or the dashboard cards.
// We will simply patch the component that renders the cards.
// Let's inject a filter before rendering the mapped elements, or wherever 'category' is used.
s = s.replace(/const getCategoryColor = \(category/g, \
  const allowedCategories = user?.role === 'organization' 
    ? ['technical', 'non-technical'] 
    : user?.role === 'technical' 
      ? ['technical'] 
      : ['non-technical'];

  const getCategoryColor = (category\);

// Find mapping array like \processedData?.technical?\ or similar UI elements and hide if not allowed
s = s.replace(/\{processedData\?.technical && \(/g, \{allowedCategories.includes('technical') && processedData?.technical && (\);
s = s.replace(/\{processedData\?.nonTechnical && \(/g, \{allowedCategories.includes('non-technical') && processedData?.nonTechnical && (\);

fs.writeFileSync('client/src/components/Dashboard.jsx', s);
console.log('Dashboard logic patched');
