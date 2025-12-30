import React, { useState } from 'react';
import { FiMail, FiCopy, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function InvitePeopleTab({ institution }) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('student');
  const [inviteDepartment, setInviteDepartment] = useState('');
  const [copied, setCopied] = useState(false);

  const inviteLink = `${window.location.origin}/join/${institution?._id || institution?.id}`;

  const handleSendInvite = () => {
    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }
    toast.success(`Invitation sent to ${inviteEmail}`);
    setInviteEmail('');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success('Invite link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Invite People</h2>
        <p className="text-gray-600 mt-1">Invite students and teachers to join your institution</p>
      </div>

      {/* Invite by Email */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Send Email Invitation</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select
                value={inviteDepartment}
                onChange={(e) => setInviteDepartment(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select Department</option>
                {institution?.departments?.map((dept) => (
                  <option key={dept._id || dept.id} value={dept.code}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleSendInvite}
            className="w-full px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center space-x-2"
          >
            <FiMail className="w-5 h-5" />
            <span>Send Invitation</span>
          </button>
        </div>
      </div>

      {/* Invite Link */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Invitation Link</h3>
        <p className="text-gray-600 text-sm mb-4">Share this link with students and teachers to join your institution</p>
        
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={inviteLink}
            readOnly
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none"
          />
          <button
            onClick={handleCopyLink}
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center space-x-2"
          >
            {copied ? (
              <>
                <FiCheck className="w-5 h-5 text-emerald-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <FiCopy className="w-5 h-5" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
