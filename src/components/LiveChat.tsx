import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Send } from 'lucide-react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';

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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!matchId) return;

    const chatRef = collection(db, 'chats', matchId, 'messages');
    const q = query(chatRef, orderBy('createdAt', 'asc'), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
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

    return () => unsubscribe();
  }, [matchId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !matchId) return;

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
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-tighter">Live</span>
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
                <div className="bg-neutral-900/80 border border-neutral-800/50 px-3 py-2 rounded-2xl rounded-tl-none">
                  <p className="text-xs text-neutral-300 leading-relaxed break-words">{msg.text}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-neutral-900/30 border-t border-neutral-900">
        {user ? (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="bg-neutral-950 border-neutral-800 text-xs h-10 rounded-xl focus-visible:ring-indigo-500/50"
            />
            <Button 
              type="submit" 
              disabled={!newMessage.trim()}
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
