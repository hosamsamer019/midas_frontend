"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Mail, Send, Inbox, Eye, EyeOff, Search, Paperclip, Archive, ArchiveRestore, 
  Radio as Broadcast, X, Link, Calendar, Filter, Download, Plus, Star, 
  ChevronLeft, ChevronRight, SortAsc, SortDesc, FilterX, FileText, ChevronUp, ChevronDown
} from "lucide-react";

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
  is_starred: boolean;
  content_object_type?: string;
  content_object_repr?: string;
  department?: string;
  date_range_start?: string;
  date_range_end?: string;
  read_at?: string;
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

interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
}

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: "1",
    name: "General Inquiry",
    subject: "Question about patient data",
    content: "Hello,\n\nI have a question regarding the patient data analysis.\n\nPlease advise.\n\nBest regards"
  },
  {
    id: "2",
    name: "Urgent Report",
    subject: "Urgent: Critical Results",
    content: "Hello,\n\nThis is an urgent matter requiring immediate attention.\n\nPlease review the attached results.\n\nThank you"
  },
  {
    id: "3",
    name: "Follow-up",
    subject: "Follow-up on previous discussion",
    content: "Hello,\n\nFollowing up on our previous discussion...\n\nLooking forward to your response.\n\nBest"
  },
  {
    id: "4",
    name: "Data Request",
    subject: "Data Request",
    content: "Hello,\n\nI would like to request the following data:\n\n- \n- \n\nPlease provide this at your earliest convenience.\n\nThank you"
  },
  {
    id: "5",
    name: "Acknowledgment",
    subject: "Acknowledgment of Receipt",
    content: "Hello,\n\nI have received your message and will review the contents.\n\nI will get back to you shortly.\n\nBest regards"
  }
];

const ITEMS_PER_PAGE = 10;

export default function Messages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'archived' | 'starred'>('inbox');
  const [showComposeSidebar, setShowComposeSidebar] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  
  // Search & Filter State
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSender, setSearchSender] = useState('');
  const [searchType, setSearchType] = useState('');
  
  // Advanced Filter State
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterReadStatus, setFilterReadStatus] = useState<string>('all');
  const [filterHasAttachments, setFilterHasAttachments] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  
  // Sort State
  const [sortBy, setSortBy] = useState<'date' | 'sender' | 'subject'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Bulk Selection State
  const [selectedMessages, setSelectedMessages] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Template State
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates] = useState<MessageTemplate[]>(DEFAULT_TEMPLATES);

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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedMessages([]);
  }, [searchQuery, searchSender, searchType, filterReadStatus, filterHasAttachments, filterDateFrom, filterDateTo, sortBy, sortOrder, activeTab]);

  const fetchMessages = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      let url = "http://127.0.0.1:8000/api/messaging/messages/";
      if (activeTab === 'archived') {
        url += "archived/";
      } else if (activeTab === 'starred') {
        url += "starred/";
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
      const response = await fetch("http://127.0.0.1:8000/api/users/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const allUsers: User[] = await response.json();
        let allowedUsers = allUsers;

        if (user?.role === 'doctor') {
          allowedUsers = allUsers.filter(u => u.role === 'admin' || u.role === 'doctor');
        } else if (user?.role === 'lab') {
          allowedUsers = allUsers.filter(u => u.role === 'admin');
        }

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
      const [bacteriaRes, antibioticsRes, samplesRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/api/bacteria/", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://127.0.0.1:8000/api/antibiotics/", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://127.0.0.1:8000/api/samples/", { headers: { Authorization: `Bearer ${token}` } }),
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

      const response = await fetch("http://127.0.0.1:8000/api/messaging/messages/", {
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
      await fetch(`http://127.0.0.1:8000/api/messaging/messages/${messageId}/archive/`, {
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
      await fetch(`http://127.0.0.1:8000/api/messaging/messages/${messageId}/unarchive/`, {
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

  const toggleStarMessage = async (messageId: number) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      await fetch(`http://127.0.0.1:8000/api/messaging/messages/${messageId}/toggle_star/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchMessages();
    } catch (error) {
      console.error("Failed to toggle star:", error);
    }
  };

  const deleteMessage = async (messageId: number) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      await fetch(`http://127.0.0.1:8000/api/messaging/messages/${messageId}/`, {
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
      await fetch(`http://127.0.0.1:8000/api/messaging/messages/${messageId}/mark_read/`, {
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
      let url = "http://127.0.0.1:8000/api/messaging/messages/search/?";
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

  const bulkArchive = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    for (const msgId of selectedMessages) {
      await fetch(`http://127.0.0.1:8000/api/messaging/messages/${msgId}/archive/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    setSelectedMessages([]);
    setShowBulkActions(false);
    fetchMessages();
  };

  const bulkDelete = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    for (const msgId of selectedMessages) {
      await fetch(`http://127.0.0.1:8000/api/messaging/messages/${msgId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    setSelectedMessages([]);
    setShowBulkActions(false);
    fetchMessages();
  };

  const toggleSelectAll = () => {
    if (selectedMessages.length === filteredMessages.length) {
      setSelectedMessages([]);
    } else {
      setSelectedMessages(filteredMessages.map((m: Message) => m.id));
    }
  };

  const toggleSelectMessage = (msgId: number) => {
    if (selectedMessages.includes(msgId)) {
      setSelectedMessages(selectedMessages.filter(id => id !== msgId));
    } else {
      setSelectedMessages([...selectedMessages, msgId]);
    }
  };

  const applyTemplate = (template: MessageTemplate) => {
    setSubject(template.subject);
    setContent(template.content);
    setShowTemplates(false);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSearchSender('');
    setSearchType('');
    setFilterReadStatus('all');
    setFilterHasAttachments('all');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const filteredMessages = useMemo(() => {
    let filtered = messages.filter(message => {
      if (activeTab === 'inbox') {
        return message.recipient?.id === user?.id && !message.is_archived;
      } else if (activeTab === 'sent') {
        return message.sender.id === user?.id && !message.is_archived;
      } else if (activeTab === 'archived') {
        return (message.sender.id === user?.id || message.recipient?.id === user?.id || message.message_type === 'broadcast') && message.is_archived;
      } else if (activeTab === 'starred') {
        return message.is_starred;
      }
      return false;
    });

    // Apply search filters
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.subject.toLowerCase().includes(query) || 
        m.content.toLowerCase().includes(query)
      );
    }
    
    if (searchSender) {
      filtered = filtered.filter(m => 
        m.sender.email.toLowerCase().includes(searchSender.toLowerCase())
      );
    }
    
    if (searchType) {
      filtered = filtered.filter(m => m.message_type === searchType);
    }

    // Apply advanced filters
    if (filterReadStatus !== 'all') {
      filtered = filtered.filter(m => 
        filterReadStatus === 'read' ? m.read_status : !m.read_status
      );
    }
    
    if (filterHasAttachments !== 'all') {
      filtered = filtered.filter(m => 
        filterHasAttachments === 'yes' ? m.attachments.length > 0 : m.attachments.length === 0
      );
    }
    
    if (filterDateFrom) {
      filtered = filtered.filter(m => new Date(m.timestamp) >= new Date(filterDateFrom));
    }
    
    if (filterDateTo) {
      filtered = filtered.filter(m => new Date(m.timestamp) <= new Date(filterDateTo + 'T23:59:59'));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case 'sender':
          comparison = a.sender.email.localeCompare(b.sender.email);
          break;
        case 'subject':
          comparison = a.subject.localeCompare(b.subject);
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [messages, user, activeTab, searchQuery, searchSender, searchType, filterReadStatus, filterHasAttachments, filterDateFrom, filterDateTo, sortBy, sortOrder]);

  // Pagination
  const paginatedMessages = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    setTotalPages(Math.ceil(filteredMessages.length / ITEMS_PER_PAGE));
    return filteredMessages.slice(start, end);
  }, [filteredMessages, currentPage]);

  const unreadCount = messages.filter(m => !m.read_status && m.recipient?.id === user?.id && !m.is_archived).length;
  const starredCount = messages.filter(m => m.is_starred).length;

  const hasActiveFilters = searchQuery || searchSender || searchType || filterReadStatus !== 'all' || filterHasAttachments !== 'all' || filterDateFrom || filterDateTo;

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
          <Button variant="outline" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">Active</Badge>
            )}
          </Button>
          {user?.role !== 'viewer' && (
            <Button onClick={() => setShowComposeSidebar(true)}>
              <Mail className="h-4 w-4 mr-2" />
              Compose
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
              <div className="flex gap-2">
                <Button onClick={performSearch}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                {(searchQuery || searchSender || searchType) && (
                  <Button variant="outline" onClick={() => { setSearchQuery(''); setSearchSender(''); setSearchType(''); }}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Advanced Filters</CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  <FilterX className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Read Status</label>
                <Select value={filterReadStatus} onValueChange={setFilterReadStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Has Attachments</label>
                <Select value={filterHasAttachments} onValueChange={setFilterHasAttachments}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date From</label>
                <Input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date To</label>
                <Input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sort Options & Bulk Actions */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Select value={sortBy} onValueChange={(v: 'date' | 'sender' | 'subject') => setSortBy(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="sender">Sender</SelectItem>
              <SelectItem value="subject">Subject</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
            {sortOrder === 'desc' ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />}
          </Button>
        </div>
        
        {selectedMessages.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selectedMessages.length} selected</span>
            <Button variant="outline" size="sm" onClick={bulkArchive}>
              <Archive className="h-4 w-4 mr-1" />
              Archive
            </Button>
            {user?.role === 'admin' && (
              <Button variant="destructive" size="sm" onClick={bulkDelete}>
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

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
        <Button
          variant={activeTab === 'starred' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('starred')}
          className="flex items-center space-x-2"
        >
          <Star className="h-4 w-4" />
          <span>Starred</span>
          {starredCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {starredCount}
            </Badge>
          )}
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
          {/* Select All Checkbox */}
          {paginatedMessages.length > 0 && (
            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                checked={selectedMessages.length === paginatedMessages.length && paginatedMessages.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-muted-foreground">Select all</span>
            </div>
          )}
          
          {paginatedMessages.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No messages in {activeTab}
              </CardContent>
            </Card>
          ) : (
            paginatedMessages.map((message) => (
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
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={selectedMessages.includes(message.id)}
                      onCheckedChange={() => toggleSelectMessage(message.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-sm truncate">
                          {activeTab === 'inbox' ? message.sender.email : `To: ${message.recipient?.email || 'Broadcast'}`}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleStarMessage(message.id); }}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                          >
                            <Star className={`h-3 w-3 ${message.is_starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                          </button>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <h3 className="font-medium mb-1 line-clamp-1">{message.subject}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{message.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {message.content_object_type && (
                          <div className="flex items-center">
                            <Link className="h-3 w-3 text-green-500 mr-1" />
                            <span className="text-xs text-green-600">
                              {message.content_object_type}
                            </span>
                          </div>
                        )}
                        {message.attachments.length > 0 && (
                          <div className="flex items-center">
                            <Paperclip className="h-3 w-3 text-gray-500 mr-1" />
                            <span className="text-xs text-gray-600">
                              {message.attachments.length}
                            </span>
                          </div>
                        )}
                        {!message.read_status && activeTab === 'inbox' && (
                          <div className="flex items-center">
                            <EyeOff className="h-3 w-3 text-blue-500 mr-1" />
                            <span className="text-xs text-blue-600">Unread</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
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
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleStarMessage(selectedMessage.id)}
                        title={selectedMessage.is_starred ? "Unstar" : "Star"}
                      >
                        <Star className={`h-4 w-4 ${selectedMessage.is_starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      </Button>
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
          
          {/* Templates Button */}
          <Button variant="outline" onClick={() => setShowTemplates(!showTemplates)} className="w-full">
            <FileText className="h-4 w-4 mr-2" />
            {showTemplates ? 'Hide Templates' : 'Use Template'}
          </Button>
          
          {/* Templates Dropdown */}
          {showTemplates && (
            <Card>
              <CardContent className="p-2 space-y-1">
                {templates.map((template) => (
                  <Button
                    key={template.id}
                    variant="ghost"
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => applyTemplate(template)}
                  >
                    <div>
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{template.subject}</div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}
          
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
              Send
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
