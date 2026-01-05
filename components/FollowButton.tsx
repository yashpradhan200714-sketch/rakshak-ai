
import React, { useState, useEffect } from 'react';
import { toggleFollow, checkFollowStatus } from '../services/socialService';

interface FollowButtonProps {
  currentUserId: string;
  targetUserId: string;
  onStatusChange?: (isFollowing: boolean) => void;
}

export const FollowButton: React.FC<FollowButtonProps> = ({ currentUserId, targetUserId, onStatusChange }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const status = await checkFollowStatus(currentUserId, targetUserId);
      setIsFollowing(status);
      setIsLoading(false);
    };
    init();
  }, [currentUserId, targetUserId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const prevStatus = isFollowing;
    // Optimistic UI
    setIsFollowing(!prevStatus);
    
    try {
      const newStatus = await toggleFollow(currentUserId, targetUserId, prevStatus);
      setIsFollowing(newStatus);
      if (onStatusChange) onStatusChange(newStatus);
    } catch (err) {
      setIsFollowing(prevStatus); // Rollback
    }
  };

  if (isLoading) return <div className="w-20 h-8 bg-slate-800 animate-pulse rounded-xl"></div>;

  return (
    <button
      onClick={handleToggle}
      className={`
        px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300
        ${isFollowing 
          ? 'bg-slate-800 text-slate-400 border border-slate-700' 
          : 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 hover:bg-blue-500 active:scale-90'}
      `}
    >
      {isFollowing ? 'Following' : 'Trust +'}
    </button>
  );
};
