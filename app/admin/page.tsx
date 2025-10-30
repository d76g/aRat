

'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { 
  Users, 
  FileText, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Pause,
  Shield,
  Search,
  RefreshCw,
  Eye,
  ExternalLink,
  User,
  UserCog,
  Ban,
  Trash2
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'

interface Stats {
  users: {
    total: number
    pending: number
    approved: number
    suspended: number
    recent: number
  }
  content: {
    projects: number
    posts: number
    comments: number
    recentProjects: number
  }
}

interface User {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  bio?: string
  isAdmin: boolean
  status: string
  createdAt: string
  _count: {
    projects: number
    comments: number
  }
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [content, setContent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [contentType, setContentType] = useState('projects')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [moderationReason, setModerationReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedContent, setSelectedContent] = useState<any>(null)
  const [contentDialogOpen, setContentDialogOpen] = useState(false)

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    loadDashboardData()
  }, [session, status])

  // Auto-search when search query changes with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.length >= 2 || searchQuery.length === 0) {
        loadDashboardData()
      }
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, filterStatus])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load stats
      const statsResponse = await fetch('/api/admin/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats)
      }

      // Load users
      const searchParams = new URLSearchParams()
      if (filterStatus !== 'all') searchParams.append('status', filterStatus)
      if (searchQuery.trim()) searchParams.append('search', searchQuery.trim())
      
      const usersResponse = await fetch(`/api/admin/users?${searchParams.toString()}`)
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.users)
      }

      // Load content
      const contentResponse = await fetch(`/api/admin/content?type=${contentType}`)
      if (contentResponse.ok) {
        const contentData = await contentResponse.json()
        setContent(contentData[contentType] || contentData.projects || contentData.posts || contentData.comments || [])
      }

    } catch (error) {
      console.error('Failed to load admin data:', error)
      if (error instanceof Error && error.message.includes('403')) {
        toast.error('Admin access required')
        router.push('/')
      } else {
        toast.error('Failed to load admin dashboard')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUserStatusChange = async (userId: string, newStatus: string) => {
    if (!selectedUser) return
    
    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          reason: moderationReason 
        })
      })

      if (response.ok) {
        toast.success(`User ${newStatus.toLowerCase()} successfully`)
        setSelectedUser(null)
        setModerationReason('')
        setDialogOpen(false)
        loadDashboardData()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to update user status')
      }
    } catch (error) {
      toast.error('Failed to update user status')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      SUSPENDED: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-prieelo-cream to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-prieelo-cream to-white p-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-8 h-8 text-emerald-600" />
                Admin Dashboard
              </h1>
              <p className="text-slate-600 mt-2">Manage users and monitor content</p>
            </div>
            <Button
              onClick={loadDashboardData}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.users.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.users.recent} new this week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Users</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.users.pending}</div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting approval
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.content.projects}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.content.recentProjects} new this week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.content.comments}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all content
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="content">Content Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Search Users</CardTitle>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <div className="relative flex-1">
                      <Input
                        placeholder="Search by username, email, or name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pr-8"
                      />
                      {searchQuery && (
                        <Button
                          onClick={() => setSearchQuery('')}
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Search className="w-8 h-8 text-muted-foreground" />
                            <p className="text-muted-foreground">
                              {searchQuery 
                                ? `No users found matching "${searchQuery}"`
                                : `No users found with ${filterStatus === 'all' ? 'any' : filterStatus.toLowerCase()} status`
                              }
                            </p>
                            {searchQuery && (
                              <Button
                                onClick={() => {
                                  setSearchQuery('')
                                  setFilterStatus('all')
                                }}
                                variant="outline"
                                size="sm"
                              >
                                Clear search and show all users
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {user.firstName || user.lastName 
                                ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                                : user.username}
                            </p>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                            {user.isAdmin && (
                              <Badge variant="secondary" className="text-xs mt-1">Admin</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(user.status)}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{user._count.projects} projects</p>
                            <p className="text-muted-foreground">{user._count.comments} comments</p>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>
                          <Dialog open={dialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                            setDialogOpen(open)
                            if (!open) {
                              setSelectedUser(null)
                              setModerationReason('')
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setDialogOpen(true)
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Manage
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
                              <DialogHeader className="flex-shrink-0">
                                <DialogTitle>Manage User: {user.username}</DialogTitle>
                                <DialogDescription>
                                  Review user details and update their account status
                                </DialogDescription>
                              </DialogHeader>
                              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-xs text-slate-600">Username</Label>
                                    <p className="text-sm font-medium">@{user.username}</p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-slate-600">Email</Label>
                                    <p className="text-sm font-medium">{user.email}</p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-slate-600">Name</Label>
                                    <p className="text-sm font-medium">
                                      {user.firstName || user.lastName 
                                        ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                                        : 'Not provided'}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-slate-600">Current Status</Label>
                                    <Badge className={getStatusBadge(user.status)}>
                                      {user.status}
                                    </Badge>
                                  </div>
                                </div>
                                
                                {/* Show application details if available */}
                                {user.bio && (() => {
                                  try {
                                    const appData = JSON.parse(user.bio)
                                    if (appData.projectDescription) {
                                      return (
                                        <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                                          <h4 className="font-semibold text-sm">Remaker Application:</h4>
                                          <div>
                                            <Label className="text-xs text-slate-600">Project Description:</Label>
                                            <p className="text-sm mt-1">{appData.projectDescription}</p>
                                          </div>
                                          <div>
                                            <Label className="text-xs text-slate-600">Experience:</Label>
                                            <p className="text-sm mt-1">{appData.experience}</p>
                                          </div>
                                          <div>
                                            <Label className="text-xs text-slate-600">Motivation:</Label>
                                            <p className="text-sm mt-1">{appData.motivation}</p>
                                          </div>
                                          {appData.submittedAt && (
                                            <p className="text-xs text-slate-500">
                                              Submitted: {formatDate(appData.submittedAt)}
                                            </p>
                                          )}
                                        </div>
                                      )
                                    }
                                  } catch (e) {
                                    return null
                                  }
                                })()}
                                
                                <div>
                                  <Label htmlFor="reason">Reason (optional)</Label>
                                  <Textarea
                                    id="reason"
                                    value={moderationReason}
                                    onChange={(e) => setModerationReason(e.target.value)}
                                    placeholder="Enter reason for this action..."
                                    className="mt-2"
                                    rows={3}
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2 pt-4 border-t flex-shrink-0">
                                <Button
                                  onClick={() => handleUserStatusChange(user.id, 'APPROVED')}
                                  className="bg-green-600 hover:bg-green-700 flex-1"
                                  disabled={actionLoading}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  onClick={() => handleUserStatusChange(user.id, 'REJECTED')}
                                  variant="destructive"
                                  disabled={actionLoading}
                                  className="flex-1"
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                                <Button
                                  onClick={() => handleUserStatusChange(user.id, 'SUSPENDED')}
                                  variant="outline"
                                  disabled={actionLoading}
                                  className="flex-1"
                                >
                                  <Pause className="w-4 h-4 mr-1" />
                                  Suspend
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Monitoring</CardTitle>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="projects">Projects</SelectItem>
                    <SelectItem value="posts">Posts</SelectItem>
                    <SelectItem value="comments">Comments</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={loadDashboardData} variant="outline">
                  Load Content
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title/Content</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Engagement</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {content?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {item.title || item.content || 'Untitled'}
                            </p>
                            {item.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-xs">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {item.user ? `@${item.user.username}` : item.project?.user ? `@${item.project.user.username}` : 'Unknown'}
                            </p>
                            <Badge 
                              className={getStatusBadge(
                                item.user?.status || item.project?.user?.status || 'APPROVED'
                              )}
                            >
                              {item.user?.status || item.project?.user?.status || 'APPROVED'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {contentType === 'posts' && item.phaseType && (
                            <Badge variant="outline">{item.phaseType}</Badge>
                          )}
                          {contentType === 'projects' && (
                            <Badge variant="outline">Project</Badge>
                          )}
                          {contentType === 'comments' && (
                            <Badge variant="outline">Comment</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{item._count?.likes || 0} likes</p>
                            <p className="text-muted-foreground">{item._count?.comments || 0} comments</p>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(item.createdAt)}</TableCell>
                        <TableCell>
                          <Dialog open={contentDialogOpen && selectedContent?.id === item.id} onOpenChange={(open) => {
                            setContentDialogOpen(open)
                            if (!open) {
                              setSelectedContent(null)
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedContent(item)
                                  setContentDialogOpen(true)
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
                              <DialogHeader className="flex-shrink-0">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <DialogTitle>
                                      {contentType === 'projects' && 'Project Details & Moderation'}
                                      {contentType === 'posts' && 'Post Details & Moderation'}
                                      {contentType === 'comments' && 'Comment Details & Moderation'}
                                    </DialogTitle>
                                    <DialogDescription>
                                      Review and moderate content and author
                                    </DialogDescription>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      let url = '';
                                      if (contentType === 'projects') {
                                        url = `/projects/${item.id}`;
                                      } else if (contentType === 'posts') {
                                        url = `/projects/${item.projectId}`;
                                      }
                                      if (url) window.open(url, '_blank');
                                    }}
                                  >
                                    <ExternalLink className="w-4 h-4 mr-1" />
                                    View on Site
                                  </Button>
                                </div>
                              </DialogHeader>
                              <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                                {/* Content Section */}
                                <div className="space-y-4">
                                  <h3 className="font-semibold text-base border-b pb-2">Content Information</h3>
                                  
                                  {/* Content ID */}
                                  <div>
                                    <Label className="text-xs text-slate-600">Content ID</Label>
                                    <p className="text-sm font-mono mt-1 text-slate-800">{item.id}</p>
                                  </div>
                                  
                                  {/* Content Title */}
                                  {item.title && (
                                    <div>
                                      <Label className="text-xs text-slate-600">Title</Label>
                                      <p className="text-base font-semibold mt-1">{item.title}</p>
                                    </div>
                                  )}
                                  
                                  {/* Content Description/Content */}
                                  {item.description && (
                                    <div>
                                      <Label className="text-xs text-slate-600">Description</Label>
                                      <p className="text-sm mt-1 whitespace-pre-wrap bg-slate-50 p-3 rounded">{item.description}</p>
                                    </div>
                                  )}
                                  
                                  {item.content && (
                                    <div>
                                      <Label className="text-xs text-slate-600">Content</Label>
                                      <p className="text-sm mt-1 whitespace-pre-wrap bg-slate-50 p-3 rounded">{item.content}</p>
                                    </div>
                                  )}
                                  
                                  {/* Phase Type for Posts */}
                                  {contentType === 'posts' && item.phaseType && (
                                    <div>
                                      <Label className="text-xs text-slate-600">Phase Type</Label>
                                      <Badge variant="outline" className="mt-1">{item.phaseType}</Badge>
                                    </div>
                                  )}
                                  
                                  {/* Project Link for Posts */}
                                  {contentType === 'posts' && item.project && (
                                    <div>
                                      <Label className="text-xs text-slate-600">Project</Label>
                                      <p className="text-sm mt-1 font-medium">{item.project.title || 'Untitled Project'}</p>
                                    </div>
                                  )}
                                  
                                  {/* Engagement Metrics */}
                                  <div className="grid grid-cols-2 gap-4 p-4 bg-emerald-50 rounded-lg">
                                    <div>
                                      <Label className="text-xs text-emerald-700">Likes</Label>
                                      <p className="text-2xl font-bold text-emerald-600">
                                        {item._count?.likes || 0}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-blue-700">Comments</Label>
                                      <p className="text-2xl font-bold text-blue-600">
                                        {item._count?.comments || 0}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Timestamps */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-xs text-slate-600">Created</Label>
                                      <p className="text-sm mt-1">{formatDate(item.createdAt)}</p>
                                    </div>
                                    {item.updatedAt && item.updatedAt !== item.createdAt && (
                                      <div>
                                        <Label className="text-xs text-slate-600">Last Updated</Label>
                                        <p className="text-sm mt-1">{formatDate(item.updatedAt)}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Author Section */}
                                <div className="space-y-4">
                                  <h3 className="font-semibold text-base border-b pb-2">Author Information</h3>
                                  <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-xs text-slate-600">User ID</Label>
                                        <p className="text-sm font-mono text-slate-800">
                                          {item.userId || item.project?.userId || item.user?.id || 'N/A'}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-slate-600">Username</Label>
                                        <p className="text-sm font-medium">
                                          @{item.user?.username || item.project?.user?.username || 'Unknown'}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-slate-600">Email</Label>
                                        <p className="text-sm font-medium">
                                          {item.user?.email || item.project?.user?.email || 'N/A'}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-slate-600">Full Name</Label>
                                        <p className="text-sm font-medium">
                                          {item.user?.name || item.project?.user?.name || 'N/A'}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-slate-600">Account Status</Label>
                                        <Badge className={getStatusBadge(
                                          item.user?.status || item.project?.user?.status || 'APPROVED'
                                        )}>
                                          {item.user?.status || item.project?.user?.status || 'APPROVED'}
                                        </Badge>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-slate-600">User Type</Label>
                                        <Badge variant="outline">
                                          {item.user?.isAdmin || item.project?.user?.isAdmin ? 'Admin' : 'User'}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* User Moderation Actions */}
                                <div className="space-y-4">
                                  <h3 className="font-semibold text-base border-b pb-2">User Moderation</h3>
                                  <div className="grid grid-cols-2 gap-3">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const userId = item.userId || item.project?.userId || item.user?.id;
                                        if (userId) {
                                          window.open(`/profile/${item.user?.username || item.project?.user?.username}`, '_blank');
                                        }
                                      }}
                                    >
                                      <User className="w-4 h-4 mr-1" />
                                      View Profile
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const user = item.user || item.project?.user;
                                        if (user) {
                                          setSelectedUser(user);
                                          setDialogOpen(true);
                                          setContentDialogOpen(false);
                                        }
                                      }}
                                    >
                                      <UserCog className="w-4 h-4 mr-1" />
                                      Manage User
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-orange-600 hover:text-orange-700"
                                      onClick={async () => {
                                        const user = item.user || item.project?.user;
                                        if (!user) return;
                                        
                                        if (confirm(`Suspend user @${user.username}? They will not be able to post or interact.`)) {
                                          try {
                                            const res = await fetch('/api/admin/users', {
                                              method: 'PUT',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                userId: user.id,
                                                status: 'SUSPENDED',
                                                reason: 'Suspended from content moderation'
                                              })
                                            });
                                            
                                            if (res.ok) {
                                              toast.success(`User @${user.username} suspended`);
                                              loadDashboardData();
                                            } else {
                                              toast.error('Failed to suspend user');
                                            }
                                          } catch (error) {
                                            toast.error('Error suspending user');
                                          }
                                        }
                                      }}
                                    >
                                      <Ban className="w-4 h-4 mr-1" />
                                      Suspend User
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700"
                                      onClick={async () => {
                                        const user = item.user || item.project?.user;
                                        if (!user) return;
                                        
                                        if (confirm(`REJECT user @${user.username}? They will need to re-apply.`)) {
                                          try {
                                            const res = await fetch('/api/admin/users', {
                                              method: 'PUT',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                userId: user.id,
                                                status: 'REJECTED',
                                                reason: 'Rejected from content moderation'
                                              })
                                            });
                                            
                                            if (res.ok) {
                                              toast.success(`User @${user.username} rejected`);
                                              loadDashboardData();
                                            } else {
                                              toast.error('Failed to reject user');
                                            }
                                          } catch (error) {
                                            toast.error('Error rejecting user');
                                          }
                                        }
                                      }}
                                    >
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Reject User
                                    </Button>
                                  </div>
                                </div>
                                
                                {/* Content Moderation Actions */}
                                <div className="space-y-4">
                                  <h3 className="font-semibold text-base border-b pb-2">Content Moderation</h3>
                                  <div className="space-y-2">
                                    <Button
                                      variant="destructive"
                                      className="w-full"
                                      onClick={async () => {
                                        if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
                                          return;
                                        }
                                        
                                        try {
                                          let endpoint = '';
                                          if (contentType === 'projects') {
                                            endpoint = `/api/projects/${item.id}`;
                                          } else if (contentType === 'posts') {
                                            endpoint = `/api/posts/${item.id}`;
                                          } else if (contentType === 'comments') {
                                            endpoint = `/api/comments/${item.id}`;
                                          }
                                          
                                          const res = await fetch(endpoint, {
                                            method: 'DELETE',
                                          });
                                          
                                          if (res.ok) {
                                            toast.success('Content deleted successfully');
                                            setContentDialogOpen(false);
                                            setSelectedContent(null);
                                            loadDashboardData();
                                          } else {
                                            toast.error('Failed to delete content');
                                          }
                                        } catch (error) {
                                          toast.error('Error deleting content');
                                        }
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete This Content
                                    </Button>
                                    
                                    <p className="text-xs text-slate-500 text-center">
                                      This will permanently delete the content and all associated data
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 pt-4 border-t flex-shrink-0">
                                <Button
                                  onClick={() => {
                                    setContentDialogOpen(false)
                                    setSelectedContent(null)
                                  }}
                                  variant="outline"
                                  className="flex-1"
                                >
                                  Close
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

