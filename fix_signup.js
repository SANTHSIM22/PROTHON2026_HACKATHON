const fs = require('fs');

let s = fs.readFileSync('client/src/components/Signup.jsx', 'utf8');

// Modify initial state
s = s.replace(/name: '',\s*email: '',\s*password: '',\s*confirmPassword: ''/g, 
  \
ame: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'technical',
    organizationEmail: ''\);

// Update signup call 
s = s.replace(/await signup\(\s*formData\.name,\s*formData\.email,\s*formData\.password,\s*formData\.confirmPassword\s*\);/g, 
  \wait signup(
        formData.name,
        formData.email,
        formData.password,
        formData.confirmPassword,
        formData.role,
        formData.organizationEmail
      );\);

// Add form fields before the submit button
const fields = \
              {/* Role */}
              <div>
                <label className="block text-[#0C1210] text-[13px] font-bold mb-2 uppercase tracking-wider">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  onFocus={() => setFocused('role')}
                  onBlur={() => setFocused('')}
                  className="w-full h-[52px] px-4 rounded-xl border border-[#243028] bg-[#0C1210] text-white focus:outline-none transition-all duration-300 placeholder:text-[#5B7067] text-[15px]"
                  style={inputStyle('role')}
                >
                  <option value="technical">Technical User</option>
                  <option value="non-technical">Non-Technical User</option>
                </select>
              </div>

              {/* Organization Email */}
              <div>
                <label className="block text-[#0C1210] text-[13px] font-bold mb-2 uppercase tracking-wider">
                  Organization Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="organizationEmail"
                    value={formData.organizationEmail}
                    onChange={handleChange}
                    onFocus={() => setFocused('organizationEmail')}
                    onBlur={() => setFocused('')}
                    placeholder="org@example.com"
                    className="w-full h-[52px] px-4 rounded-xl border border-[#243028] bg-[#0C1210] text-white focus:outline-none transition-all duration-300 placeholder:text-[#5B7067] text-[15px]"
                    style={inputStyle('organizationEmail')}
                    required
                  />
                  {formData.organizationEmail && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#D97706]">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                  )}
                </div>
              </div>
\;

// Inject fields before submit button container (which starts with pt-2 or similar)
// Let's find the confirm password block end to put it after
s = s.replace(/(<label.*?>\s*Confirm Password\s*<\/label>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>)/, match => match + fields);


fs.writeFileSync('client/src/components/Signup.jsx', s);

