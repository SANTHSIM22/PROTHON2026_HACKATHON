const fs = require('fs');
let s = fs.readFileSync('client/src/components/Signup.jsx', 'utf8');

s = s.replace(/const \[confirmPassword,\s*setConfirmPassword\]\s*=\s*useState\(''\);/, 
\const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('technical');
  const [organizationEmail, setOrganizationEmail] = useState('');\);

s = s.replace(/signup\(\s*name,\s*email,\s*password,\s*confirmPassword\s*\);/, 'signup(name, email, password, confirmPassword, role, organizationEmail);');

const formAddition = \
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-white outline-none transition-all"
              >
                <option value="technical">Technical</option>
                <option value="non-technical">Non-technical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Organization Email</label>
              <input
                type="email"
                value={organizationEmail}
                onChange={(e) => setOrganizationEmail(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-white outline-none transition-all"
                placeholder="org@example.com"
                required
              />
            </div>\;

s = s.replace(/<div>\s*<label htmlFor="confirmPassword"[\s\S]*?<\/div>/, match => match + formAddition);

fs.writeFileSync('client/src/components/Signup.jsx', s);

let l = fs.readFileSync('client/src/components/Login.jsx', 'utf8');
l = l.replace(/>Sign In</g, '>Organization / User SignIn<');
l = l.replace(/>Don't have an account\?</g, '>Don\\'t have a user account?<');
fs.writeFileSync('client/src/components/Login.jsx', l);

let d = fs.readFileSync('client/src/components/Dashboard.jsx', 'utf8');
d = d.replace(/<div className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-900 border-l border-slate-800">/, 
  \<div className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-900 border-l border-slate-800">
    <div className="px-8 py-4 bg-slate-800/50">
      <h2 className="text-xl font-bold text-white">Role: {user?.role || 'user'}</h2>
      {user?.organizationEmail && <p className="text-slate-400">Organization: {user.organizationEmail}</p>}
    </div>\);
fs.writeFileSync('client/src/components/Dashboard.jsx', d);
