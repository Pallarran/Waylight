import React, { useState, useEffect } from 'react';
import {
  InvitationRequest,
  TripCollaborator,
  TripInvitation,
  PermissionLevel,
  invitationService
} from '@waylight/shared';
import { X, Mail, UserPlus, Users, Settings, Trash2, Copy, Check } from 'lucide-react';

interface TripSharingModalProps {
  tripId: string;
  tripName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const TripSharingModal: React.FC<TripSharingModalProps> = ({
  tripId,
  tripName,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'invite' | 'collaborators' | 'invitations'>('invite');
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<PermissionLevel>('edit');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [collaborators, setCollaborators] = useState<TripCollaborator[]>([]);
  const [invitations, setInvitations] = useState<TripInvitation[]>([]);
  const [shareUrl, setShareUrl] = useState('');
  const [urlCopied, setUrlCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCollaborationData();
      setShareUrl(`${window.location.origin}/trip/${tripId}`);
    }
  }, [isOpen, tripId]);

  const loadCollaborationData = async () => {
    try {
      const [collabData, inviteData] = await Promise.all([
        invitationService.getTripCollaborators(tripId),
        invitationService.getTripInvitations(tripId)
      ]);
      setCollaborators(collabData);
      setInvitations(inviteData.filter(inv => inv.status === 'pending'));
    } catch (error) {
      console.error('Failed to load collaboration data:', error);
      // Don't show error for empty collaboration data - it's normal for new trips
      setCollaborators([]);
      setInvitations([]);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log('🎯 Starting invitation process for:', email.trim());

      const request: InvitationRequest = {
        tripId,
        email: email.trim(),
        permissionLevel: permission,
        message: message.trim() || undefined,
        expiresInDays: 7
      };

      console.log('📤 Sending invitation request...');
      const startTime = Date.now();

      await invitationService.sendInvitation(request);

      const totalTime = Date.now() - startTime;
      console.log(`✅ Invitation completed successfully in ${totalTime}ms`);

      setSuccessMessage(`✅ Invitation sent to ${email} (took ${totalTime}ms)`);
      setEmail('');
      setMessage('');
      await loadCollaborationData();
      onSuccess?.();

      // Auto-switch to invitations tab to show the sent invitation
      setActiveTab('invitations');
    } catch (error) {
      console.error('❌ Invitation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send invitation';
      setError(`❌ ${errorMessage}`);

      // If the error mentions that invitation was created but email failed,
      // still reload collaboration data to show the invitation
      if (errorMessage.includes('invitation was created')) {
        await loadCollaborationData();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string, userEmail: string) => {
    if (!confirm(`Remove ${userEmail} from this trip?`)) return;

    try {
      await invitationService.removeCollaborator(tripId, collaboratorId);
      setSuccessMessage(`Removed ${userEmail} from the trip`);
      await loadCollaborationData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to remove collaborator');
    }
  };

  const handleUpdatePermission = async (collaboratorId: string, newPermission: PermissionLevel) => {
    try {
      await invitationService.updateCollaboratorPermission(tripId, collaboratorId, newPermission);
      setSuccessMessage('Permissions updated successfully');
      await loadCollaborationData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update permissions');
    }
  };

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const getPermissionColor = (permission: PermissionLevel): string => {
    switch (permission) {
      case 'view': return 'text-blue-600 bg-blue-100';
      case 'edit': return 'text-green-600 bg-green-100';
      case 'admin': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Share Trip</h2>
            <p className="text-sm text-gray-600 mt-1">{tripName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
            {successMessage}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex px-6">
            {[
              { id: 'invite', label: 'Invite People', icon: Mail },
              { id: 'collaborators', label: `Collaborators (${collaborators.length})`, icon: Users },
              { id: 'invitations', label: `Pending (${invitations.length})`, icon: UserPlus }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'invite' && (
            <div className="space-y-6">
              {/* Share URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Share Link
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                  />
                  <button
                    onClick={copyShareUrl}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-1"
                  >
                    {urlCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span className="text-sm">{urlCopied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Anyone with this link can view the trip. They'll need to create an account to collaborate.
                </p>
              </div>

              {/* Email Invitation Form */}
              <form onSubmit={handleSendInvitation} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="permission" className="block text-sm font-medium text-gray-700 mb-1">
                    Permission Level
                  </label>
                  <select
                    id="permission"
                    value={permission}
                    onChange={(e) => setPermission(e.target.value as PermissionLevel)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="view">View Only - Can see trip details</option>
                    <option value="edit">Can Edit - Can modify trip content</option>
                    <option value="admin">Admin - Can invite others and manage permissions</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Personal Message (Optional)
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Add a personal message to the invitation..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  <span>{isLoading ? 'Sending...' : 'Send Invitation'}</span>
                </button>
              </form>
            </div>
          )}

          {activeTab === 'collaborators' && (
            <div className="space-y-4">
              {collaborators.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No collaborators yet</p>
                  <p className="text-sm">Send invitations to start collaborating!</p>
                </div>
              ) : (
                collaborators.map((collaborator) => (
                  <div key={collaborator.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {collaborator.userFullName || collaborator.userEmail}
                      </p>
                      <p className="text-sm text-gray-600">{collaborator.userEmail}</p>
                      <p className="text-xs text-gray-500">
                        Joined {new Date(collaborator.joinedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <select
                        value={collaborator.permissionLevel}
                        onChange={(e) => handleUpdatePermission(collaborator.id, e.target.value as PermissionLevel)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="view">View</option>
                        <option value="edit">Edit</option>
                        <option value="admin">Admin</option>
                      </select>

                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPermissionColor(collaborator.permissionLevel)}`}>
                        {collaborator.permissionLevel}
                      </span>

                      <button
                        onClick={() => handleRemoveCollaborator(collaborator.id, collaborator.userEmail!)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Remove collaborator"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'invitations' && (
            <div className="space-y-4">
              {invitations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <UserPlus className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No pending invitations</p>
                </div>
              ) : (
                invitations.map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{invitation.invitedEmail}</p>
                      <p className="text-sm text-gray-600">
                        Invited {new Date(invitation.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                      </p>
                      {invitation.message && (
                        <p className="text-sm text-gray-600 mt-1 italic">"{invitation.message}"</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPermissionColor(invitation.permissionLevel)}`}>
                        {invitation.permissionLevel}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripSharingModal;