import React, { useState } from 'react';
import { User } from 'lucide-react';

/**
 * Normalizes custom photo URLs, Base64 strings, or Google Drive photo links
 */
export const resolveAvatarUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed === '/logo.png' || trimmed.includes('unsplash')) return '';
  if (trimmed.startsWith('data:image/')) return trimmed;
  if (trimmed.includes('drive.google.com') || trimmed.includes('googleusercontent.com')) {
    const match = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  return trimmed;
};

/**
 * Extracts initials from employee full name (e.g. "Harivasan V" -> "HV", "Admin" -> "A")
 */
export const getUserInitials = (name) => {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * User Avatar component with dynamic image loading & fallback to initials badge
 */
export const UserAvatar = ({ user, size = 'md', className = '', onClick }) => {
  const [imgError, setImgError] = useState(false);

  const rawPhoto = user?.photo || user?.photoURL || user?.avatarUrl || user?.profileImage;
  const validPhotoUrl = resolveAvatarUrl(rawPhoto);
  const initials = getUserInitials(user?.full_name);

  // Size preset mappings
  const sizeClasses = {
    xs: 'w-7 h-7 text-xs rounded-full',
    sm: 'w-8 h-8 sm:w-9 sm:h-9 text-xs rounded-full',
    md: 'w-9 h-9 text-xs rounded-xl',
    lg: 'w-12 h-12 text-sm rounded-2xl',
    xl: 'w-20 h-20 md:w-24 md:h-24 text-2xl md:text-3xl rounded-2xl'
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;

  if (validPhotoUrl && !imgError) {
    return (
      <img
        src={validPhotoUrl}
        alt={user?.full_name || 'User Avatar'}
        onClick={onClick}
        className={`${currentSizeClass} object-cover border border-slate-200 dark:border-zinc-700 shadow-sm shrink-0 ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      className={`${currentSizeClass} bg-gradient-to-tr from-orange-500 to-amber-400 font-black text-white flex items-center justify-center border border-orange-400/40 shadow-sm shrink-0 uppercase tracking-wider select-none ${className}`}
      title={user?.full_name || 'User Profile'}
    >
      {initials}
    </div>
  );
};
