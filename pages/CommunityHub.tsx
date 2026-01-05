
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { getLeaderboard, getCommunityStats } from '../services/userService';
import { CommunityConnections } from '../components/CommunityConnections';
import { auth } from '../services/firebase';
import { APP_NAME } from '../constants';

export const CommunityHub: React.FC = () => {
    const [leaderboard, setLeaderboard] = useState<User[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [filter, setFilter] = useState<'weekly' | 'all-time'>('all-time');
    const [viewMode, setViewMode] = useState<'leaderboard' | 'network'>('leaderboard');
    const [loading, setLoading] = useState(true);
    
    // Fallback for mock environment
    const currentUser = auth.currentUser;
    const currentUserId = currentUser?.uid || 'u123';

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const [lb, s] = await Promise.all([
                getLeaderboard(filter),
                getCommunityStats()
            ]);
            setLeaderboard(lb);
            setStats(s);
            setLoading(false);
        };
        load();
    }, [filter]);

    return (
        <div className="flex flex-col min-h-screen bg-slate-950 pb-24 overflow-x-hidden">
            {/* Header */}
            <header className="p-6 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-40">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Social Grid</h1>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-0.5">Community Trust & Impact</p>
                    </div>
                    <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 shadow-inner">
                        <button 
                            onClick={() => setViewMode('leaderboard')}
                            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${viewMode === 'leaderboard' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                            <span className="text-[10px] font-black uppercase tracking-widest">Global</span>
                        </button>
                        <button 
                            onClick={() => setViewMode('network')}
                            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${viewMode === 'network' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            <span className="text-[10px] font-black uppercase tracking-widest">My Net</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* View Selection */}
            <div className="flex-1 flex flex-col p-6 animate-in fade-in duration-500">
                {viewMode === 'leaderboard' ? (
                    <>
                        {/* High-Level Community Metrics */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-gradient-to-br from-blue-900/40 to-slate-900 p-5 rounded-[2rem] border border-blue-500/20 shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                                </div>
                                <div className="text-[10px] text-blue-400 uppercase font-black tracking-[0.2em] mb-1">Global Active</div>
                                <div className="text-3xl font-black text-white tracking-tighter">1,204</div>
                                <p className="text-[9px] text-slate-500 mt-2 font-black uppercase tracking-widest">+12% from last week</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-900/40 to-slate-900 p-5 rounded-[2rem] border border-green-500/20 shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
                                </div>
                                <div className="text-[10px] text-green-400 uppercase font-black tracking-[0.2em] mb-1">Grid Trust</div>
                                <div className="text-3xl font-black text-white tracking-tighter">98.2%</div>
                                <p className="text-[9px] text-slate-500 mt-2 font-black uppercase tracking-widest">Certified Safe</p>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Top Guardians</h2>
                            <div className="flex bg-slate-900 p-1 rounded-xl text-[10px] border border-slate-800">
                                <button 
                                    onClick={() => setFilter('weekly')}
                                    className={`px-4 py-1.5 rounded-lg transition-all font-black uppercase tracking-tighter ${filter === 'weekly' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                                >Weekly</button>
                                <button 
                                    onClick={() => setFilter('all-time')}
                                    className={`px-4 py-1.5 rounded-lg transition-all font-black uppercase tracking-tighter ${filter === 'all-time' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                                >All Time</button>
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 overflow-hidden mb-8 shadow-2xl divide-y divide-slate-800">
                            {loading ? (
                                <div className="p-20 flex flex-col items-center gap-4">
                                    <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Updating Rankings</span>
                                </div>
                            ) : leaderboard.map((u, idx) => (
                                <div key={u.id} className="flex items-center gap-4 p-5 hover:bg-slate-800/30 transition-all cursor-pointer group">
                                    <div className="w-8 flex justify-center text-xl font-black">
                                        {idx === 0 ? "🏆" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : <span className="text-xs text-slate-600">{idx + 1}</span>}
                                    </div>
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-black text-white shrink-0 overflow-hidden shadow-lg group-hover:border-blue-500 transition-colors">
                                            {u.photoUrl ? <img src={u.photoUrl} alt="" className="w-full h-full object-cover"/> : u.name.charAt(0)}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 border-2 border-slate-950 rounded-full shadow-lg"></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-black text-white truncate leading-tight group-hover:text-blue-400 transition-colors">{u.name}</div>
                                        <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">{u.rank}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black text-white tracking-tighter">{u.score.toLocaleString()}</div>
                                        <div className="text-[9px] text-slate-600 font-black uppercase tracking-tighter mt-1">Impact Pts</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="pb-10">
                        <CommunityConnections currentUserId={currentUserId} />
                    </div>
                )}

                {/* Feed */}
                {viewMode === 'leaderboard' && (
                    <div className="mt-4">
                        <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Grid Pulse</h2>
                        <div className="space-y-4 pb-12">
                            {[
                                { user: 'Sarah K.', action: 'resolved a Medical alert', time: '2m ago', icon: '🚑', color: 'bg-blue-600/10 text-blue-400' },
                                { user: 'Rahul V.', action: 'marked a Crime Hazard point', time: '15m ago', icon: '🛡️', color: 'bg-red-600/10 text-red-400' },
                                { user: 'Amit J.', action: 'reached Platinum Guardian', time: '1h ago', icon: '🌟', color: 'bg-yellow-600/10 text-yellow-400' },
                            ].map((item, i) => (
                                <div key={i} className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-[2rem] flex items-center gap-5 shadow-xl animate-in fade-in slide-in-from-right duration-500" style={{ animationDelay: `${i * 150}ms` }}>
                                    <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center text-xl shadow-inner shrink-0`}>{item.icon}</div>
                                    <div className="flex-1">
                                        <p className="text-[13px] text-slate-300 leading-snug">
                                            <span className="font-black text-white">{item.user}</span> {item.action}.
                                        </p>
                                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                            <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                                            {item.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Footer */}
                <footer className="mt-auto py-12 flex flex-col items-center gap-3 opacity-30 border-t border-slate-900">
                  <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 text-center">
                    © 2025 {APP_NAME} Tactical Grid
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 text-center">
                    Made for India by <span className="text-blue-400 font-black">Indians For India</span>
                  </div>
                </footer>
            </div>
        </div>
    );
};
