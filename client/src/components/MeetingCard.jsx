import { CheckCircle2, Zap } from 'lucide-react';

const MeetingCard = ({ meeting, onView, onEdit, onDelete }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const actionItemsCount = meeting.actionItems?.length || 0;
  const openItems = meeting.actionItems?.filter(item => item.status === 'Open').length || 0;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4">
        <h3 className="text-lg font-bold">{meeting.title}</h3>
        <div className="text-sm text-indigo-100">{formatDate(meeting.createdAt)}</div>
      </div>

      <div className="p-4">
        {meeting.summary && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{meeting.summary.substring(0, 150)}...</p>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center space-x-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-gray-700">{actionItemsCount} Items</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Zap className="w-4 h-4 text-amber-600" />
            <span className="text-gray-700">{openItems} Open</span>
          </div>
        </div>

        {meeting.tags && meeting.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {meeting.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="inline-block bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-4 border-t flex space-x-2">
        <button
          onClick={onView}
          className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold py-2 px-3 rounded transition"
        >
          View
        </button>
        <button
          onClick={onEdit}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-2 px-3 rounded transition"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 px-3 rounded transition"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default MeetingCard;
