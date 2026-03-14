export const Loader = ({ isLoading, message = 'Loading...' }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-[#0C1A15]/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-[#D4E0DA] flex flex-col items-center justify-center gap-4">
        {/* Spinner */}
        <div className="w-12 h-12 relative">
          <div className="absolute inset-0 rounded-full border-4 border-[#D4E0DA]"></div>
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#D97706] animate-spin"
            style={{ animationDuration: '1s' }}
          ></div>
        </div>
        {/* Message */}
        <p className="text-[#3D5249] font-medium text-center">{message}</p>
      </div>
    </div>
  );
};

export default Loader;
