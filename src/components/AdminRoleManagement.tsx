import React, { useState, useEffect } from 'react';
import { User, UserRole, AdminPermissions } from '../types';
import { api } from '../utils/apiClient';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  ShieldCheck,
  UserPlus,
  ShieldAlert,
  Edit,
  Trash2,
  Lock,
  Key,
  CheckCircle2,
  XCircle,
  Mail,
  UserCheck,
  X,
  Layers,
  Users,
  Database,
  Sliders,
  DollarSign
} from 'lucide-react';

export const AdminRoleManagement: React.FC = () => {
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get<User[]>('/api/admin/members', { requireAdmin: true }).then(data => {
      if (!cancelled) setAdmins(Array.isArray(data) ? data : []);
    }).catch(error => console.error('Failed to load admin members:', error)).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);

  // New Admin Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('content_manager');
  const [newPermissions, setNewPermissions] = useState<AdminPermissions>({
    manageStudents: false,
    manageAdmins: false,
    manageTests: true,
    manageQuestions: true,
    manageCMS: true,
    managePayments: false,
    manageSystem: false,
  });

  const handleRoleChangeForNew = (role: UserRole) => {
    setNewRole(role);
    if (role === 'superadmin') {
      setNewPermissions({
        manageStudents: true,
        manageAdmins: true,
        manageTests: true,
        manageQuestions: true,
        manageCMS: true,
        managePayments: true,
        manageSystem: true,
      });
    } else if (role === 'content_manager') {
      setNewPermissions({
        manageStudents: false,
        manageAdmins: false,
        manageTests: true,
        manageQuestions: true,
        manageCMS: true,
        managePayments: false,
        manageSystem: false,
      });
    } else if (role === 'support') {
      setNewPermissions({
        manageStudents: true,
        manageAdmins: false,
        manageTests: false,
        manageQuestions: false,
        manageCMS: false,
        managePayments: true,
        manageSystem: false,
      });
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    const normalizedEmail = newEmail.trim().toLowerCase();
    const userSnap = await getDocs(query(collection(db, 'users'), where('email', '==', normalizedEmail)));
    if (userSnap.empty) {
      alert('This staff member must first create a CGSSBTest Firebase account with this email. Then add them here to grant admin access.');
      return;
    }
    const staffProfile = userSnap.docs[0].data() as User;
    const newAdminMember: User = {
      id: staffProfile.id,
      uid: staffProfile.id,
      name: newName.trim() || 'Staff Administrator',
      email: normalizedEmail,
      role: newRole,
      status: 'active',
      registeredAt: new Date().toISOString().split('T')[0],
      adminPermissions: newPermissions,
    };

    try {
      const saved = await api.put<User>(`/api/admin/members/${encodeURIComponent(newAdminMember.id)}`, newAdminMember, { requireAdmin: true });
      setAdmins(current => [saved, ...current]);
    } catch (error) { console.error('Failed to create admin:', error); alert('Could not create admin member.'); return; }
    setIsAddModalOpen(false);
    setNewName('');
    setNewEmail('');
  };

  const handleSaveAdminEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;
    try {
      const saved = await api.put<User>(`/api/admin/members/${encodeURIComponent(editingAdmin.id)}`, editingAdmin, { requireAdmin: true });
      setAdmins(current => current.map(a => a.id === saved.id ? saved : a));
      setEditingAdmin(null);
    } catch (error) { console.error('Failed to save admin:', error); alert('Could not save admin member.'); }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (admins.length <= 1) { alert('Cannot delete the last remaining Super Admin.'); return; }
    if (!confirm('Are you sure you want to revoke admin access for this staff member?')) return;
    try { await api.delete(`/api/admin/members/${encodeURIComponent(adminId)}`, { requireAdmin: true }); setAdmins(current => current.filter(a => a.id !== adminId)); }
    catch (error) { console.error('Failed to delete admin:', error); alert('Could not revoke admin access.'); }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                Role-Based Access Control (RBAC)
              </span>
            </div>
            <h1 className="text-xl font-black text-white tracking-tight mt-0.5">
              Admin Team & Delegated Permissions
            </h1>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center space-x-2 transition cursor-pointer shadow-lg shadow-indigo-600/25 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Admin Member</span>
        </button>
      </div>

      {/* Role Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Super Administrator</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-300">Level 1 (Root)</span>
          </div>
          <p className="text-xs text-slate-300">
            Unrestricted access to all database schemas, payment tokens, student records, and server settings.
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Content Lead / Faculty</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-300">Level 2 (Academic)</span>
          </div>
          <p className="text-xs text-slate-300">
            Can author, edit, and publish Mock Tests, Questions, PYQs, and Current Affairs. Cannot modify payments or database.
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Support & Telecalling</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/10 text-indigo-300">Level 3 (Operations)</span>
          </div>
          <p className="text-xs text-slate-300">
            Can view candidate registry, grant manual pro passes, and manage WhatsApp campaigns.
          </p>
        </div>
      </div>

      {loading && <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs text-slate-400">Loading live admin roster…</div>}

      {/* Admin Roster Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Admin Staff ({admins.length})</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Scope Permissions</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {admins.map(admin => (
                <tr key={admin.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-extrabold text-white text-sm">{admin.name}</div>
                    <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-500" />
                      <span>{admin.email}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    {admin.role === 'superadmin' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        SUPER ADMIN
                      </span>
                    ) : admin.role === 'content_manager' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        CONTENT MANAGER
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        SUPPORT STAFF
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      {admin.adminPermissions?.manageTests && (
                        <span className="px-2 py-0.5 rounded bg-slate-950 text-[10px] font-mono text-emerald-300 border border-slate-800">
                          Tests
                        </span>
                      )}
                      {admin.adminPermissions?.manageStudents && (
                        <span className="px-2 py-0.5 rounded bg-slate-950 text-[10px] font-mono text-indigo-300 border border-slate-800">
                          Students
                        </span>
                      )}
                      {admin.adminPermissions?.managePayments && (
                        <span className="px-2 py-0.5 rounded bg-slate-950 text-[10px] font-mono text-amber-300 border border-slate-800">
                          Passes
                        </span>
                      )}
                      {admin.adminPermissions?.manageSystem && (
                        <span className="px-2 py-0.5 rounded bg-slate-950 text-[10px] font-mono text-purple-300 border border-slate-800">
                          Database
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-400">
                    {admin.registeredAt}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setEditingAdmin(admin)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                        title="Edit Role & Permissions"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteAdmin(admin.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                        title="Revoke Admin Access"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ADD NEW ADMIN MODAL */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <span>Add Admin Team Member</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Staff Member Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Ramesh Sahu (Content Lead)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Staff Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="faculty@cgtest.in"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Select Role</label>
                <select
                  value={newRole}
                  onChange={e => handleRoleChangeForNew(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-bold"
                >
                  <option value="content_manager">Content Manager / Faculty</option>
                  <option value="support">Support & Operations</option>
                  <option value="superadmin">Super Administrator (Root)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-md"
                >
                  Authorize Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT ADMIN MODAL */}
      {/* ========================================================================= */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
                <Edit className="w-4 h-4 text-emerald-400" />
                <span>Edit Admin Member</span>
              </h3>
              <button onClick={() => setEditingAdmin(null)} className="p-1 rounded text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdminEdit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editingAdmin.name}
                  onChange={e => setEditingAdmin({ ...editingAdmin, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Role</label>
                <select
                  value={editingAdmin.role}
                  onChange={e => setEditingAdmin({ ...editingAdmin, role: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-bold"
                >
                  <option value="content_manager">Content Manager / Faculty</option>
                  <option value="support">Support & Operations</option>
                  <option value="superadmin">Super Administrator (Root)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
