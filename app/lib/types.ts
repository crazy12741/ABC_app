export type Profile = {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string;
  role: 'customer' | 'admin' | string;
  onboardingComplete: boolean;
  referralCode: string | null;
  emailUpdates: boolean;
  pushEnabled: boolean;
  createdAt: string;
};

export type SettingsView = {
  openingAt: string | null;
  venue: string | null;
  city: string | null;
  mysteryTitle: string | null;
  mysteryTagline: string | null;
  mysteryImageUrl: string | null;
  referralReward: string | null;
  referralRules: string | null;
  orderingEnabled: boolean;
  deliveryFeePaise: number;
  minOrderPaise: number;
  orderingNote: string | null;
};

export type AnnouncementView = {
  id: number;
  title: string;
  body: string;
  pinned: boolean;
  publishedAt: string | null;
};

export type PollOptionView = {
  id: number;
  label: string;
  votes?: number;
  percent?: number;
};

export type PollView = {
  id: number;
  question: string;
  description: string | null;
  status: 'open' | 'closed' | string;
  isOpen: boolean;
  showResults: boolean;
  resultsVisible: boolean;
  closesAt: string | null;
  hasVoted: boolean;
  selectedOptionId: number | null;
  totalVotes?: number;
  options: PollOptionView[];
};

export type MysteryClueView = {
  id: number;
  clueNumber: number;
  title: string;
  body: string;
  imageUrl: string | null;
  publishedAt: string | null;
};

export type ReferralHistoryItem = {
  id: number;
  name: string;
  joinedAt: string;
  status: string;
  rewardStatus: string;
};

export type ReferralSummary = {
  code: string | null;
  verifiedCount: number;
  pendingRewardCount: number;
  reward: string | null;
  rules: string | null;
  history: ReferralHistoryItem[];
};

export type NotificationView = {
  id: number;
  title: string;
  body: string;
  type: string;
  createdAt: string;
  read: boolean;
};

export type VotingHistoryItem = {
  id: number;
  pollId: number;
  question: string;
  option: string;
  votedAt: string;
};

export type HomeData = {
  profile: Profile;
  settings: SettingsView | null;
  announcements: AnnouncementView[];
  polls: PollView[];
  latestClue: MysteryClueView | null;
  referral: ReferralSummary;
  unreadNotifications: number;
};

export type MysteryData = {
  settings: SettingsView | null;
  clues: MysteryClueView[];
};

export type PollsData = {
  polls: PollView[];
};

export type ProfileData = {
  profile: Profile;
  votingHistory: VotingHistoryItem[];
  referral: ReferralSummary;
};

export type AdminCustomer = {
  id: string;
  name: string;
  phoneNumber: string;
  email: string | null;
  role: string;
  onboardingComplete: boolean;
  createdAt: string;
  referralCount: number;
  voteCount: number;
};

export type AdminPollOption = {
  id: number;
  label: string;
  votes: number;
};

export type AdminPoll = {
  id: number;
  question: string;
  description: string | null;
  status: string;
  showResults: boolean;
  closesAt: string | null;
  createdAt: string;
  totalVotes: number;
  options: AdminPollOption[];
};

export type AdminAnnouncement = {
  id: number;
  title: string;
  body: string;
  published: boolean;
  pinned: boolean;
  publishedAt: string | null;
  createdAt: string;
};

export type AdminMysteryClue = {
  id: number;
  clueNumber: number;
  title: string;
  body: string;
  imageUrl: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
};

export type AdminReferral = {
  id: number;
  referrerName: string;
  referrerCode: string;
  referredName: string;
  status: string;
  rewardStatus: string;
  createdAt: string;
};

export type AdminOverview = {
  stats: {
    customers: number;
    newThisWeek: number;
    votes: number;
    verifiedReferrals: number;
    orders: number;
    activeOrders: number;
  };
  recentCustomers: AdminCustomer[];
  openPolls: number;
  unreadNotifications: number;
};

export type OrderingSettings = {
  enabled: boolean;
  deliveryFeePaise: number;
  minOrderPaise: number;
  note: string | null;
  venue: string | null;
  city: string | null;
};

export type MenuItemView = {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  pricePaise: number;
  imageUrl: string | null;
  isVeg: boolean;
  available: boolean;
};

export type MenuCategoryView = {
  id: number;
  name: string;
  items: MenuItemView[];
};

export type MenuData = {
  ordering: OrderingSettings;
  categories: MenuCategoryView[];
  featured: MenuItemView[];
};

export type OrderLineView = {
  id: number;
  menuItemId: number | null;
  name: string;
  unitPricePaise: number;
  quantity: number;
  lineTotalPaise: number;
};

export type OrderView = {
  id: number;
  orderNumber: string;
  userId: string;
  customerName: string;
  phone: string;
  status: string;
  fulfilment: 'pickup' | 'delivery' | string;
  paymentMethod: string;
  subtotalPaise: number;
  deliveryFeePaise: number;
  totalPaise: number;
  address: string | null;
  notes: string | null;
  placedAt: string;
  updatedAt: string;
  items: OrderLineView[];
};

export type OrdersData = {
  orders: OrderView[];
};

export type OrderDetailData = {
  order: OrderView;
};

export type AdminMenuCategory = {
  id: number;
  name: string;
  sortOrder: number;
  active: boolean;
  itemCount: number;
};

export type AdminMenuItem = MenuItemView & {
  categoryName: string;
  sortOrder: number;
};

export type AdminMenuData = {
  ordering: OrderingSettings;
  categories: AdminMenuCategory[];
  items: AdminMenuItem[];
};

export type AdminOrdersData = {
  orders: OrderView[];
};

