import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  UserProfile,
  BusinessRequest,
  Conversation,
  PrivateEvent,
  NetworkActivity,
  Community,
  CommunityDiscussion,
  InvestorProfile,
  Introduction,
  AppNotification,
  Post,
  PostType,
  PostVisibility,
  ResolutionRecord
} from '../types';
import type { CreateResolutionInput } from '../services/resolutionService';
import { ApiClient } from '../services/api';

export type NavTab = 'home' | 'help' | 'discover' | 'people' | 'communities' | 'requests' | 'investors' | 'network' | 'messages' | 'profile';

interface AppContextType {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  currentUser: UserProfile;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  users: UserProfile[];
  requests: BusinessRequest[];
  conversations: Conversation[];
  introductions: Introduction[];
  notifications: AppNotification[];
  posts: Post[];
  resolutions: ResolutionRecord[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  events: PrivateEvent[];
  activities: NetworkActivity[];
  communities: Community[];
  discussions: CommunityDiscussion[];
  investors: InvestorProfile[];
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  isLoadingSession: boolean;
  refreshAppData: () => Promise<void>;

  selectedProfile: UserProfile | null;
  setSelectedProfile: (profile: UserProfile | null) => void;

  // Modals state
  isCreateRequestOpen: boolean;
  setIsCreateRequestOpen: (open: boolean) => void;
  isCreatePostOpen: boolean;
  setIsCreatePostOpen: (open: boolean) => void;
  isCreateCommunityOpen: boolean;
  setIsCreateCommunityOpen: (open: boolean) => void;
  isVerificationModalOpen: boolean;
  setIsVerificationModalOpen: (open: boolean) => void;
  selectedRequestForHelp: BusinessRequest | null;
  setSelectedRequestForHelp: (req: BusinessRequest | null) => void;
  selectedPostForPrivateShare: Post | null;
  setSelectedPostForPrivateShare: (post: Post | null) => void;

  // Problems Solved Resolution Prompt Modal State
  isResolutionModalOpen: boolean;
  setIsResolutionModalOpen: (open: boolean) => void;
  selectedRequestForResolution: BusinessRequest | null;
  setSelectedRequestForResolution: (req: BusinessRequest | null) => void;
  selectedHelperForResolution: UserProfile | null;
  setSelectedHelperForResolution: (helper: UserProfile | null) => void;

  // Actions
  addRequest: (req: Omit<BusinessRequest, 'id' | 'author' | 'authorId' | 'createdAt' | 'responsesCount' | 'status'>) => Promise<void>;
  resolveRequest: (requestId: string, resolutionContext: string) => Promise<void>;
  sendMessage: (conversationId: string, text: string) => Promise<void>;
  offerHelpOnRequest: (requestId: string, offerNote: string) => Promise<void>;
  toggleEventRSVP: (eventId: string) => void;
  startDirectMessage: (user: UserProfile) => Promise<void>;
  joinCommunity: (communityId: string) => Promise<void>;
  leaveCommunity: (communityId: string) => Promise<void>;
  createCommunity: (name: string, description: string, category: string, isPrivate: boolean) => Promise<void>;
  addDiscussion: (communityId: string, title: string, body: string, topicCategory?: string) => Promise<void>;

  // Post Actions
  addPost: (postData: { type: PostType; title?: string; body: string; linkUrl?: string; visibility: PostVisibility; communityId?: string; recipientId?: string }) => Promise<void>;
  toggleUsefulPost: (postId: string) => Promise<void>;
  toggleSavePost: (postId: string) => Promise<void>;
  addCommentToPost: (postId: string, body: string, parentCommentId?: string) => Promise<void>;
  sharePostPrivately: (postId: string, recipientId: string, message?: string) => Promise<void>;
  createPostCommunityId: string | null;
  openCreatePost: (communityId?: string) => void;

  // Problems Solved / Resolution Actions
  createResolution: (input: CreateResolutionInput) => Promise<void>;
  confirmResolution: (resolutionId: string, confirmed: boolean) => Promise<void>;
  openResolutionPrompt: (req: BusinessRequest, helper: UserProfile) => void;

  // Introductions System
  isIntroModalOpen: boolean;
  setIsIntroModalOpen: (open: boolean) => void;
  introTargetUser: UserProfile | null;
  introFacilitatorUser: UserProfile | null;
  openIntroRequest: (targetUser: UserProfile, facilitatorUser?: UserProfile) => void;
  requestIntroduction: (targetUser: UserProfile, reason: string, facilitatorUser?: UserProfile) => Promise<{ success: boolean; isDuplicate: boolean; intro?: Introduction; error?: string }>;
  acceptIntroduction: (introId: string) => Promise<void>;
  declineIntroduction: (introId: string) => Promise<void>;
  markNotificationRead: (notifId: string) => Promise<void>;

  // Discover Filter State
  discoverSearch: string;
  setDiscoverSearch: (search: string) => void;
  discoverFilterRole: string;
  setDiscoverFilterRole: (role: string) => void;
  discoverFilterIndustry: string;
  setDiscoverFilterIndustry: (ind: string) => void;
  discoverFilterProblemCategory: string;
  setDiscoverFilterProblemCategory: (cat: string) => void;
}

const DEFAULT_CURRENT_USER: UserProfile = {
  id: '',
  name: 'Loading...',
  avatar: '',
  initials: '--',
  role: 'Member',
  company: 'Stealth',
  companyStage: 'Series A',
  industry: 'Technology',
  location: 'Remote',
  verificationLevel: 'unverified',
  verificationPillars: {
    identityVerified: false,
    corporateDomainVerified: false,
    entityVerified: false,
    founderStatusVerified: false
  },
  bio: '',
  canHelpWith: [],
  lookingFor: [],
  experience: [],
  skills: [],
  mutualConnectionsCount: 0
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(ApiClient.hasToken());
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);

  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_CURRENT_USER);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<BusinessRequest[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [resolutions, setResolutions] = useState<ResolutionRecord[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [events, setEvents] = useState<PrivateEvent[]>([]);
  const [activities] = useState<NetworkActivity[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [discussions] = useState<CommunityDiscussion[]>([]);
  const [investors, setInvestors] = useState<InvestorProfile[]>([]);
  const [introductions, setIntroductions] = useState<Introduction[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);

  // Modals state
  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [createPostCommunityId, setCreatePostCommunityId] = useState<string | null>(null);
  const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [selectedRequestForHelp, setSelectedRequestForHelp] = useState<BusinessRequest | null>(null);
  const [selectedPostForPrivateShare, setSelectedPostForPrivateShare] = useState<Post | null>(null);

  // Resolution Prompt Modal State
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  const [selectedRequestForResolution, setSelectedRequestForResolution] = useState<BusinessRequest | null>(null);
  const [selectedHelperForResolution, setSelectedHelperForResolution] = useState<UserProfile | null>(null);

  // Intro Request Modal State
  const [isIntroModalOpen, setIsIntroModalOpen] = useState(false);
  const [introTargetUser, setIntroTargetUser] = useState<UserProfile | null>(null);
  const [introFacilitatorUser, setIntroFacilitatorUser] = useState<UserProfile | null>(null);

  // Filters
  const [discoverSearch, setDiscoverSearch] = useState('');
  const [discoverFilterRole, setDiscoverFilterRole] = useState('');
  const [discoverFilterIndustry, setDiscoverFilterIndustry] = useState('');
  const [discoverFilterProblemCategory, setDiscoverFilterProblemCategory] = useState('');

  const refreshAppData = useCallback(async () => {
    if (!ApiClient.hasToken()) {
      setIsAuthenticated(false);
      setIsLoadingSession(false);
      return;
    }

    try {
      const me = await ApiClient.getCurrentUser();
      setCurrentUser(me);
      setIsAuthenticated(true);

      // Parallel data fetching from Express API
      const [
        fetchedUsers,
        fetchedRequests,
        fetchedPosts,
        fetchedIntros,
        fetchedConvs,
        fetchedNotifs,
        fetchedComms,
        fetchedInvestors,
        fetchedResolutions
      ] = await Promise.all([
        ApiClient.getProfiles().catch(() => []),
        ApiClient.getRequests().catch(() => []),
        ApiClient.getPosts().catch(() => []),
        ApiClient.getIntros().catch(() => []),
        ApiClient.getConversations().catch(() => []),
        ApiClient.getNotifications().catch(() => []),
        ApiClient.getCommunities().catch(() => []),
        ApiClient.getInvestors().catch(() => []),
        ApiClient.getResolutions().catch(() => [])
      ]);

      setUsers(fetchedUsers);
      setRequests(fetchedRequests);
      setPosts(fetchedPosts);
      setIntroductions(fetchedIntros);
      setConversations(fetchedConvs);
      setNotifications(fetchedNotifs);
      setCommunities(fetchedComms);
      if (fetchedInvestors.length > 0) {
        setInvestors(fetchedInvestors);
      }
      setResolutions(fetchedResolutions);
      if (fetchedConvs.length > 0 && !activeConversationId) {
        setActiveConversationId(fetchedConvs[0].id);
      }
    } catch (err) {
      console.error('Failed to load session/data:', err);
      ApiClient.clearTokens();
      setIsAuthenticated(false);
    } finally {
      setIsLoadingSession(false);
    }
  }, [activeConversationId]);

  useEffect(() => {
    refreshAppData();
  }, [refreshAppData]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const openCreatePost = (communityId?: string) => {
    setCreatePostCommunityId(communityId || null);
    setIsCreatePostOpen(true);
  };

  const openIntroRequest = (targetUser: UserProfile, facilitatorUser?: UserProfile) => {
    const defaultFacilitator = facilitatorUser || targetUser.pathway?.facilitator || currentUser;
    setIntroTargetUser(targetUser);
    setIntroFacilitatorUser(defaultFacilitator);
    setIsIntroModalOpen(true);
  };

  const markNotificationRead = async (notifId: string) => {
    try {
      await ApiClient.markNotificationRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const requestIntroduction = async (
    targetUser: UserProfile,
    reason: string,
    facilitatorUser?: UserProfile
  ) => {
    try {
      const facilitator = facilitatorUser || targetUser.pathway?.facilitator || currentUser;
      const newIntro = await ApiClient.requestIntro(
        targetUser.id,
        reason,
        facilitator.id !== currentUser.id ? facilitator.id : undefined
      );

      setIntroductions((prev) => [newIntro, ...prev]);
      await refreshAppData();
      return { success: true, isDuplicate: false, intro: newIntro };
    } catch (err: any) {
      console.error('Request intro error:', err);
      return { success: false, isDuplicate: err.message.includes('Conflict') || err.message.includes('exists'), error: err.message };
    }
  };

  const acceptIntroduction = async (introId: string) => {
    try {
      const updatedIntro = await ApiClient.respondIntro(introId, 'ACCEPTED');
      setIntroductions((prev) =>
        prev.map((i) => (i.id === introId ? updatedIntro : i))
      );
      await refreshAppData();
      setActiveTab('messages');
    } catch (err) {
      console.error('Accept intro error:', err);
    }
  };

  const declineIntroduction = async (introId: string) => {
    try {
      const updatedIntro = await ApiClient.respondIntro(introId, 'DECLINED');
      setIntroductions((prev) =>
        prev.map((i) => (i.id === introId ? updatedIntro : i))
      );
    } catch (err) {
      console.error('Decline intro error:', err);
    }
  };

  const joinCommunity = async (communityId: string) => {
    try {
      await ApiClient.joinCommunity(communityId);
      setCommunities((prev) =>
        prev.map((c) => (c.id === communityId ? { ...c, isJoined: true, membersCount: c.membersCount + 1 } : c))
      );
    } catch (err) {
      console.error('Join community error:', err);
    }
  };

  const leaveCommunity = async (communityId: string) => {
    try {
      await ApiClient.leaveCommunity(communityId);
      setCommunities((prev) =>
        prev.map((c) => (c.id === communityId ? { ...c, isJoined: false, membersCount: Math.max(0, c.membersCount - 1) } : c))
      );
    } catch (err) {
      console.error('Leave community error:', err);
    }
  };

  const createCommunity = async (name: string, description: string, category: string, isPrivate: boolean) => {
    try {
      const newCommunity = await ApiClient.createCommunity(name, description, category, isPrivate);
      setCommunities((prev) => [newCommunity, ...prev]);
      setIsCreateCommunityOpen(false);
    } catch (err) {
      console.error('Create community error:', err);
    }
  };

  const addDiscussion = async (communityId: string, title: string, body: string, topicCategory: string = 'QUESTION') => {
    try {
      await ApiClient.addDiscussion(communityId, title, body, topicCategory);
      await refreshAppData();
    } catch (err) {
      console.error('Add discussion error:', err);
    }
  };

  const addPost = async (postData: { type: PostType; title?: string; body: string; linkUrl?: string; visibility: PostVisibility; communityId?: string; recipientId?: string }) => {
    try {
      const newPost = await ApiClient.createPost(postData);
      setPosts((prev) => [newPost, ...prev]);
      setIsCreatePostOpen(false);
    } catch (err) {
      console.error('Create post error:', err);
    }
  };

  const toggleUsefulPost = async (postId: string) => {
    try {
      await ApiClient.toggleUsefulPost(postId);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const isUsefulByMe = !p.isUsefulByMe;
            return {
              ...p,
              isUsefulByMe,
              usefulCount: isUsefulByMe ? p.usefulCount + 1 : Math.max(0, p.usefulCount - 1)
            };
          }
          return p;
        })
      );
    } catch (err) {
      console.error('Toggle useful post error:', err);
    }
  };

  const toggleSavePost = async (postId: string) => {
    try {
      await ApiClient.toggleSavePost(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, isSavedByMe: !p.isSavedByMe } : p))
      );
    } catch (err) {
      console.error('Toggle save post error:', err);
    }
  };

  const addCommentToPost = async (postId: string, body: string, parentCommentId?: string) => {
    if (!body.trim()) return;
    try {
      await ApiClient.addCommentToPost(postId, body, parentCommentId);
      await refreshAppData();
    } catch (err) {
      console.error('Add comment error:', err);
    }
  };

  const sharePostPrivately = async (postId: string, recipientId: string, message?: string) => {
    try {
      await ApiClient.sharePostPrivately(postId, recipientId, message);
      setSelectedPostForPrivateShare(null);
      await refreshAppData();
    } catch (err) {
      console.error('Share post error:', err);
    }
  };

  const addRequest = async (newReqData: Omit<BusinessRequest, 'id' | 'author' | 'authorId' | 'createdAt' | 'responsesCount' | 'status'>) => {
    try {
      const newReq = await ApiClient.createRequest({
        needCategory: newReqData.needCategory,
        title: newReqData.title,
        needDescription: newReqData.needDescription,
        context: newReqData.context,
        industry: newReqData.industry,
        location: newReqData.location,
        desiredConnection: newReqData.desiredConnection,
        urgency: newReqData.urgent ? 'URGENT' : 'NORMAL',
        visibility: newReqData.visibility
      });

      setRequests((prev) => [newReq, ...prev]);
      setIsCreateRequestOpen(false);
      await refreshAppData();
    } catch (err) {
      console.error('Create request error:', err);
    }
  };

  const resolveRequest = async (requestId: string, resolutionContext: string) => {
    try {
      const updated = await ApiClient.updateRequestStatus(requestId, 'FULFILLED');
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...updated, resolutionContext } : r))
      );
    } catch (err) {
      console.error('Resolve request error:', err);
    }
  };

  const sendMessage = async (conversationId: string, text: string) => {
    if (!text.trim()) return;
    try {
      const newMsg = await ApiClient.sendMessage(conversationId, text);
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              lastMessage: text,
              lastMessageTime: 'Just now',
              messages: [
                ...conv.messages,
                {
                  id: newMsg.id,
                  senderId: currentUser.id,
                  text,
                  timestamp: 'Just now'
                }
              ]
            };
          }
          return conv;
        })
      );
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  const offerHelpOnRequest = async (requestId: string, offerNote: string) => {
    try {
      setSelectedRequestForHelp(null);
      const req = requests.find((r) => r.id === requestId);
      if (req) {
        let conv = conversations.find((c) => c.participant.id === req.author.id);
        if (conv) {
          await sendMessage(conv.id, `[Help Offered regarding "${req.title}"]: ${offerNote}`);
          setActiveConversationId(conv.id);
        } else {
          conv = await ApiClient.startConversation(
            req.author.id,
            `Offer to assist with your request "${req.title}": ${offerNote}`,
            req.title,
            'Direct Assistance Offer'
          );
          await refreshAppData();
          if (conv) setActiveConversationId(conv.id);
        }
        setActiveTab('messages');
      }
    } catch (err) {
      console.error('Offer help error:', err);
    }
  };

  const toggleEventRSVP = (eventId: string) => {
    setEvents((prev) =>
      prev.map((evt) => {
        if (evt.id === eventId) {
          const isAttending = !evt.isAttending;
          return {
            ...evt,
            isAttending,
            attendeesCount: isAttending ? evt.attendeesCount + 1 : evt.attendeesCount - 1
          };
        }
        return evt;
      })
    );
  };

  const startDirectMessage = async (user: UserProfile) => {
    try {
      let conv = conversations.find((c) => c.participant.id === user.id);
      if (conv) {
        setActiveConversationId(conv.id);
      } else {
        conv = await ApiClient.startConversation(
          user.id,
          `Hi ${user.name.split(' ')[0]}, looking forward to connecting on Founders Hut.`
        );
        await refreshAppData();
        if (conv) setActiveConversationId(conv.id);
      }
      setActiveTab('messages');
    } catch (err) {
      console.error('Start direct message error:', err);
    }
  };

  // Resolution Prompt Actions
  const openResolutionPrompt = (req: BusinessRequest, helper: UserProfile) => {
    setSelectedRequestForResolution(req);
    setSelectedHelperForResolution(helper);
    setIsResolutionModalOpen(true);
  };

  const createResolution = async (input: CreateResolutionInput) => {
    try {
      const record = await ApiClient.createResolution({
        requestId: input.requestId,
        helperId: input.helper.id,
        introductionId: input.introductionId,
        outcomeType: input.outcomeType,
        outcomeCategory: input.outcomeCategory,
        helpType: input.helpType,
        askerAssessment: input.askerAssessment,
        summary: input.summary,
        visibility: input.visibility
      });
      setResolutions((prev) => [record, ...prev]);
      await refreshAppData();
    } catch (err: any) {
      console.warn('Resolution creation warning:', err.message);
    }
  };

  const confirmResolution = async (resolutionId: string, confirmed: boolean) => {
    try {
      const record = await ApiClient.confirmResolution(resolutionId, confirmed);
      setResolutions((prev) => prev.map((r) => (r.id === resolutionId ? record : r)));
      await refreshAppData();
    } catch (err: any) {
      console.warn('Resolution confirmation warning:', err.message);
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        theme,
        toggleTheme,
        currentUser,
        setCurrentUser,
        users,
        requests,
        conversations,
        introductions,
        notifications,
        posts,
        resolutions,
        activeConversationId,
        setActiveConversationId,
        events,
        activities,
        communities,
        discussions,
        investors,
        isAuthenticated,
        setIsAuthenticated,
        isLoadingSession,
        refreshAppData,
        selectedProfile,
        setSelectedProfile,
        isCreateRequestOpen,
        setIsCreateRequestOpen,
        isCreatePostOpen,
        setIsCreatePostOpen,
        isCreateCommunityOpen,
        setIsCreateCommunityOpen,
        isVerificationModalOpen,
        setIsVerificationModalOpen,
        selectedRequestForHelp,
        setSelectedRequestForHelp,
        selectedPostForPrivateShare,
        setSelectedPostForPrivateShare,
        isResolutionModalOpen,
        setIsResolutionModalOpen,
        selectedRequestForResolution,
        setSelectedRequestForResolution,
        selectedHelperForResolution,
        setSelectedHelperForResolution,
        addRequest,
        resolveRequest,
        sendMessage,
        offerHelpOnRequest,
        toggleEventRSVP,
        startDirectMessage,
        joinCommunity,
        leaveCommunity,
        createCommunity,
        addDiscussion,
        addPost,
        toggleUsefulPost,
        toggleSavePost,
        addCommentToPost,
        sharePostPrivately,
        createResolution,
        confirmResolution,
        openResolutionPrompt,
        createPostCommunityId,
        openCreatePost,
        isIntroModalOpen,
        setIsIntroModalOpen,
        introTargetUser,
        introFacilitatorUser,
        openIntroRequest,
        requestIntroduction,
        acceptIntroduction,
        declineIntroduction,
        markNotificationRead,
        discoverSearch,
        setDiscoverSearch,
        discoverFilterRole,
        setDiscoverFilterRole,
        discoverFilterIndustry,
        setDiscoverFilterIndustry,
        discoverFilterProblemCategory,
        setDiscoverFilterProblemCategory
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
