import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Send, Users, User, GraduationCap, Plus, Search, 
  CheckCircle, Hash, X, RefreshCw
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/api';

interface UserItem {
  _id: string;
  fullName?: string;
  email?: string;
  role: string;
  studentId?: string;
  phone?: string;
  teacherMessage?: string;
  studentMessage?: string;
}

interface GroupItem {
  _id: string;
  name: string;
  description?: string;
  members: UserItem[];
  tutorId?: string;
  createdAt?: string;
}

export const TeacherMessagesManagement = () => {
  const [activeTab, setActiveTab] = useState<'parents' | 'students' | 'groups'>('parents');
  const [parents, setParents] = useState<UserItem[]>([]);
  const [students, setStudents] = useState<UserItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChat, setSelectedChat] = useState<{ type: 'private' | 'group'; data: UserItem | GroupItem } | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [sending, setSending] = useState(false);
  
  // Group creation modal state
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const adminId = localStorage.getItem('userId') || '60c72b2f9b1d8b001c8e4a99'; // Admin ID

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Initial Data Fetch
  const fetchData = async () => {
    setLoading(true);
    try {
      const [parentsRes, studentsRes, groupsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/users?role=parent`),
        fetch(`${API_BASE_URL}/api/users?role=student`),
        fetch(`${API_BASE_URL}/api/groups`)
      ]);

      const parentsData = await parentsRes.json();
      const studentsData = await studentsRes.json();
      const groupsData = await groupsRes.json();

      setParents(Array.isArray(parentsData) ? parentsData : []);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setGroups(Array.isArray(groupsData) ? groupsData : []);
    } catch (err) {
      console.error('Error fetching communication data:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedChatRef = useRef(selectedChat);
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    fetchData();

    // Socket setup
    const newSocket = io(API_BASE_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('joinRoom', adminId);
      newSocket.emit('joinRoom', '60c72b2f9b1d8b001c8e4a99');
      newSocket.emit('joinRoom', 'admin');
    });

    newSocket.on('receiveMessage', (msg: any) => {
      const currentChat = selectedChatRef.current;
      if (!currentChat) return;

      if (currentChat.type === 'private') {
        const activeId = currentChat.data._id;
        const activeEmail = (currentChat.data as UserItem).email;
        const isMatch = msg.senderId === activeId || msg.senderId === activeEmail || msg.receiverId === activeId || msg.receiverId === activeEmail;
        if (isMatch) {
          setMessages((prev) => {
            if (prev.some(m => m.content === msg.content && (m._id === msg._id || Math.abs(new Date(m.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 2000))) {
              return prev;
            }
            return [...prev, msg];
          });
          scrollToBottom();
        }
      } else if (currentChat.type === 'group') {
        if (msg.groupId === currentChat.data._id) {
          setMessages((prev) => {
            if (prev.some(m => m.content === msg.content && (m._id === msg._id || Math.abs(new Date(m.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 2000))) {
              return prev;
            }
            return [...prev, msg];
          });
          scrollToBottom();
        }
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [adminId]);

  // Load chat messages when a conversation is selected
  useEffect(() => {
    if (!selectedChat) return;

    if (selectedChat.type === 'private') {
      const userId = selectedChat.data._id;
      fetch(`${API_BASE_URL}/api/chat/between/${adminId}/${userId}`)
        .then((res) => res.json())
        .then((data) => {
          setMessages(Array.isArray(data) ? data : []);
          scrollToBottom();
        })
        .catch((err) => console.error('Error fetching private chat:', err));
    } else {
      const groupId = selectedChat.data._id;
      if (socket) {
        socket.emit('joinGroup', groupId);
      }
      fetch(`${API_BASE_URL}/api/chat/group/${groupId}`)
        .then((res) => res.json())
        .then((data) => {
          setMessages(Array.isArray(data) ? data : []);
          scrollToBottom();
        })
        .catch((err) => console.error('Error fetching group chat:', err));
    }
  }, [selectedChat]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChat) return;
    const text = messageInput.trim();
    setMessageInput('');
    setSending(true);

    if (selectedChat.type === 'private') {
      const receiverId = selectedChat.data._id;
      const newMsg = {
        senderId: adminId,
        receiverId,
        content: text,
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, newMsg]);
      scrollToBottom();

      if (socket) {
        socket.emit('sendPrivateMessage', {
          senderId: adminId,
          receiverId,
          content: text
        });
      }

      await fetch(`${API_BASE_URL}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: adminId,
          receiverId,
          content: text
        })
      }).catch(err => console.error(err));
    } else {
      const groupId = selectedChat.data._id;
      const newMsg = {
        senderId: adminId,
        groupId,
        content: text,
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, newMsg]);
      scrollToBottom();

      if (socket) {
        socket.emit('sendGroupMessage', {
          senderId: adminId,
          groupId,
          content: text
        });
      }

      await fetch(`${API_BASE_URL}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: adminId,
          groupId,
          content: text
        })
      }).catch(err => console.error(err));
    }

    setSending(false);
  };

  // Handle group creation
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    setCreatingGroup(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName.trim(),
          description: newGroupDesc.trim(),
          members: selectedMemberIds,
          tutorId: adminId
        })
      });

      if (res.ok) {
        const createdGroup = await res.json();
        setGroups((prev) => [createdGroup, ...prev]);
        setIsGroupModalOpen(false);
        setNewGroupName('');
        setNewGroupDesc('');
        setSelectedMemberIds([]);
        // Select newly created group
        setSelectedChat({ type: 'group', data: createdGroup });
        setActiveTab('groups');
      } else {
        alert('Failed to create group');
      }
    } catch (err) {
      console.error('Error creating group:', err);
      alert('Error creating group');
    } finally {
      setCreatingGroup(false);
    }
  };

  const toggleMemberSelection = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  // Filtered lists based on search
  const filteredParents = parents.filter(
    (p) =>
      p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStudents = students.filter(
    (s) =>
      s.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allAvailableUsers = [...parents, ...students].filter(
    (u) =>
      u.fullName?.toLowerCase().includes(groupSearchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(groupSearchTerm.toLowerCase()) ||
      (u.studentId && u.studentId.toLowerCase().includes(groupSearchTerm.toLowerCase()))
  );

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-600" /> Message Dashboard
          </h2>
          <p className="text-sm text-gray-500">
            Real-time chat center for Individual Parents, Students & Custom Learning Groups
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsGroupModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> Create New Group
          </button>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex">
        
        {/* Left Sidebar - Contacts & Groups List */}
        <div className="w-full md:w-80 lg:w-96 border-r border-gray-200 flex flex-col bg-gray-50/50">
          
          {/* Search Bar */}
          <div className="p-3 border-b border-gray-200 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search chats or members..."
                className="w-full pl-9 pr-4 py-2 bg-gray-100 border border-transparent rounded-xl text-xs text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 bg-white text-xs font-bold">
            <button
              onClick={() => setActiveTab('parents')}
              className={`flex-1 py-3 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'parents'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/30'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Parents ({parents.length})
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`flex-1 py-3 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'students'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/30'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" /> Students ({students.length})
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`flex-1 py-3 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'groups'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/30'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Hash className="w-3.5 h-3.5" /> Groups ({groups.length})
            </button>
          </div>

          {/* Chat List Body */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {activeTab === 'parents' && (
              filteredParents.length > 0 ? (
                filteredParents.map((parent) => {
                  const isSelected = selectedChat?.type === 'private' && selectedChat.data._id === parent._id;
                  return (
                    <div
                      key={parent._id}
                      onClick={() => setSelectedChat({ type: 'private', data: parent })}
                      className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                        isSelected ? 'bg-emerald-500/10 border-l-4 border-emerald-600' : 'hover:bg-gray-100/70'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm flex-shrink-0">
                        {parent.fullName ? parent.fullName.charAt(0).toUpperCase() : 'P'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h4 className="font-bold text-gray-900 text-sm truncate">{parent.fullName || 'Parent'}</h4>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                            Parent
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{parent.email}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-gray-400 text-xs">No parents found</div>
              )
            )}

            {activeTab === 'students' && (
              filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const isSelected = selectedChat?.type === 'private' && selectedChat.data._id === student._id;
                  return (
                    <div
                      key={student._id}
                      onClick={() => setSelectedChat({ type: 'private', data: student })}
                      className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                        isSelected ? 'bg-emerald-500/10 border-l-4 border-emerald-600' : 'hover:bg-gray-100/70'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-sm flex-shrink-0">
                        {student.fullName ? student.fullName.charAt(0).toUpperCase() : 'S'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h4 className="font-bold text-gray-900 text-sm truncate">{student.fullName}</h4>
                          <span className="text-[10px] font-mono font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                            {student.studentId || 'Student'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{student.email}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-gray-400 text-xs">No students found</div>
              )
            )}

            {activeTab === 'groups' && (
              filteredGroups.length > 0 ? (
                filteredGroups.map((group) => {
                  const isSelected = selectedChat?.type === 'group' && selectedChat.data._id === group._id;
                  return (
                    <div
                      key={group._id}
                      onClick={() => setSelectedChat({ type: 'group', data: group })}
                      className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                        isSelected ? 'bg-emerald-500/10 border-l-4 border-emerald-600' : 'hover:bg-gray-100/70'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm flex-shrink-0">
                        <Hash className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h4 className="font-bold text-gray-900 text-sm truncate">{group.name}</h4>
                          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                            {group.members ? group.members.length : 0} members
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {group.description || 'Group conversation'}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-gray-400 text-xs">
                  No groups created yet.<br />
                  <button
                    onClick={() => setIsGroupModalOpen(true)}
                    className="mt-2 text-emerald-600 font-bold hover:underline"
                  >
                    + Create Group
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        {/* Right Active Chat Window */}
        <div className="flex-1 flex flex-col bg-[#efeae2]/30 relative">
          {selectedChat ? (
            <>
              {/* Chat Active Header */}
              <div className="p-3.5 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base ${
                      selectedChat.type === 'group'
                        ? 'bg-emerald-600'
                        : (selectedChat.data as UserItem).role === 'parent'
                        ? 'bg-blue-600'
                        : 'bg-red-600'
                    }`}
                  >
                    {selectedChat.type === 'group' ? (
                      <Hash className="w-5 h-5" />
                    ) : (
                      (selectedChat.data as UserItem).fullName?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base leading-tight">
                      {selectedChat.type === 'group' ? (selectedChat.data as GroupItem).name : (selectedChat.data as UserItem).fullName}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {selectedChat.type === 'group' ? (
                        <>Group • {(selectedChat.data as GroupItem).members?.length || 0} Members</>
                      ) : (
                        <>{(selectedChat.data as UserItem).email} {(selectedChat.data as UserItem).studentId ? `(${ (selectedChat.data as UserItem).studentId })` : ''}</>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#efeae2]/40">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl text-xs text-gray-500 shadow-sm border border-gray-100">
                      No messages yet. Send a message to start chatting!
                    </div>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const senderId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
                    const senderName = typeof msg.senderId === 'object' ? msg.senderId.fullName : 'User';
                    const isAdminMsg = senderId === adminId;

                    return (
                      <div
                        key={idx}
                        className={`flex flex-col ${isAdminMsg ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm text-sm ${
                            isAdminMsg
                              ? 'bg-emerald-600 text-white rounded-br-none'
                              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                          }`}
                        >
                          {selectedChat.type === 'group' && !isAdminMsg && (
                            <p className="text-[11px] font-bold text-emerald-700 mb-0.5">{senderName}</p>
                          )}
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          <span
                            className={`block text-[10px] text-right mt-1 ${
                              isAdminMsg ? 'text-emerald-100' : 'text-gray-400'
                            }`}
                          >
                            {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
                <textarea
                  rows={1}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-emerald-500 focus:outline-none resize-none transition-all"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sending}
                  className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all disabled:opacity-40 flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">Academy Communication Center</h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Select a parent, student, or group from the left sidebar to start messaging in real-time.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create New Group */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Hash className="w-5 h-5 text-emerald-600" /> Create Learning Group
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Add students and parents to a group chat</p>
              </div>
              <button
                onClick={() => setIsGroupModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Group Name *</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Physics Class 12 - Batch A"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-medium focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Group Description</label>
                <input
                  type="text"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="e.g. Live class updates & homework discussion"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-medium focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-gray-700">Select Members ({selectedMemberIds.length} selected)</label>
                </div>
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={groupSearchTerm}
                    onChange={(e) => setGroupSearchTerm(e.target.value)}
                    placeholder="Search users..."
                    className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                  />
                </div>

                <div className="border border-gray-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-gray-100 bg-gray-50/50 p-1">
                  {allAvailableUsers.length > 0 ? (
                    allAvailableUsers.map((u) => {
                      const isChecked = selectedMemberIds.includes(u._id);
                      return (
                        <label
                          key={u._id}
                          className="flex items-center justify-between p-2 hover:bg-white rounded-lg cursor-pointer text-xs transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleMemberSelection(u._id)}
                              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                            />
                            <div>
                              <p className="font-bold text-gray-900">{u.fullName || u.email}</p>
                              <p className="text-[10px] text-gray-400">
                                {u.role.toUpperCase()} {u.studentId ? `• ${u.studentId}` : ''}
                              </p>
                            </div>
                          </div>
                          {isChecked && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                        </label>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-gray-400">No users found</div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setIsGroupModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || creatingGroup}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs disabled:opacity-40 shadow-sm"
              >
                {creatingGroup ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
