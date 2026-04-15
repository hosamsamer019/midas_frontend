"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Send, Inbox, Eye, EyeOff, Search, Paperclip, Archive, ArchiveRestore, Radio as Broadcast, X, Link, Calendar, Filter, Download, Plus } from "lucide-react";

interface Message {
  id: number;
  sender: {
    id: number;
    email: string;
    username: string;
  };
  recipient: {
    id: number;
    email: string;
    username: string;
  } | null;
  subject: string;
  content: string;
  read_status: boolean;
  timestamp: string;
  message_type: 'direct' | 'contextual' | 'broadcast';
  is_archived: boolean;
  content_object_type?: string;
  content_object_repr?: string;
  department?: string;
  date_range_start?: string;
  date_range_end?: string;
  attachments: Array<{
    id: number;
    file: string;
    uploaded_at: string;
  }>;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface Entity {
  id: number;
  name: string;
  type: string;
}

export default function Messages() {
  const { user } = useAuth();
  const API_BASE = API_BASE_URL;
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'archived'>('inbox');
  const [showComposeSidebar, setShowComposeSidebar] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSender, setSearchSender] = useState('');
  const [searchType, setSearchType] = useState('');

  // Compose form state
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [messageType, setMessageType] = useState<'direct' | 'contextual' | 'broadcast'>('direct');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [department, setDepartment] = useState('');
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');

  useEffect(() => {
    if (user) {
      fetchMessages();
      fetchUsers();
      fetchEntities();
    }
  }, [user, activeTab]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        fetchMessages();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [user, activeTab]);

  const fetchMessages = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      let url = `${API_BASE}/api/messaging/messages/`;
      if (activeTab === 'archived') {
        url += "archived/";
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const allMessages: Message[] = await response.json();
        setMessages(allMessages);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/users/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const allUsers: User[] = await response.json();
        // Filter users based on role permissions
        let allowedUsers = allUsers;

        if (user?.role === 'doctor') {
          // Doctors can message admin or doctors
          allowedUsers = allUsers.filter(u => u.role === 'admin' || u.role === 'doctor');
        } else if (user?.role === 'lab') {
          // Lab can only message admin
          allowedUsers = allUsers.filter(u => u.role === 'admin');
        }
        // Admin can message all users

        setUsers(allowedUsers);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchEntities = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      // Fetch bacteria, antibiotics, samples, etc.
      const [bacteriaRes, antibioticsRes, samplesRes] = await Promise.all([
        fetch(`${API_BASE}/api/bacteria/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/antibiotics/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/samples/`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const entities: Entity[] = [];

      if (bacteriaRes.ok) {
        const bacteria = await bacteriaRes.json();
        entities.push(...bacteria.map((b: any) => ({ id: b.id, name: b.name, type: 'bacteria' })));
      }

      if (antibioticsRes.ok) {
        const antibiotics = await antibioticsRes.json();
        entities.push(...antibiotics.map((a: any) => ({ id: a.id, name: a.name, type: 'antibiotic' })));
      }

      if (samplesRes.ok) {
        const samples = await samplesRes.json();
        entities.push(...samples.map((s: any) => ({ id: s.id, name: `Sample ${s.patient_id}`, type: 'sample' })));
      }

      setEntities(entities);
    } catch (error) {
      console.error("Failed to fetch entities:", error);
    }
  };

  const sendMessage = async () => {
    const token = localStorage.getItem('access_token');
    if (!token || (messageType !== 'broadcast' && !recipientEmail) || !subject || !content) return;

    try {
      let recipientId = null;
      if (messageType !== 'broadcast') {
        const recipient = users.find(u => u.email === recipientEmail);
        if (!recipient) return;
        recipientId = recipient.id;
      }

      const formData = new FormData();
      formData.append('recipient', recipientId?.toString() || '');
      formData.append('subject', subject);
      formData.append('content', content);
      formData.append('message_type', messageType);

      if (messageType === 'contextual' && selectedEntity) {
        formData.append('content_type', selectedEntity.type);
        formData.append('object_id', selectedEntity.id.toString());
      }

      if (department) formData.append('department', department);
      if (dateRangeStart) formData.append('date_range_start', dateRangeStart);
      if (dateRangeEnd) formData.append('date_range_end', dateRangeEnd);

      attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });

      const response = await fetch(`${API_BASE}/api/messaging/messages/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        setShowComposeSidebar(false);
        resetComposeForm();
        fetchMessages();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const resetComposeForm = () => {
    setRecipientEmail('');
    setSubject('');
    setContent('');
    setMessageType('direct');
    setAttachments([]);
    setSelectedEntity(null);
    setDepartment('');
    setDateRangeStart('');
    setDateRangeEnd('');
  };

  const archiveMessage = async (messageId: number) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      await fetch(`${API_BASE}/api/messaging/messages/${messageId}/archive/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchMessages();
      setSelectedMessage(null);
    } catch (error) {
      console.error("Failed to archive message:", error);
    }
  };

  const unarchiveMessage = async (messageId: number) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      await fetch(`${API_BASE}/api/messaging/messages/${messageId}/unarchive/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchMessages();
      setSelectedMessage(null);
    } catch (error) {
      console.error("Failed to unarchive message:", error);
    }
  };

  const deleteMessage = async (messageId: number) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      await fetch(`${API_BASE}/api/messaging/messages/${messageId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchMessages();
      setSelectedMessage(null);
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const markAsRead = async (messageId: number) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      await fetch(`${API_BASE}/api/messaging/messages/${messageId}/mark_read/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchMessages();
    } catch (error) {
      console.error("Failed to mark message as read:", error);
    }
  };

  const performSearch = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      let url = `${API_BASE}/api/messaging/messages/search/?`;
      if (searchQuery) url += `q=${encodeURIComponent(searchQuery)}&`;
      if (searchSender) url += `sender=${encodeURIComponent(searchSender)}&`;
      if (searchType) url += `message_type=${searchType}&`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const results: Message[] = await response.json();
        setMessages(results);
      }
    } catch (error) {
      console.error("Failed to search messages:", error);
    }
  };

  const filteredMessages = messages.filter(message => {
    if (activeTab === 'inbox') {
      return message.recipient?.id === user?.id && !message.is_archived;
    } else if (activeTab === 'sent') {
      return message.sender.id === user?.id && !message.is_archived;
    } else if (activeTab === 'archived') {
      return (message.sender.id === user?.id || message.recipient?.id === user?.id || message.message_type === 'broadcast') && message.is_archived;
    }
    return false;
  });

  const unreadCount = messages.filter(m => !m.read_status && m.recipient?.id === user?.id && !m.is_archived).length;

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading messages...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <Broadcast className="h-6 w-6 mr-2" />
          Messages
        </h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowSearch(!showSearch)}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          {user?.role !== 'viewer' && (
            <Button onClick={() => setShowComposeSidebar(true)}>
              <Mail className="h-4 w-4 mr-2" />
              Compose Message
            </Button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Input
                placeholder="Sender email..."
                value={searchSender}
                onChange={(e) => setSearchSender(e.target.value)}
              />
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger>
                  <SelectValue placeholder="Message type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="search-all" value="">All types</SelectItem>
                  <SelectItem key="search-direct" value="direct">Direct</SelectItem>
                  <SelectItem key="search-contextual" value="contextual">Contextual</SelectItem>
                  <SelectItem key="search-broadcast" value="broadcast">Broadcast</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={performSearch}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <Button
          variant={activeTab === 'inbox' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('inbox')}
          className="flex items-center space-x-2"
        >
          <Inbox className="h-4 w-4" />
          <span>Inbox</span>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount}
            </Badge>
          )}
        </Button>
        <Button
          variant={activeTab === 'sent' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('sent')}
          className="flex items-center space-x-2"
        >
          <Send className="h-4 w-4" />
          <span>Sent</span>
        </Button>
        {user?.role === 'admin' && (
          <Button
            variant={activeTab === 'archived' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('archived')}
            className="flex items-center space-x-2"
          >
            <Archive className="h-4 w-4" />
            <span>Archived</span>
          </Button>
        )}
      </div>

      {/* Messages List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          {filteredMessages.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No messages in {activeTab}
              </CardContent>
            </Card>
          ) : (
            filteredMessages.map((message) => (
              <Card
                key={message.id}
                className={`cursor-pointer transition-colors ${
                  selectedMessage?.id === message.id ? 'ring-2 ring-primary' : ''
                } ${!message.read_status && activeTab === 'inbox' ? 'bg-blue-50 dark:bg-blue-950' : ''}`}
                onClick={() => {
                  setSelectedMessage(message);
                  if (!message.read_status && activeTab === 'inbox') {
                    markAsRead(message.id);
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm">
                      {activeTab === 'inbox' ? message.sender.email : `To: ${message.recipient?.email || 'Broadcast'}`}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-medium mb-1 line-clamp-1">{message.subject}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{message.content}</p>
                  {message.content_object_type && (
                    <div className="flex items-center mt-2">
                      <Link className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-xs text-green-600">
                        Linked to {message.content_object_type}: {message.content_object_repr}
                      </span>
                    </div>
                  )}
                  {message.attachments.length > 0 && (
                    <div className="flex items-center mt-1">
                      <Paperclip className="h-3 w-3 text-gray-500 mr-1" />
                      <span className="text-xs text-gray-600">
                        {message.attachments.length} attachment{message.attachments.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  {!message.read_status && activeTab === 'inbox' && (
                    <div className="flex items-center mt-2">
                      <EyeOff className="h-3 w-3 text-blue-500 mr-1" />
                      <span className="text-xs text-blue-600">Unread</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{selectedMessage.subject}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-normal text-muted-foreground">
                      {new Date(selectedMessage.timestamp).toLocaleString()}
                    </span>
                    <div className="flex space-x-1">
                      {activeTab !== 'archived' && (
                        <Button variant="outline" size="sm" onClick={() => archiveMessage(selectedMessage.id)}>
                          <Archive className="h-4 w-4 mr-1" />
                          Archive
                        </Button>
                      )}
                      {activeTab === 'archived' && user?.role === 'admin' && (
                        <Button variant="outline" size="sm" onClick={() => unarchiveMessage(selectedMessage.id)}>
                          <ArchiveRestore className="h-4 w-4 mr-1" />
                          Unarchive
                        </Button>
                      )}
                      {user?.role === 'admin' && (
                        <Button variant="destructive" size="sm" onClick={() => deleteMessage(selectedMessage.id)}>
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  <span>From: {selectedMessage.sender.email}</span>
                  {activeTab === 'sent' && (
                    <span className="ml-4">To: {selectedMessage.recipient?.email || 'Broadcast'}</span>
                  )}
                  {selectedMessage.content_object_type && (
                    <div className="mt-2">
                      <Badge variant="secondary">
                        <Link className="h-3 w-3 mr-1" />
                        Linked to {selectedMessage.content_object_type}: {selectedMessage.content_object_repr}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap mb-4">{selectedMessage.content}</div>
                {selectedMessage.attachments.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Attachments:</h4>
                    <div className="space-y-2">
                      {selectedMessage.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center space-x-2">
                          <Paperclip className="h-4 w-4" />
                          <a
                            href={attachment.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {attachment.file.split('/').pop()}
                          </a>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Select a message to view details
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Compose Sidebar */}
      {showComposeSidebar && (
        <div className="fixed inset-y-0 right-0 w-96 bg-card border-l border-border p-6 space-y-4 z-50 overflow-y-auto">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Compose Message</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowComposeSidebar(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message Type</label>
            <Select value={messageType} onValueChange={(value: 'direct' | 'contextual' | 'broadcast') => setMessageType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="msg-direct" value="direct">Direct</SelectItem>
                <SelectItem key="msg-contextual" value="contextual">Contextual</SelectItem>
                {user?.role === 'admin' && <SelectItem key="msg-broadcast" value="broadcast">Broadcast</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          {messageType === 'contextual' && (
            <div>
              <label className="block text-sm font-medium mb-1">Link to Entity</label>
              <Select value={selectedEntity?.id.toString() || ''} onValueChange={(value) => {
                const entity = entities.find(e => e.id.toString() === value);
                setSelectedEntity(entity || null);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select entity to link" />
                </SelectTrigger>
                <SelectContent>
                  {entities.map((entity) => (
                    <SelectItem key={`entity-${entity.type}-${entity.id}`} value={entity.id.toString()}>
                      {entity.type}: {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {messageType !== 'broadcast' && (
            <div>
              <label className="block text-sm font-medium mb-1">Recipient</label>
              <Select value={recipientEmail} onValueChange={setRecipientEmail}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={`user-${u.id}`} value={u.email}>
                      {u.email} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your message"
              rows={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Department (Optional)</label>
            <Input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g., ICU, Surgery"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Date From (Optional)</label>
              <Input
                type="date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date To (Optional)</label>
              <Input
                type="date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Attachments</label>
            <Input
              type="file"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setAttachments(files);
              }}
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif"
            />
            {attachments.length > 0 && (
              <div className="mt-2 text-sm text-muted-foreground">
                {attachments.length} file{attachments.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowComposeSidebar(false)}>
              Cancel
            </Button>
            <Button onClick={sendMessage} disabled={!recipientEmail && messageType !== 'broadcast' || !subject || !content}>
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
