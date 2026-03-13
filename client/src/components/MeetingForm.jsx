import { useState, useEffect } from 'react';

const MeetingForm = ({ meeting, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    transcript: '',
    summary: '',
    actionItems: [],
    decisions: [],
    tags: ''
  });
  const [newActionItem, setNewActionItem] = useState({
    description: '',
    assignee: '',
    priority: 'Medium',
    dueDate: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (meeting) {
      setFormData({
        title: meeting.title || '',
        transcript: meeting.transcript || '',
        summary: meeting.summary || '',
        actionItems: meeting.actionItems || [],
        decisions: meeting.decisions || [],
        tags: meeting.tags?.join(', ') || ''
      });
    }
  }, [meeting]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleActionItemChange = (e) => {
    const { name, value } = e.target;
    setNewActionItem(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addActionItem = () => {
    if (!newActionItem.description.trim()) {
      setError('Action item description is required');
      return;
    }
    setFormData(prev => ({
      ...prev,
      actionItems: [...prev.actionItems, { ...newActionItem, status: 'Open' }]
    }));
    setNewActionItem({
      description: '',
      assignee: '',
      priority: 'Medium',
      dueDate: ''
    });
  };

  const removeActionItem = (idx) => {
    setFormData(prev => ({
      ...prev,
      actionItems: prev.actionItems.filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.transcript.trim()) {
      setError('Title and transcript are required');
      return;
    }

    try {
      setLoading(true);
      const submitData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      await onSubmit(submitData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">
        {meeting ? 'Edit Meeting' : 'Create Meeting'}
      </h2>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Meeting Details */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Meeting Details</h3>

          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block font-semibold text-gray-700 mb-2">
                Meeting Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Sprint Planning - Week 1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor="transcript" className="block font-semibold text-gray-700 mb-2">
                Meeting Transcript
              </label>
              <textarea
                id="transcript"
                name="transcript"
                value={formData.transcript}
                onChange={handleInputChange}
                placeholder="Paste the meeting transcript or notes here..."
                rows="8"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor="summary" className="block font-semibold text-gray-700 mb-2">
                Summary (Optional)
              </label>
              <textarea
                id="summary"
                name="summary"
                value={formData.summary}
                onChange={handleInputChange}
                placeholder="Add a summary of the meeting..."
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="tags" className="block font-semibold text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="e.g., backend, feature, urgent"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Action Items</h3>

          <div className="space-y-4 mb-4 bg-white p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="description" className="block font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={newActionItem.description}
                  onChange={handleActionItemChange}
                  placeholder="What needs to be done?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="assignee" className="block font-semibold text-gray-700 mb-2">
                  Assignee (Optional)
                </label>
                <input
                  type="text"
                  id="assignee"
                  name="assignee"
                  value={newActionItem.assignee}
                  onChange={handleActionItemChange}
                  placeholder="Who is responsible?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="priority" className="block font-semibold text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={newActionItem.priority}
                  onChange={handleActionItemChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label htmlFor="dueDate" className="block font-semibold text-gray-700 mb-2">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={newActionItem.dueDate}
                  onChange={handleActionItemChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={addActionItem}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              + Add Action Item
            </button>
          </div>

          {formData.actionItems.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">
                Added Action Items ({formData.actionItems.length})
              </h4>
              <div className="space-y-2">
                {formData.actionItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-3 rounded-lg border border-gray-300 flex items-start justify-between"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{item.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {item.assignee && (
                          <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                            {item.assignee}
                          </span>
                        )}
                        <span
                          className={`inline-block text-xs px-2 py-1 rounded ${
                            item.priority === 'High'
                              ? 'bg-red-100 text-red-700'
                              : item.priority === 'Medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {item.priority}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeActionItem(idx)}
                      className="ml-3 text-red-500 hover:text-red-700 font-bold text-lg"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Meeting'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default MeetingForm;
