import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Send, Trash2, UserX, ShieldAlert, Ban } from 'lucide-react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  Timestamp,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { toast } from 'sonner';

interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  createdAt: Timestamp;
}

interface LiveChatProps {
  matchId: string;
}

const LiveChat: React.FC<LiveChatProps> = ({ matchId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveChatDisabled, setIsLiveChatDisabled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!matchId) return;

    // Listen for global chat settings (to check if disabled)
    const settingsRef = doc(db, 'settings', 'livechat');
    const unsubscribeSettings = onSnapshot(settingsRef, (doc) => {
      if (doc.exists()) {
        setIsLiveChatDisabled(doc.data().disabled || false);
      }
    });

    const chatRef = collection(db, 'chats', matchId, 'messages');
    const q = query(chatRef, orderBy('createdAt', 'asc'), limit(50));

    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
      setIsLoading(false);
      
      // Scroll to bottom on new messages
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    });

    return () => {
      unsubscribeSettings();
      unsubscribeMessages();
    };
  }, [matchId]);

  const handleBanUser = async (userId: string, userName: string) => {
    if (!user?.isAdmin) return;
    if (confirm(`Are you sure you want to ban ${userName}?`)) {
      try {
        await updateDoc(doc(db, 'users', userId), {
          isBanned: true,
          bannedAt: serverTimestamp(),
          bannedBy: user.uid
        });
        toast.success(`User ${userName} has been banned.`);
      } catch (error) {
        console.error('Error banning user:', error);
        toast.error('Failed to ban user.');
      }
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!user?.isAdmin) return;
    try {
      await deleteDoc(doc(db, 'chats', matchId, 'messages', messageId));
      toast.success('Message deleted.');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message.');
    }
  };

  const handleToggleLiveChat = async () => {
    if (!user?.isAdmin) return;
    const newState = !isLiveChatDisabled;
    try {
      await setDoc(doc(db, 'settings', 'livechat'), {
        disabled: newState,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      }, { merge: true });
      toast.success(newState ? 'Livechat disabled globally.' : 'Livechat enabled globally.');
    } catch (error) {
      console.error('Error toggling livechat:', error);
      toast.error('Failed to update livechat status.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !matchId) return;

    if (isLiveChatDisabled && !user.isAdmin) {
      toast.error('Livechat is currently disabled.');
      return;
    }

    if (user.isBanned) {
      toast.error('You are banned from the livechat.');
      return;
    }

    try {
      const chatRef = collection(db, 'chats', matchId, 'messages');
      await addDoc(chatRef, {
        text: newMessage.trim(),
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userPhoto: user.photoURL,
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message.');
    }
  };

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden shadow-2xl">
      {/* Chat Header */}
      <div className="px-4 py-3 bg-neutral-900/50 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-indigo-400" />
          <span className="text-white text-xs font-black uppercase tracking-widest">Live Match Chat</span>
          {user?.isAdmin && (
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-6 w-6 ml-2 ${isLiveChatDisabled ? 'text-red-500' : 'text-neutral-500'}`}
              onClick={handleToggleLiveChat}
              title={isLiveChatDisabled ? "Enable Livechat" : "Disable Livechat"}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${isLiveChatDisabled ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />
          <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-tighter">
            {isLiveChatDisabled ? 'Disabled' : 'Live'}
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
        style={{ scrollBehavior: 'smooth' }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-600 space-y-2">
            <MessageSquare className="h-8 w-8 opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-widest">No messages yet</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Avatar className="h-7 w-7 border border-neutral-800 shrink-0">
                <AvatarImage src={msg.userPhoto} />
                <AvatarFallback className="bg-neutral-900 text-[10px] font-bold text-neutral-400">
                  {getInitials(msg.userName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-[11px] font-black text-indigo-400 uppercase tracking-wide truncate">
                    {msg.userName}
                  </span>
                  <span className="text-[9px] text-neutral-600 font-mono">
                    {msg.createdAt ? new Date(msg.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                  </span>
                </div>
                <div className="group relative bg-neutral-900/80 border border-neutral-800/50 px-3 py-2 rounded-2xl rounded-tl-none">
                  <p className="text-xs text-neutral-300 leading-relaxed break-words">{msg.text}</p>
                  
                  {user?.isAdmin && (
                    <div className="absolute -right-2 -top-2 hidden group-hover:flex gap-1">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-6 w-6 rounded-full"
                        onClick={() => handleDeleteMessage(msg.id)}
                        title="Delete message"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      {msg.userId !== user.uid && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-6 w-6 rounded-full bg-orange-600 hover:bg-orange-700"
                          onClick={() => handleBanUser(msg.userId, msg.userName)}
                          title="Ban user"
                        >
                          <Ban className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-neutral-900/30 border-t border-neutral-900">
        {isLiveChatDisabled && !user?.isAdmin ? (
          <div className="text-center py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-[10px] text-red-400 font-black uppercase tracking-widest">
              Livechat is temporary disabled.
            </p>
          </div>
        ) : user?.isBanned ? (
          <div className="text-center py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-[10px] text-red-400 font-black uppercase tracking-widest">
              You have been banned from livechat.
            </p>
          </div>
        ) : user ? (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="bg-neutral-950 border-neutral-800 text-xs h-10 rounded-xl focus-visible:ring-indigo-500/50"
              disabled={isLiveChatDisabled && !user.isAdmin}
            />
            <Button 
              type="submit" 
              disabled={!newMessage.trim() || (isLiveChatDisabled && !user.isAdmin)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white h-10 w-10 p-0 rounded-xl shrink-0 transition-all active:scale-95"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <div className="text-center py-2">
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-2">Sign in to join the chat</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.href = '/login'}
              className="border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900 text-[10px] font-black uppercase tracking-widest h-8 rounded-lg"
            >
              Login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveChat;
