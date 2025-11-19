
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { ArrowLeft, Save, Trash2, Upload, Eye, EyeOff, Mail, Bell, CheckCircle2, AlertCircle } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import Link from 'next/link'
import ImageCropper from '@/components/ui/ImageCropper'
import { useLanguage } from '@/components/language-provider'

interface ProfileData {
  username: string
  firstName: string
  lastName: string
  bio: string
  email: string
  avatar: string | null
}

interface PasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface NotificationPreferences {
  emailNotificationsEnabled: boolean
  emailNotificationsInteractions: boolean
  emailNotificationsNews: boolean
}

export default function ProfileSettings({ params }: { params: { username: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [usernameError, setUsernameError] = useState<string>('')
  const [usernameValid, setUsernameValid] = useState<boolean>(false)
  const [profileData, setProfileData] = useState<ProfileData>({
    username: '',
    firstName: '',
    lastName: '',
    bio: '',
    email: '',
    avatar: null
  })
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [cropperImage, setCropperImage] = useState<string | null>(null)
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    emailNotificationsEnabled: true,
    emailNotificationsInteractions: true,
    emailNotificationsNews: true
  })

  useEffect(() => {
    if (!session?.user) {
      router.push('/auth/signin')
      return
    }

    // Decode the username in case it contains special characters
    const decodedUsername = decodeURIComponent(params.username)
    
    if (session.user.username !== decodedUsername) {
      router.push(`/profile/${session.user.username}`)
      return
    }

    fetchProfileData()
  }, [session, params.username, router])

  const fetchNotificationPreferences = async () => {
    try {
      const response = await fetch('/api/profile/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotificationPreferences({
          emailNotificationsEnabled: data.emailNotificationsEnabled ?? true,
          emailNotificationsInteractions: data.emailNotificationsInteractions ?? true,
          emailNotificationsNews: data.emailNotificationsNews ?? true
        })
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error)
    }
  }

  const fetchProfileData = async () => {
    try {
      const response = await fetch('/api/profile/me')
      if (response.ok) {
        const data = await response.json()
        const u = data.user || data
        setProfileData({
          username: u.username || '',
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          bio: u.bio || '',
          email: u.email || '',
          avatar: u.avatar || null,
        })
        
        // Fetch notification preferences
        if (u.emailNotificationsEnabled !== undefined) {
          setNotificationPreferences({
            emailNotificationsEnabled: u.emailNotificationsEnabled ?? true,
            emailNotificationsInteractions: u.emailNotificationsInteractions ?? true,
            emailNotificationsNews: u.emailNotificationsNews ?? true
          })
        } else {
          // Fetch separately if not included in profile
          fetchNotificationPreferences()
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        toast.error('File size must be less than 15MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      
      // Create preview URL for cropper
      const previewUrl = URL.createObjectURL(file)
      setOriginalFile(file)
      setCropperImage(previewUrl)
      toast.info('Crop your image to adjust your avatar')
    }
  }

  const handleCropComplete = (croppedBlob: Blob, croppedUrl: string) => {
    // Create a new File object from the cropped blob
    const croppedFile = new File([croppedBlob], originalFile?.name || 'avatar.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })

    setAvatarFile(croppedFile)
    setAvatarPreview(croppedUrl)
    setCropperImage(null)
    
    // Clean up original file
    if (originalFile) {
      URL.revokeObjectURL(URL.createObjectURL(originalFile))
    }
    setOriginalFile(null)
    toast.success('Avatar updated! Click "Save Changes" to apply')
  }

  const handleCropCancel = () => {
    setCropperImage(null)
    if (originalFile) {
      URL.revokeObjectURL(URL.createObjectURL(originalFile))
    }
    setOriginalFile(null)
  }

  const handleSaveProfile = async () => {
    // Validate username format
    const usernameRegex = /^[a-z0-9._]+$/
    if (profileData.username && !usernameRegex.test(profileData.username)) {
      toast.error(t('usernameInvalidChars'))
      return
    }

    if (profileData.username && profileData.username.length < 3) {
      toast.error(t('usernameTooShort'))
      return
    }

    if (profileData.username && profileData.username.length > 30) {
      toast.error(t('usernameTooLong'))
      return
    }

    setSaving(true)
    const loadingToast = toast.loading('Saving your profile changes...')
    try {
      const formData = new FormData()
      formData.append('username', profileData.username)
      formData.append('firstName', profileData.firstName)
      formData.append('lastName', profileData.lastName)
      formData.append('bio', profileData.bio)
      formData.append('email', profileData.email)
      
      if (avatarFile) {
        formData.append('avatar', avatarFile)
      }

      const response = await fetch('/api/profile/update', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const updatedUser = await response.json()
        toast.success('Profile updated successfully!', { id: loadingToast })
        setAvatarFile(null)
        setAvatarPreview(null)
        
        // Decode the current URL username to compare properly
        const currentUsername = decodeURIComponent(params.username)
        
        // If username changed, redirect to new profile URL and refresh session
        if (updatedUser.username && updatedUser.username !== currentUsername) {
          toast.success(`Username changed to @${updatedUser.username}. Redirecting...`, { duration: 2000 })
          // Use router.replace to update URL without adding to history
          router.replace(`/profile/${encodeURIComponent(updatedUser.username)}/settings`)
          // Force a page reload to update the session
          setTimeout(() => {
            window.location.href = `/profile/${encodeURIComponent(updatedUser.username)}/settings`
          }, 1000)
        } else {
          await fetchProfileData()
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update profile', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile', { id: loadingToast })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    setSaving(true)
    const loadingToast = toast.loading('Changing your password...')
    try {
      const response = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      if (response.ok) {
        toast.success('Password changed successfully!', { id: loadingToast })
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to change password', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('Failed to change password', { id: loadingToast })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setSaving(true)
    const loadingToast = toast.loading('Deleting your account...')
    try {
      const response = await fetch('/api/profile/delete', {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Account deleted successfully. Goodbye!', { id: loadingToast, duration: 3000 })
        setTimeout(() => {
          router.push('/auth/signin')
        }, 2000)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete account', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('Failed to delete account', { id: loadingToast })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateNotifications = async () => {
    setSaving(true)
    const loadingToast = toast.loading('Updating notification preferences...')
    try {
      const response = await fetch('/api/profile/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationPreferences)
      })

      if (response.ok) {
        toast.success('Notification preferences updated successfully!', { id: loadingToast })
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update notification preferences', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error)
      toast.error('Failed to update notification preferences', { id: loadingToast })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-64 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href={`/profile/${params.username}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Profile Settings</h1>
        </div>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex items-center space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarPreview || profileData.avatar || ''} />
                <AvatarFallback className="text-2xl">
                  {profileData.firstName?.charAt(0)?.toUpperCase() || session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {avatarFile ? 'Change Photo' : 'Upload Photo'}
                    </span>
                  </Button>
                </Label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  JPG, PNG or GIF. Max size 15MB.
                </p>
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">{t('username')}</Label>
              <div className="relative">
                <Input
                  id="username"
                  value={profileData.username}
                  onChange={(e) => {
                    // Only allow lowercase letters, numbers, periods, and underscores
                    const value = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '')
                    setProfileData(prev => ({ ...prev, username: value }))
                    
                    // Real-time validation
                    const usernameRegex = /^[a-z0-9._]+$/
                    
                    if (!value) {
                      setUsernameError('')
                      setUsernameValid(false)
                    } else if (value.length < 3) {
                      setUsernameError(t('usernameTooShort'))
                      setUsernameValid(false)
                    } else if (value.length > 30) {
                      setUsernameError(t('usernameTooLong'))
                      setUsernameValid(false)
                    } else if (!usernameRegex.test(value)) {
                      setUsernameError(t('usernameInvalidChars'))
                      setUsernameValid(false)
                    } else {
                      // Valid format
                      const currentUsername = decodeURIComponent(params.username)
                      if (value === currentUsername) {
                        setUsernameError('')
                        setUsernameValid(false)
                      } else {
                        setUsernameError('')
                        setUsernameValid(true)
                      }
                    }
                  }}
                  placeholder="your_username"
                  maxLength={30}
                  className={
                    usernameError 
                      ? 'border-destructive focus-visible:ring-destructive' 
                      : usernameValid 
                      ? 'border-green-500 focus-visible:ring-green-500' 
                      : ''
                  }
                />
                {usernameValid && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
                {usernameError && (
                  <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                )}
              </div>
              {usernameError ? (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {usernameError}
                </p>
              ) : usernameValid ? (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {t('usernameAvailable')}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t('usernameRequirements')}
                </p>
              )}
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                rows={3}
                placeholder="Tell us about yourself and your DIY projects..."
                value={profileData.bio}
                onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
              />
            </div>

            <Button onClick={handleSaveProfile} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button 
              onClick={handleChangePassword} 
              disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
            >
              {saving ? 'Changing...' : 'Change Password'}
            </Button>
          </CardContent>
        </Card>

        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {/* Master Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications-enabled" className="text-base font-medium">
                    Enable Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications from Prieelo
                  </p>
                </div>
                <Switch
                  id="email-notifications-enabled"
                  checked={notificationPreferences.emailNotificationsEnabled}
                  onCheckedChange={(checked) => {
                    setNotificationPreferences(prev => ({
                      ...prev,
                      emailNotificationsEnabled: checked
                    }))
                  }}
                />
              </div>

              {/* Interactions Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications-interactions" className="text-base font-medium">
                    Interactions
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone likes or comments on your posts
                  </p>
                </div>
                <Switch
                  id="email-notifications-interactions"
                  checked={notificationPreferences.emailNotificationsInteractions && notificationPreferences.emailNotificationsEnabled}
                  onCheckedChange={(checked) => {
                    setNotificationPreferences(prev => ({
                      ...prev,
                      emailNotificationsInteractions: checked
                    }))
                  }}
                  disabled={!notificationPreferences.emailNotificationsEnabled}
                />
              </div>

              {/* News Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications-news" className="text-base font-medium">
                    News & Updates
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive news and updates from Prieelo
                  </p>
                </div>
                <Switch
                  id="email-notifications-news"
                  checked={notificationPreferences.emailNotificationsNews && notificationPreferences.emailNotificationsEnabled}
                  onCheckedChange={(checked) => {
                    setNotificationPreferences(prev => ({
                      ...prev,
                      emailNotificationsNews: checked
                    }))
                  }}
                  disabled={!notificationPreferences.emailNotificationsEnabled}
                />
              </div>
            </div>

            <Button 
              onClick={handleUpdateNotifications} 
              disabled={saving}
            >
              <Bell className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Notification Preferences'}
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
              <div>
                <h3 className="font-medium">Delete Account</h3>
                <p className="text-sm text-muted-foreground">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove all your data from our servers, including all your projects, comments, and likes.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={saving}
                    >
                      {saving ? 'Deleting...' : 'Delete Account'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {/* Image Cropper Modal */}
        {cropperImage && (
          <ImageCropper
            src={cropperImage}
            onCropComplete={handleCropComplete}
            onCancel={handleCropCancel}
            aspectRatio={1} // Square aspect ratio for avatars
            minWidth={150}
            minHeight={150}
          />
        )}
      </div>
    </div>
  )
}
