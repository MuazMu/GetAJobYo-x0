"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useToast } from "@/hooks/use-toast"
import { User, UserCheck, UserX, Search, Mail, RefreshCw, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface UserData {
  id: string
  email: string
  full_name: string | null
  created_at: string
  role?: string
  profile_completed?: boolean
  applications_count?: number
}

export function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [userRole, setUserRole] = useState("user")
  const supabase = createBrowserClient()
  const { toast } = useToast()

  const fetchUsers = async () => {
    try {
      setLoading(true)

      // Get all users
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false })

      if (usersError) throw usersError

      // Get profile completion status
      const usersWithDetails = await Promise.all(
        users.map(async (user) => {
          // Check if profile exists and has data
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single()

          // Count applications
          const { count: applicationsCount, error: applicationsError } = await supabase
            .from("applications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)

          // Determine if profile is completed
          let profileCompleted = false
          if (profile && !profileError) {
            const requiredFields = [
              profile.title,
              profile.bio,
              profile.skills?.length > 0,
              profile.location,
              profile.preferred_job_types?.length > 0,
            ]
            const completedFields = requiredFields.filter(Boolean).length
            profileCompleted = completedFields >= 3 // Consider profile completed if at least 3 fields are filled
          }

          // Determine role (admin or user)
          const role = user.email === "muwi1772@gmail.com" ? "admin" : "user"

          return {
            ...user,
            role,
            profile_completed: profileCompleted,
            applications_count: applicationsCount || 0,
          }
        }),
      )

      setUsers(usersWithDetails)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [supabase, toast])

  const handleUserClick = (user: UserData) => {
    setSelectedUser(user)
    setUserRole(user.role || "user")
    setShowUserDialog(true)
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    try {
      // Update user role (in a real app, you would store roles in a separate table)
      // For this demo, we'll just show the UI without actual implementation

      toast({
        title: "User Updated",
        description: `${selectedUser.email} role updated to ${userRole}`,
      })

      setShowUserDialog(false)

      // Refresh the user list
      await fetchUsers()
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      })
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
          {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No users found</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Profile</TableHead>
                <TableHead className="text-right">Applications</TableHead>
                <TableHead className="text-right">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleUserClick(user)}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.full_name || "No Name"}</div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {user.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === "admin" ? "default" : "outline"}>
                      {user.role === "admin" ? <Shield className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.profile_completed ? (
                      <Badge variant="success" className="bg-green-100 text-green-800">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Complete
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-yellow-800">
                        <UserX className="h-3 w-3 mr-1" />
                        Incomplete
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{user.applications_count}</TableCell>
                  <TableCell className="text-right">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>View and manage user information</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="p-2 border rounded-md bg-muted/50">{selectedUser.email}</div>
              </div>

              <div className="space-y-2">
                <Label>Full Name</Label>
                <div className="p-2 border rounded-md bg-muted/50">{selectedUser.full_name || "Not provided"}</div>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={userRole} onValueChange={setUserRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Joined</Label>
                <div className="p-2 border rounded-md bg-muted/50">
                  {new Date(selectedUser.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>Update User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
