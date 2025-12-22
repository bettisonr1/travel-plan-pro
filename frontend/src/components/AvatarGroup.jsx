import React from 'react';

const AvatarGroup = ({ users = [], max = 3, onClick }) => {
  const displayUsers = users.slice(0, max);
  const remaining = users.length - max;

  const getInitials = (user) => {
    if (!user || !user.firstname || !user.lastname) return '??';
    return `${user.firstname[0]}${user.lastname[0]}`.toUpperCase();
  };

  return (
    <div 
      className="flex -space-x-2 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity p-1"
      onClick={(e) => {
        e.stopPropagation(); // Prevent card click if any
        onClick && onClick();
      }}
      title="Manage users"
    >
      {displayUsers.map((user) => (
        <div
          key={user._id}
          className="h-8 w-8 rounded-full ring-2 ring-white bg-blue-500 flex items-center justify-center text-xs text-white font-medium leading-none"
          title={`${user.firstname} ${user.lastname}`}
        >
          {getInitials(user)}
        </div>
      ))}
      {remaining > 0 && (
        <div className="h-8 w-8 rounded-full ring-2 ring-white bg-gray-300 flex items-center justify-center text-xs text-gray-700 font-medium leading-none">
          +{remaining}
        </div>
      )}
      {users.length === 0 && (
         <div className="h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-300 border-dashed hover:bg-gray-200 hover:text-gray-600 transition-colors leading-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default AvatarGroup;

