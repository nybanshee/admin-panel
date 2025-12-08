import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Permission = 
    | 'view_dashboard'
    | 'manage_users'
    | 'manage_roles'
    | 'manage_workspaces'
    | 'edit_game_settings'
    | 'edit_planning'
    | 'edit_network'
    | 'view_logs';

export interface Role {
    id: string;
    name: string;
    color: string;
    permissions: Permission[];
    isSystem?: boolean; // Cannot be deleted
}

export interface User {
    username: string;
    roleId: string; // ID of the Role
    password?: string; 
    isDedicated?: boolean; // Dedicated users cannot be deleted or have roles changed by others
    theme?: {
        primaryColor: string;
        accentColor: string;
        savedColors: string[];
    };
}

export interface Workspace {
    id: string;
    name: string;
    description?: string;
}

interface AuthState {
    user: User | null;
    workspace: Workspace | null;
    users: User[]; 
    roles: Role[];
    workspaces: Workspace[]; 
    
    login: (user: User) => void;
    logout: () => void;
    selectWorkspace: (workspace: Workspace) => void;
    
    // Theme Management
    updateTheme: (theme: Partial<User['theme']>) => void;
    saveColor: (color: string) => void;
    deleteColor: (color: string) => void;

    // User Management
    addUser: (user: User) => void;
    removeUser: (username: string) => void;
    updateUser: (username: string, updates: Partial<User>) => void;
    
    // Role Management
    addRole: (role: Role) => void;
    removeRole: (roleId: string) => void;
    updateRole: (roleId: string, updates: Partial<Role>) => void;
    syncSystemRoles: () => void;

    // Workspace Management
    addWorkspace: (workspace: Workspace) => void;
}

const INITIAL_ROLES: Role[] = [
    { 
        id: 'owner', 
        name: 'Owner', 
        color: 'text-purple-400',
        isSystem: true,
        permissions: ['view_dashboard', 'manage_users', 'manage_roles', 'manage_workspaces', 'edit_game_settings', 'edit_planning', 'edit_network', 'view_logs']
    },
    { 
        id: 'admin', 
        name: 'Admin', 
        color: 'text-cyan-400',
        isSystem: true,
        permissions: ['view_dashboard', 'manage_users', 'manage_workspaces', 'edit_game_settings', 'edit_planning', 'edit_network', 'view_logs']
    },
    { 
        id: 'editor', 
        name: 'Editor', 
        color: 'text-green-400',
        isSystem: true,
        permissions: ['view_dashboard', 'edit_game_settings', 'edit_planning', 'edit_network']
    },
    { 
        id: 'visitor', 
        name: 'Visitor', 
        color: 'text-slate-400',
        isSystem: true,
        permissions: ['view_dashboard']
    }
];

const INITIAL_USERS: User[] = [
    { username: 'nybanshee', roleId: 'owner', password: 'password123', isDedicated: true },
    { username: 'kovert', roleId: 'admin', password: 'password123' },
    { username: 'mavha', roleId: 'admin', password: 'password123' },
    { username: 'visitor', roleId: 'visitor', password: '' },
];

const INITIAL_WORKSPACES: Workspace[] = [
    { id: 'development', name: 'Development Branch', description: 'Active development environment' },
    { id: 'release', name: 'Release Branch', description: 'Stable release environment' },
];

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            workspace: null,
            users: INITIAL_USERS,
            roles: INITIAL_ROLES,
            workspaces: INITIAL_WORKSPACES,

            login: (user) => set({ user }),
            logout: () => set({ user: null, workspace: null }),
            selectWorkspace: (workspace) => set({ workspace }),

            updateTheme: (theme) => set((state) => {
                if (!state.user) return state;
                const currentTheme = state.user.theme || { primaryColor: '#0f172a', accentColor: '#06b6d4', savedColors: [] };
                const newTheme = { ...currentTheme, ...theme };
                const newUser = { ...state.user, theme: newTheme };
                // Also update in users array
                return {
                    user: newUser,
                    users: state.users.map(u => u.username === newUser.username ? newUser : u)
                };
            }),

            saveColor: (color) => set((state) => {
                if (!state.user) return state;
                const currentTheme = state.user.theme || { primaryColor: '#0f172a', accentColor: '#06b6d4', savedColors: [] };
                if (currentTheme.savedColors.includes(color)) return state;
                
                const newTheme = { ...currentTheme, savedColors: [...currentTheme.savedColors, color] };
                const newUser = { ...state.user, theme: newTheme };
                return {
                    user: newUser,
                    users: state.users.map(u => u.username === newUser.username ? newUser : u)
                };
            }),

            deleteColor: (color) => set((state) => {
                if (!state.user) return state;
                const currentTheme = state.user.theme || { primaryColor: '#0f172a', accentColor: '#06b6d4', savedColors: [] };
                const newTheme = { ...currentTheme, savedColors: currentTheme.savedColors.filter(c => c !== color) };
                const newUser = { ...state.user, theme: newTheme };
                return {
                    user: newUser,
                    users: state.users.map(u => u.username === newUser.username ? newUser : u)
                };
            }),

            addUser: (user) => set((state) => ({ users: [...state.users, user] })),
            removeUser: (username) => set((state) => {
                const target = state.users.find(u => u.username === username);
                if (target?.isDedicated) return state; // Protection
                return { users: state.users.filter(u => u.username !== username) };
            }),
            updateUser: (username, updates) => set((state) => ({
                users: state.users.map(u => u.username === username ? { ...u, ...updates } : u)
            })),

            addRole: (role) => set((state) => ({ roles: [...state.roles, role] })),
            removeRole: (roleId) => set((state) => {
                const target = state.roles.find(r => r.id === roleId);
                if (target?.isSystem) return state;
                return { roles: state.roles.filter(r => r.id !== roleId) };
            }),
            updateRole: (roleId, updates) => set((state) => ({
                roles: state.roles.map(r => r.id === roleId ? { ...r, ...updates } : r)
            })),
            
            syncSystemRoles: () => set((state) => {
                // 1. Sync Roles
                const nextRoles = [...state.roles];
                INITIAL_ROLES.forEach(systemRole => {
                    const index = nextRoles.findIndex(r => r.id === systemRole.id);
                    if (index >= 0) {
                        nextRoles[index] = { ...nextRoles[index], ...systemRole };
                    } else {
                        nextRoles.push(systemRole);
                    }
                });
                
                // 2. Fix Users (Migration from old 'role' string to 'roleId' & Ensure Dedicated Users)
                // Also ensures the currently logged-in user is updated if they are one of the system users
                const fixUser = (u: any): User => {
                    let nextU = { ...u };
                    
                    // Migration: if has 'role' but not 'roleId'
                    if (nextU.role && !nextU.roleId) {
                        // Map old string roles to new IDs
                        if (nextU.role === 'admin') nextU.roleId = 'admin';
                        else if (nextU.role === 'visitor') nextU.roleId = 'visitor';
                        else if (nextU.username === 'nybanshee') nextU.roleId = 'owner';
                        else nextU.roleId = 'visitor'; // Fallback
                        delete nextU.role;
                    }

                    // Enforce System Users (e.g. Owner)
                    const systemUser = INITIAL_USERS.find(su => su.username === nextU.username);
                    if (systemUser && systemUser.isDedicated) {
                        nextU = { ...nextU, ...systemUser };
                    } else if (systemUser && systemUser.roleId === 'owner') {
                         // Double check if it is owner even if not marked dedicated in some old state
                         nextU = { ...nextU, roleId: 'owner', isDedicated: true };
                    }

                    return nextU as User;
                };

                const nextUsers = state.users.map(fixUser);
                const nextUser = state.user ? fixUser(state.user) : null;

                return { 
                    roles: nextRoles,
                    users: nextUsers,
                    user: nextUser
                };
            }),

            addWorkspace: (workspace) => set((state) => ({ workspaces: [...state.workspaces, workspace] })),
        }),
        {
            name: 'auth-storage',
        }
    )
);

// Helper to check permissions
export const hasPermission = (user: User | null, roles: Role[], permission: Permission) => {
    if (!user) return false;
    const role = roles.find(r => r.id === user.roleId);
    return role ? role.permissions.includes(permission) : false;
};
