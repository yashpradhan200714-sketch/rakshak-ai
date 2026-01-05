
import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { Connection } from '../types';
import { togglePriority, getFollowing, getFollowers, toggleFollow, removeFollower, blockUser } from '../services/socialService';

interface CommunityConnectionsProps {
  currentUserId: string;
}

export const CommunityConnections: React.FC<CommunityConnectionsProps> = ({ currentUserId }) => {
  const [activeTab, setActiveTab] = useState<'guardians' | 'protected'>('guardians');
  const [searchQuery, setSearchQuery] = useState('');
  const [following, setFollowing] = useState<Connection[]>([]);
  const [followers, setFollowers] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [followingList, followersList] = await Promise.all([
        getFollowing(currentUserId),
        getFollowers(currentUserId)
      ]);
      setFollowing(followingList);
      setFollowers(followersList);
    } catch (e) {
      console.error("Failed to load network", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentUserId]);

  const handlePriorityToggle = async (connectionId: string) => {
    const conn = following.find(c => c.id === connectionId);
    if (!conn) return;

    // Optimistic UI
    setFollowing(prev => prev.map(c => 
      c.id === connectionId ? { ...c, isPriority: !c.isPriority } : c
    ));

    await togglePriority(currentUserId, connectionId, conn.isPriority);
  };

  const handleUnfollow = async (id: string) => {
    if (window.confirm("Sever connection with this Guardian? You will lose prioritized SOS notifications.")) {
        setFollowing(prev => prev.filter(c => c.id !== id));
        await toggleFollow(currentUserId, id, true);
    }
  };

  const handleRemoveFollower = async (id: string) => {
    if (window.confirm("Remove this person from your Protection Grid? They will no longer receive your SOS signals.")) {
        setFollowers(prev => prev.filter(c => c.id !== id));
        await removeFollower(currentUserId, id);
    }
  };

  const handleBlock = async (id: string) => {
    if (window.confirm("Initiate Blacklist Protocol? This user will be permanently severed from your grid.")) {
        setFollowing(prev => prev.filter(c => c.id !== id));
        setFollowers(prev => prev.filter(c => c.id !== id));
        await blockUser(currentUserId, id);
    }
  };

  const filteredList = (activeTab === 'guardians' ? following : followers).filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full animate-in fade-in duration-500">
      
      {/* Network Overview Tiles */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('guardians')}
          className={`relative p-6 rounded-[2.5rem] border-2 transition-all flex flex-col items-center group overflow-hidden ${activeTab === 'guardians' ? 'bg-blue-600 border-blue-400 shadow-[0_20px_40px_rgba(37,99,235,0.3)]' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
        >
          <div className={`absolute -right-4 -top-4 opacity-10 group-hover:rotate-12 transition-transform ${activeTab === 'guardians' ? 'text-white' : 'text-slate-500'}`}>
            <Lucide.Shield size={80} />
          </div>
          <span className={`text-4xl font-black mb-1 ${activeTab === 'guardians' ? 'text-white' : 'text-slate-300'}`}>
            {following.length}
          </span>
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${activeTab === 'guardians' ? 'text-blue-100' : 'text-slate-500'}`}>
            Following
          </span>
          <div className={`mt-3 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${activeTab === 'guardians' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
            Guardians
          </div>
        </button>

        <button 
          onClick={() => setActiveTab('protected')}
          className={`relative p-6 rounded-[2.5rem] border-2 transition-all flex flex-col items-center group overflow-hidden ${activeTab === 'protected' ? 'bg-green-600 border-green-400 shadow-[0_20px_40px_rgba(16,185,129,0.3)]' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
        >
          <div className={`absolute -right-4 -top-4 opacity-10 group-hover:-rotate-12 transition-transform ${activeTab === 'protected' ? 'text-white' : 'text-slate-500'}`}>
            <Lucide.Users size={80} />
          </div>
          <span className={`text-4xl font-black mb-1 ${activeTab === 'protected' ? 'text-white' : 'text-slate-300'}`}>
            {followers.length}
          </span>
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${activeTab === 'protected' ? 'text-green-100' : 'text-slate-500'}`}>
            Followers
          </span>
          <div className={`mt-3 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${activeTab === 'protected' ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
            Protected
          </div>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6 group">
        <Lucide.Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${activeTab === 'guardians' ? 'Following' : 'Followers'}...`}
          className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl py-4 pl-14 pr-6 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-600 transition-all shadow-xl"
        />
      </div>

      {/* List Area */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-24 flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest animate-pulse">Scanning Grid Connections</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/30 rounded-[3rem] border-2 border-dashed border-slate-800">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-700">
              <Lucide.Satellite size={40} />
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-loose px-8">
              {searchQuery ? "No matching contacts found in selection" : 
               activeTab === 'guardians' ? "You haven't added any guardians yet." : "Your protection grid is currently empty."}
            </p>
            {!searchQuery && (
              <p className="text-slate-700 text-[9px] mt-4 font-bold px-12">
                {activeTab === 'guardians' ? "Designate high-impact helpers to be notified immediately during your SOS events." : "Help community members to grow your protected network."}
              </p>
            )}
          </div>
        ) : (
          filteredList.map((conn) => (
            <div key={conn.id} className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-[2.5rem] p-5 flex items-center gap-4 group hover:border-slate-700 transition-all shadow-xl hover:shadow-2xl">
              {/* Avatar with Status Ring */}
              <div className="relative">
                <div className="w-16 h-16 bg-slate-800 rounded-3xl flex items-center justify-center font-black text-white text-2xl border-2 border-slate-700 shadow-inner overflow-hidden ring-4 ring-transparent group-hover:ring-blue-500/10 transition-all">
                  {conn.avatar ? <img src={conn.avatar} alt="" className="w-full h-full object-cover" /> : conn.name.charAt(0)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-[3px] border-slate-950 rounded-full shadow-lg"></div>
              </div>

              {/* Identity & Rank */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-white text-base truncate">{conn.name}</h4>
                  {conn.role.includes('Platinum') && <Lucide.Award className="text-blue-400 shrink-0" size={14} />}
                  {conn.role.includes('Gold') && <Lucide.ShieldCheck className="text-yellow-400 shrink-0" size={14} />}
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                   <span className="text-[10px] text-blue-500 font-black uppercase tracking-widest">{conn.role}</span>
                   <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
                   <span className="text-[10px] text-green-500 font-bold uppercase">{conn.trustRating || 100}% Trust</span>
                </div>
              </div>

              {/* Action Suite */}
              <div className="flex items-center gap-2">
                {activeTab === 'guardians' ? (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handlePriorityToggle(conn.id)}
                      className={`p-3.5 rounded-2xl border-2 transition-all ${conn.isPriority ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white'}`}
                      title="Priority SOS Toggle"
                    >
                      <Lucide.Zap size={18} fill={conn.isPriority ? "currentColor" : "none"} />
                    </button>
                    <button 
                      onClick={() => handleUnfollow(conn.id)}
                      className="p-3.5 bg-slate-800 border-2 border-slate-700 text-slate-500 hover:text-red-500 hover:border-red-500/30 rounded-2xl transition-all"
                      title="Unfollow Guardian"
                    >
                      <Lucide.LogOut size={18} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleRemoveFollower(conn.id)}
                    className="p-3.5 bg-slate-800 border-2 border-slate-700 text-slate-500 hover:text-red-500 hover:border-red-500/30 rounded-2xl transition-all"
                    title="Remove Protected Member"
                  >
                    <Lucide.UserX size={18} />
                  </button>
                )}
                
                <button 
                  onClick={() => handleBlock(conn.id)}
                  className="p-3.5 bg-slate-800 border-2 border-slate-700 text-slate-500 hover:text-red-600 hover:border-red-600 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                  title="Block User"
                >
                  <Lucide.Ban size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Educational Brief */}
      <div className="mt-12 bg-slate-900 border border-slate-800 p-6 rounded-[2rem] flex gap-5 items-start shadow-xl">
         <div className="w-10 h-10 bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0">
            <Lucide.Info className="text-blue-500" size={20} />
         </div>
         <div>
            <h5 className="text-[10px] font-black text-white uppercase tracking-widest mb-1.5">Network Protocol</h5>
            <p className="text-[10px] text-slate-500 leading-relaxed uppercase font-bold tracking-tight">
              <span className="text-blue-400">Following (Guardians)</span> are high-trust users who will be notified instantly when you trigger a distress signal.
              <br/><br/>
              <span className="text-green-400">Followers (Protected)</span> are users who have designated you as their emergency contact. You will receive their alerts.
            </p>
         </div>
      </div>
    </div>
  );
};
