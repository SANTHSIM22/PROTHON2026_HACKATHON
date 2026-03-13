import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white bg-opacity-80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            MeetingAI
          </div>
          <div className="flex space-x-4">
            {user ? (
              <>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition"
                >
                  Dashboard
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-2 rounded-lg text-indigo-600 hover:bg-indigo-50 font-semibold transition"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Transform Meeting Discussions
            <span className="block bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Into Actionable Tasks
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            Capture meeting transcripts, automatically extract action items and decisions, and integrate them seamlessly into your workflow.
          </p>
          <button
            onClick={() => navigate(user ? '/dashboard' : '/signup')}
            className="px-8 py-4 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-lg rounded-lg transition transform hover:scale-105 shadow-lg"
          >
            Get Started
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {[
            {
              icon: '📝',
              title: 'Meeting Capture',
              description: 'Upload meeting transcripts or paste conversation notes. Supports multiple formats and sources.'
            },
            {
              icon: '✨',
              title: 'AI Analysis',
              description: 'Advanced AI extracts key discussions, decisions, and action items automatically.'
            },
            {
              icon: '📋',
              title: 'Task Management',
              description: 'Convert discussions into structured tasks with assignees, priorities, and due dates.'
            },
            {
              icon: '🔗',
              title: 'Workflow Integration',
              description: 'Seamlessly integrate with your development tools and project management systems.'
            },
            {
              icon: '📊',
              title: 'Analytics Dashboard',
              description: 'Track action item completion rates and meeting insights at a glance.'
            },
            {
              icon: '🔒',
              title: 'Secure & Private',
              description: 'Your data is encrypted and stored securely. Full control over your information.'
            }
          ].map((feature, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition border border-gray-100"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-100 mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Upload', description: 'Add your meeting transcript or notes' },
              { step: '2', title: 'Analyze', description: 'AI extracts key information' },
              { step: '3', title: 'Review', description: 'Check and edit the results' },
              { step: '4', title: 'Execute', description: 'Assign and track action items' }
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full font-bold text-2xl mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {[
            { stat: '99.9%', label: 'Uptime' },
            { stat: '10,000+', label: 'Meetings Processed' },
            { stat: '95%', label: 'Accuracy Rate' }
          ].map((item, idx) => (
            <div key={idx} className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {item.stat}
              </div>
              <p className="text-gray-600 text-lg">{item.label}</p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-linear-to-r from-indigo-600 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Streamline Your Meetings?</h2>
          <p className="text-lg mb-8 opacity-90">Start converting meeting discussions into actionable tasks today.</p>
          <button
            onClick={() => navigate(user ? '/dashboard' : '/signup')}
            className="px-8 py-4 bg-white text-indigo-600 font-bold text-lg rounded-lg hover:bg-gray-100 transition transform hover:scale-105"
          >
            Get Started Now
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-4">MeetingAI</h3>
              <p className="text-sm">Transform your meetings into actionable tasks.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2024 MeetingAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
