
import React, { useState, useEffect } from 'react';
import { User, Contact, SafeLocation, Badge } from '../types';
import { getCommunityUsers, addEmergencyContact, removeEmergencyContact, updateUserData } from '../services/userService';
import { RANK_THRESHOLDS, AVAILABLE_BADGES, APP_NAME } from '../constants';
import { FollowButton } from '../components/FollowButton';
import { BadgeShowcase } from '../components/BadgeShowcase';
import { BadgeUnlockModal } from '../components/BadgeUnlockModal';
import { Trash2, Phone, Shield, UserPlus, Edit3 } from 'lucide-react';

interface ProfileProps {
  user: User;
  onLogout: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'network' | 'community'>('profile');
  const [community, setCommunity] = useState<User[]>([]);
  const [newBadge, setNewBadge] = useState<Badge | null>(null);

  const [contacts, setContacts] = useState<Contact[]>(user.emergencyContacts || []);
  const [locations, setLocations] = useState<SafeLocation[]>(user.safeLocations || []);

  useEffect(() => {
    const loadCommunity = async () => {
      const users = await getCommunityUsers();
      setCommunity(users.filter(u => u.id !== user.id));
    };
    loadCommunity();
  }, [user.id]);

  const currentRankIndex = RANK_THRESHOLDS.findIndex(r => r.name === user.rank);
  const nextRank = RANK_THRESHOLDS[currentRankIndex + 1];
  
  const addContact = async () => {
    const name = prompt("Enter contact name:");
    if (!name) return;
    const phone = prompt("Enter phone number:");
    if (!phone) return;
    const relation = prompt("Enter relation (e.g. Parent, Sibling, Friend):");
    
    const newContact: Contact = { 
      id: Date.now().toString(), 
      name, 
      phone, 
      relation: relation || 'Friend' 
    };

    try {
      setContacts(prev => [...prev, newContact]);
      await addEmergencyContact(user.id, newContact);
      user.emergencyContacts.push(newContact); // Keep user object in sync for session
    } catch (err) {
      console.error("Failed to add contact", err);
      alert("Failed to sync contact to cloud.");
    }
  };

  const editContact = async (contact: Contact) => {
    const name = prompt("Edit contact name:", contact.name);
    if (name === null) return;
    const phone = prompt("Edit phone number:", contact.phone);
    if (phone === null) return;
    const relation = prompt("Edit relation:", contact.relation);
    if (relation === null) return;

    const updatedContact = { ...contact, name, phone, relation: relation || 'Friend' };
    const updatedContacts = contacts.map(c => c.id === contact.id ? updatedContact : c);

    try {
      setContacts(updatedContacts);
      await updateUserData(user.id, { emergencyContacts: updatedContacts });
      user.emergencyContacts = updatedContacts;
    } catch (err) {
      console.error("Failed to update contact", err);
      alert("Failed to sync changes to cloud.");
    }
  };

  const removeContact = async (contact: Contact) => {
    if (!window.confirm(`Remove ${contact.name} from your Safety Net?`)) return;

    try {
      setContacts(prev => prev.filter(c => c.id !== contact.id));
      await removeEmergencyContact(user.id, contact);
      user.emergencyContacts = user.emergencyContacts.filter(c => c.id !== contact.id);
    } catch (err) {
      console.error("Failed to remove contact", err);
      alert("Failed to sync removal to cloud.");
    }
  };

  return (
    <div className="min-h-screen pb-24 w-full max-w-md mx-auto bg-slate-950">
      {/* Header Tabs */}
      <div className="flex bg-slate-900 border-b border-slate-800 sticky top-0 z-30 p-1">
        <button onClick={() => setActiveTab('profile')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'text-blue-400' : 'text-slate-500'}`}>Helper Profile</button>
        <button onClick={() => setActiveTab('network')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'network' ? 'text-blue-400' : 'text-slate-500'}`}>Safety Net</button>
        <button onClick={() => setActiveTab('community')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'community' ? 'text-blue-400' : 'text-slate-500'}`}>Helpers</button>
      </div>

      {activeTab === 'profile' && (
        <div className="p-6 animate-in fade-in duration-500">
          <div className="flex flex-col items-center mb-10">
            <div className="w-28 h-28 bg-gradient-to-tr from-blue-600 to-indigo-800 rounded-3xl flex items-center justify-center text-4xl font-black shadow-2xl mb-6 border-4 border-slate-800 overflow-hidden ring-4 ring-blue-500/10">
              {user.photoUrl ? <img src={user.photoUrl} alt="Profile" className="w-full h-full object-cover" /> : user.name.charAt(0)}
            </div>

            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              {user.name}
              <span className="text-blue-400 text-lg">✓</span>
            </h2>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mt-2 ${RANK_THRESHOLDS.find(r => r.name === user.rank)?.color}`}>
                {user.rank}
            </p>

            <div className="flex gap-4 mt-8 w-full justify-around bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-xl">
              <div className="text-center">
                <div className="text-xl font-black text-white">{user.score.toLocaleString()}</div>
                <div className="text-[8px] text-slate-500 uppercase font-black tracking-widest mt-1">Impact</div>
              </div>
              <div className="text-center border-x border-slate-800 px-6">
                <div className="text-xl font-black text-white">{user.helpCount || 0}</div>
                <div className="text-[8px] text-slate-500 uppercase font-black tracking-widest mt-1">Helped</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-black text-white">{user.followers}</div>
                <div className="text-[8px] text-slate-500 uppercase font-black tracking-widest mt-1">Helpers</div>
              </div>
            </div>
          </div>

          {/* Achievement System */}
          <section className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Honor Deck</h3>
                <span className="text-[9px] font-bold text-blue-500 uppercase bg-blue-500/10 px-3 py-1 rounded-full">
                  {user.badges.length} / {AVAILABLE_BADGES.length} Collected
                </span>
              </div>
              
              <BadgeShowcase userBadgeIds={user.badges} />
          </section>
          
          <div className="space-y-4">
            <button 
                onClick={() => setNewBadge(AVAILABLE_BADGES[0])} // Simulation trigger
                className="w-full py-4 text-[9px] font-black uppercase tracking-[0.2em] text-blue-400/50 border border-blue-400/10 rounded-2xl hover:bg-blue-400/5 transition-all"
            >
              Simulate Achievement Unlock
            </button>

            <button onClick={onLogout} className="w-full py-5 bg-slate-900 border border-slate-800 text-red-500 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-red-950/20 transition-all shadow-xl">
              Disconnect from {APP_NAME}
            </button>
          </div>
        </div>
      )}

      {/* Rest of the component tabs... */}
      {activeTab === 'network' && (
        <div className="p-6 space-y-8 animate-in slide-in-from-right duration-500">
           <section>
              <div className="flex justify-between items-center mb-6">
                 <div>
                    <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Emergency SOS Grid</h3>
                    <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold">People notified immediately during SOS</p>
                 </div>
                 <button 
                    onClick={addContact} 
                    className="flex items-center gap-2 text-[9px] bg-blue-600 text-white px-4 py-2.5 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-900/40 hover:bg-blue-500 transition-all active:scale-95"
                 >
                    <UserPlus size={14} />
                    Add Trusted
                 </button>
              </div>

              {contacts.length === 0 ? (
                <div className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-[2.5rem] p-12 text-center">
                   <Shield size={40} className="mx-auto text-slate-700 mb-4 opacity-20" />
                   <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-loose">
                      No emergency contacts yet.<br/>Your safety net is inactive.
                   </p>
                </div>
              ) : (
                <div className="space-y-4">
                   {contacts.map(contact => (
                      <div key={contact.id} className="bg-slate-900 p-5 rounded-[2rem] border border-slate-800 flex justify-between items-center group hover:border-blue-500/50 transition-all shadow-xl">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-slate-700">
                               {contact.name.charAt(0)}
                            </div>
                            <div>
                               <div className="text-sm font-black text-white">{contact.name}</div>
                               <div className="text-[10px] text-slate-500 font-bold uppercase mt-1 flex items-center gap-2">
                                  <span className="text-blue-400">{contact.relation}</span>
                                  <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
                                  <span>{contact.phone}</span>
                               </div>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            <button 
                               onClick={() => editContact(contact)}
                               className="bg-blue-600/10 text-blue-500 p-3 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                            >
                               <Edit3 size={18} />
                            </button>
                            <a href={`tel:${contact.phone}`} className="bg-green-600/10 text-green-500 p-3 rounded-xl hover:bg-green-600 hover:text-white transition-all">
                               <Phone size={18} />
                            </a>
                            <button 
                               onClick={() => removeContact(contact)}
                               className="bg-red-600/10 text-red-500 p-3 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                            >
                               <Trash2 size={18} />
                            </button>
                         </div>
                      </div>
                   ))}
                </div>
              )}
           </section>

           <div className="mt-8 bg-blue-600/5 border border-blue-500/10 p-5 rounded-[1.5rem] flex gap-4 items-start">
             <Shield className="text-blue-400 shrink-0 mt-0.5" size={16} />
             <p className="text-[10px] text-slate-400 leading-relaxed">
               <span className="font-black text-blue-400 uppercase tracking-widest">Protocol:</span> These contacts will receive an automated SMS with your live location link the moment you trigger an SOS.
             </p>
           </div>
        </div>
      )}

      {activeTab === 'community' && (
        <div className="p-6 space-y-6 animate-in slide-in-from-right duration-500">
           <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Nearby Helpers</h3>
           {community.map(u => (
             <div key={u.id} className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex items-center gap-5 hover:border-blue-500 transition-all shadow-xl">
                <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center font-black text-white text-xl border-2 border-slate-700 shadow-inner">
                  {u.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-white text-sm truncate">{u.name}</h4>
                  <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.1em] mt-1">{u.rank}</p>
                </div>
                <FollowButton currentUserId={user.id} targetUserId={u.id} />
             </div>
           ))}
        </div>
      )}

      {newBadge && <BadgeUnlockModal badge={newBadge} onClose={() => setNewBadge(null)} />}

      {/* Footer / Copyright */}
      <footer className="mt-12 py-8 flex flex-col items-center gap-2 opacity-40">
        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 text-center">
          © 2025 {APP_NAME}. All rights reserved.
        </div>
        <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 text-center">
          Made with ❤️ by <span className="text-blue-400 font-black">Indians For India</span>
        </div>
      </footer>
    </div>
  );
};
