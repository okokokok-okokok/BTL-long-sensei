'use client';

import { useAuth } from '@/context/AuthContext';
import { formatTimeAgo } from '@/lib/announcement-format';
import type { PublicAnnouncement } from '@/types/public-announcements';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AnnouncementItem } from '@/types/student';

interface AnnouncementContextType {
  announcements: AnnouncementItem[];
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
  newToastItem: AnnouncementItem | null;
  source: string;
  allAnnouncementsUrl: string;
  lastSyncTime: Date | null;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refreshAnnouncements: () => Promise<void>;
  dismissToast: () => void;
}

const AnnouncementContext = createContext<AnnouncementContextType | undefined>(undefined);

const STORAGE_READ_KEY = 'ptit_read_announcement_ids';
const STORAGE_KNOWN_KEY = 'ptit_known_announcement_ids';

export const AnnouncementProvider: React.FC<{ children: React.ReactNode; siteUrl: string }> = ({ children, siteUrl }) => {
  const { isAuthenticated } = useAuth();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newToastItem, setNewToastItem] = useState<AnnouncementItem | null>(null);
  const [source, setSource] = useState<string>(siteUrl ? new URL(siteUrl).hostname : 'Giáo vụ');
  const [allAnnouncementsUrl, setAllAnnouncementsUrl] = useState(siteUrl);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const fetchVersion = useRef(0);

  // Load read status from localStorage
  const getReadIds = useCallback((): Set<string> => {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = localStorage.getItem(STORAGE_READ_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  }, []);

  // Save read status to localStorage
  const saveReadIds = useCallback((ids: Set<string>) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_READ_KEY, JSON.stringify(Array.from(ids)));
    } catch (e) {
      console.error('Error saving read announcements:', e);
    }
  }, []);

  // Fetch announcements from /api/announcements
  const fetchAnnouncements = useCallback(
    async (isBackground = false) => {
      const version = ++fetchVersion.current;
      if (!isBackground) {
        setIsLoading(true);
      }
      try {
        const res = await fetch('/api/announcements', { cache: 'no-store', credentials: 'omit' });
        if (!res.ok) throw new Error('Chưa tải được thông báo Giáo vụ. Vui lòng thử lại.');
        const result = await res.json();
        if (version !== fetchVersion.current) return;

        if (result.status === 'success' && Array.isArray(result.data)) {
          const rawItems: PublicAnnouncement[] = result.data;
          const readIds = isAuthenticated ? getReadIds() : new Set<string>();

          if (isAuthenticated) {
          // Check for brand new items (not in known items)
          let knownIds: Set<string> = new Set();
          try {
            const rawKnown = localStorage.getItem(STORAGE_KNOWN_KEY);
            if (rawKnown) {
              knownIds = new Set(JSON.parse(rawKnown));
            }
          } catch {
            // ignore
          }

          // If knownIds is not empty and we find an item that wasn't known before, it's a new notice!
          if (knownIds.size > 0) {
            const freshItems = rawItems.filter((it) => !knownIds.has(it.id));
            if (freshItems.length > 0) {
              // Show toast for the newest announcement
              setNewToastItem({ ...freshItems[0], timeAgo: formatTimeAgo(freshItems[0].date), read: readIds.has(freshItems[0].id) });
            }
          }

          // Save current items as known
          try {
            const allCurrentIds = rawItems.map((it) => it.id);
            localStorage.setItem(STORAGE_KNOWN_KEY, JSON.stringify(allCurrentIds));
          } catch {
            // ignore
          }

          }

          const processed = rawItems.map((item) => ({
            ...item,
            timeAgo: formatTimeAgo(item.date),
            read: isAuthenticated && readIds.has(item.id),
          }));

          setAnnouncements(processed);
          setSource(result.source || (siteUrl ? new URL(siteUrl).hostname : 'Giáo vụ'));
          setAllAnnouncementsUrl(result.allAnnouncementsUrl || siteUrl);
          setLastSyncTime(new Date());
          setError(null);
        } else throw new Error('Dữ liệu thông báo không hợp lệ. Vui lòng thử lại.');
      } catch (err: any) {
        if (version !== fetchVersion.current) return;
        console.warn('Failed to load announcements from API:', err?.message);
        setError(err?.message || 'Failed to fetch');
      } finally {
        if (!isBackground && version === fetchVersion.current) {
          setIsLoading(false);
        }
      }
    },
    [getReadIds, isAuthenticated, siteUrl]
  );

  useEffect(() => { if (!isAuthenticated) setNewToastItem(null); }, [isAuthenticated]);

  // Initial load
  useEffect(() => {
    fetchAnnouncements(false);
  }, [fetchAnnouncements]);

  // Periodic polling every 60 seconds to detect new announcements automatically
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAnnouncements(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchAnnouncements]);

  // Mark single announcement as read
  const markAsRead = useCallback(
    (id: string) => {
      if (!isAuthenticated) return;
      const readIds = getReadIds();
      readIds.add(id);
      saveReadIds(readIds);

      setAnnouncements((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: true } : item))
      );
    },
    [getReadIds, saveReadIds, isAuthenticated]
  );

  // Mark all announcements as read
  const markAllAsRead = useCallback(() => {
    if (!isAuthenticated) return;
    const readIds = getReadIds();
    announcements.forEach((a) => readIds.add(a.id));
    saveReadIds(readIds);

    setAnnouncements((prev) => prev.map((item) => ({ ...item, read: true })));
  }, [announcements, getReadIds, saveReadIds, isAuthenticated]);

  // Manual refresh
  const refreshAnnouncements = useCallback(async () => {
    await fetchAnnouncements(false);
  }, [fetchAnnouncements]);

  // Dismiss toast
  const dismissToast = useCallback(() => {
    setNewToastItem(null);
  }, []);

  const unreadCount = announcements.filter((a) => !a.read).length;

  return (
    <AnnouncementContext.Provider
      value={{
        announcements,
        isLoading,
        error,
        unreadCount,
        newToastItem,
        source,
        allAnnouncementsUrl,
        lastSyncTime,
        markAsRead,
        markAllAsRead,
        refreshAnnouncements,
        dismissToast,
      }}
    >
      {children}
    </AnnouncementContext.Provider>
  );
};

export const useAnnouncements = (): AnnouncementContextType => {
  const context = useContext(AnnouncementContext);
  if (!context) {
    throw new Error('useAnnouncements must be used within an AnnouncementProvider');
  }
  return context;
};
