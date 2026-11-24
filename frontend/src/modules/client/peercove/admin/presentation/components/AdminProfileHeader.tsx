/**
 * Presentation: AdminProfileHeader
 * Displays admin profile information in header
 * Shows name, role, department, access level
 * Presentation layer - React component
 */

'use client';

import React from 'react';
import { AdminProfile } from '../../domain/entities/AdminProfile';

interface AdminProfileHeaderProps {
  profile: AdminProfile;
}

const AdminProfileHeader: React.FC<AdminProfileHeaderProps> = ({ profile }) => {
  return (
    <div className="admin-profile-header" data-testid="admin-profile-header">
      <div className="profile-avatar">
        <div 
          className="avatar-circle" 
          title={profile.fullName}
          aria-label={`Avatar for ${profile.fullName}`}
        >
          {profile.getInitials()}
        </div>
      </div>

      <div className="profile-info">
        <div className="profile-name-section">
          <h2 className="profile-full-name">{profile.fullName}</h2>
          <span 
            className={`role-badge role-${profile.role}`}
            data-testid={`role-badge-${profile.role}`}
          >
            {profile.getRoleDisplayName()}
          </span>
        </div>

        <div className="profile-details">
          <div className="detail-item">
            <span className="detail-label">Email:</span>
            <span className="detail-value">{profile.email}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Department:</span>
            <span className="detail-value">{profile.departmentId}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Access Level:</span>
            <span 
              className={`access-level access-level-${profile.accessLevel}`}
              title={`Level ${profile.accessLevel} access`}
            >
              {profile.accessLevel}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Status:</span>
            <span 
              className={`status-badge ${profile.isActive ? 'active' : 'inactive'}`}
              data-testid={`status-${profile.isActive ? 'active' : 'inactive'}`}
            >
              {profile.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      <div className="profile-permissions">
        <div className="permissions-section">
          <h3>Permissions</h3>
          <div className="permissions-list">
            {profile.permissions.length > 0 ? (
              profile.permissions.map((permission) => (
                <span 
                  key={permission}
                  className="permission-tag"
                  data-testid={`permission-${permission}`}
                >
                  {permission.replace(/-/g, ' ')}
                </span>
              ))
            ) : (
              <span className="no-permissions">No permissions granted</span>
            )}
          </div>
        </div>

        <div className="capabilities-section">
          <h3>Capabilities</h3>
          <ul className="capabilities-list">
            {profile.canManageUsers() && (
              <li data-testid="capability-manage-users">Can manage users</li>
            )}
            {profile.canViewReports() && (
              <li data-testid="capability-view-reports">Can view reports</li>
            )}
            {profile.isHighPrivilege() && (
              <li data-testid="capability-high-privilege">High privilege access</li>
            )}
            {profile.permissions.length === 0 && (
              <li className="no-capabilities">No capabilities</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminProfileHeader;
