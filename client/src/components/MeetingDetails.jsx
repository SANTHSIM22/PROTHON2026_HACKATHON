import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { meetingsAPI } from '../api';

const MeetingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMeeting();
  }, [id]);

  const fetchMeeting = async () => {
    try {
      setLoading(true);
      const response = await meetingsAPI.getById(id);
      setMeeting(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load meeting details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (actionIndex, newStatus) => {
    const previousMeeting = meeting;

    setMeeting((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        actionItems: (prev.actionItems || []).map((item, idx) => (
          idx === actionIndex ? { ...item, status: newStatus } : item
        )),
      };
    });

    try {
      await meetingsAPI.updateActionStatus(id, actionIndex, newStatus);
    } catch (err) {
      setMeeting(previousMeeting);
      setError('Failed to update action item');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto text-center py-12 text-gray-500">
          <p className="text-lg">Loading meeting details...</p>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4">
            Meeting not found
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const completedItems = meeting.actionItems?.filter(item => item.status === 'Completed').length || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 text-indigo-600 hover:text-indigo-700 font-semibold flex items-center"
        >
          ← Back to Dashboard
        </button>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{meeting.title}</h1>
              <p className="text-indigo-100">{formatDate(meeting.createdAt)}</p>
            </div>
            <div className="flex space-x-6">
              <div className="text-center">
                <p className="text-indigo-100 text-sm">Total Actions</p>
                <p className="text-3xl font-bold">{meeting.actionItems?.length || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-indigo-100 text-sm">Completed</p>
                <p className="text-3xl font-bold">{completedItems}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        {meeting.summary && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Summary</h2>
            <p className="text-gray-700 leading-relaxed">{meeting.summary}</p>
          </div>
        )}

        {/* Transcript */}
        {meeting.transcript && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Meeting Transcript</h2>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
              <p className="text-gray-700 whitespace-pre-wrap">{meeting.transcript}</p>
            </div>
          </div>
        )}

        {/* Key Decisions */}
        {meeting.decisions && meeting.decisions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Key Decisions</h2>
            <ul className="space-y-2">
              {meeting.decisions.map((decision, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-indigo-600 font-bold mr-3">•</span>
                  <span className="text-gray-700">{decision}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Items */}
        {meeting.actionItems && meeting.actionItems.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Action Items</h2>
            <div className="space-y-4">
              {meeting.actionItems.map((item, idx) => (
                <div
                  key={idx}
                  className={`border rounded-lg p-4 transition ${
                    item.status === 'Completed'
                      ? 'bg-green-50 border-green-300'
                      : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-4 mb-3">
                    <input
                      type="checkbox"
                      checked={item.status === 'Completed'}
                      onChange={(e) => {
                        const newStatus = e.target.checked ? 'Completed' : 'Open';
                        handleStatusChange(idx, newStatus);
                      }}
                      className="w-5 h-5 text-indigo-600 rounded mt-1"
                    />
                    <div className="flex-1">
                      <p
                        className={`font-medium text-lg ${
                          item.status === 'Completed'
                            ? 'text-gray-500 line-through'
                            : 'text-gray-800'
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ml-9 text-sm">
                    {item.assignee && (
                      <div>
                        <span className="text-gray-600">Assignee:</span>
                        <p className="font-medium text-gray-800">{item.assignee}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Priority:</span>
                      <p
                        className={`font-medium inline-block mt-1 px-2 py-1 rounded text-xs ${
                          item.priority === 'High'
                            ? 'bg-red-200 text-red-700'
                            : item.priority === 'Medium'
                            ? 'bg-yellow-200 text-yellow-700'
                            : 'bg-green-200 text-green-700'
                        }`}
                      >
                        {item.priority}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(idx, e.target.value)}
                        className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    {item.dueDate && (
                      <div>
                        <span className="text-gray-600">Due:</span>
                        <p className="font-medium text-gray-800">{new Date(item.dueDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {meeting.tags && meeting.tags.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {meeting.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-block bg-indigo-100 text-indigo-700 font-medium px-3 py-1 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingDetails;
