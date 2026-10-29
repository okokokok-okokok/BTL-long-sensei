// Only fields derived from anonymous, published articles may cross the public API.
export interface PublicAnnouncement {
  id: string;
  title: string;
  content: string;
  date: string;
  link: string;
  source: string;
  isUrgent: boolean;
}
export interface PublicAnnouncementFeed {
  data: PublicAnnouncement[];
  source: string;
  allAnnouncementsUrl: string;
}
