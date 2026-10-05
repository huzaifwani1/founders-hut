import type {
  UserProfile,
  BusinessRequest,
  Conversation,
  VerificationLevel,
  Introduction,
  AppNotification,
  Community,
  Post,
  InvestorProfile,
  ResolutionRecord
} from '../types';

const getApiBaseUrl = (): string => {
  const viteApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (viteApiUrl && viteApiUrl.trim()) {
    return viteApiUrl.trim().replace(/\/+$/, '');
  }

  const isProd = import.meta.env.MODE === 'production' || import.meta.env.PROD;

  if (isProd) {
    console.error('CRITICAL BUILD ERROR: VITE_API_URL is missing in production build!');
    throw new Error('VITE_API_URL environment variable must be specified during production build.');
  }

  return 'http://localhost:5001/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();

export class ApiClient {
  private static accessToken: string | null = localStorage.getItem('fh_access_token');
  private static refreshToken: string | null = localStorage.getItem('fh_refresh_token');

  public static setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    localStorage.setItem('fh_access_token', access);
    localStorage.setItem('fh_refresh_token', refresh);
  }

  public static clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('fh_access_token');
    localStorage.removeItem('fh_refresh_token');
    localStorage.removeItem('fh_token');
    localStorage.removeItem('fh_refreshToken');
  }

  public static hasToken(): boolean {
    return !!this.accessToken || !!localStorage.getItem('fh_access_token');
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('fh_access_token');
    }
    if (!this.refreshToken) {
      this.refreshToken = localStorage.getItem('fh_refresh_token');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>)
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        credentials: 'include',
        ...options,
        headers
      });
    } catch (netErr: any) {
      console.error(`[API Network Error] Target: ${API_BASE_URL}${endpoint}`, netErr);
      throw new Error(`Unable to reach Founders Hut server at ${API_BASE_URL}. Please check your connection.`);
    }

    // Auto Refresh Token Rotation on 401
    if (response.status === 401 && this.refreshToken && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: this.refreshToken })
        });

        if (refreshRes.ok) {
          const tokens = await refreshRes.json();
          this.setTokens(tokens.accessToken, tokens.refreshToken);
          headers['Authorization'] = `Bearer ${tokens.accessToken}`;

          // Retry original request
          response = await fetch(`${API_BASE_URL}${endpoint}`, {
            credentials: 'include',
            ...options,
            headers
          });
        } else {
          this.clearTokens();
        }
      } catch (err) {
        this.clearTokens();
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      console.error('API Error Response:', response.status, JSON.stringify(errorData));
      
      const serverMessage = errorData.error || errorData.message || errorData.details?.[0]?.message;

      if (response.status === 401 && endpoint === '/auth/login') {
        throw new Error(serverMessage || 'Invalid email or password.');
      }
      if (response.status === 403) {
        throw new Error(serverMessage || 'Access restricted. Authorization required.');
      }
      if (response.status === 429) {
        throw new Error(serverMessage || 'Too many authentication attempts. Please try again in 15 minutes.');
      }

      throw new Error(serverMessage || `HTTP ${response.status} Error`);
    }

    return response.json();
  }

  // ----------------------------------------------------
  // Auth APIs
  // ----------------------------------------------------
  public static async register(payload: { email: string; password: string; name?: string; role?: string; company?: string; industry?: string; location?: string }) {
    const data = await this.request<{ accessToken: string; refreshToken: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
        name: payload.name || 'Executive Member',
        role: payload.role || 'Founder',
        company: payload.company || 'Enterprise',
        industry: payload.industry || 'Technology',
        location: payload.location || 'Remote'
      })
    });
    if (data.accessToken && data.refreshToken) {
      this.setTokens(data.accessToken, data.refreshToken);
    }
    return {
      user: data.user ? this.transformProfile(data.user) : null,
      message: data.user ? undefined : (data as any).message
    };
  }

  public static async login(email: string, password: string) {
    const data = await this.request<{ accessToken: string; refreshToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setTokens(data.accessToken, data.refreshToken);
    return this.transformProfile(data.user);
  }

  public static async logout() {
    try {
      if (this.refreshToken) {
        await this.request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: this.refreshToken })
        }).catch(() => { });
      }
    } finally {
      this.clearTokens();
    }
  }

  public static async getCurrentUser(): Promise<UserProfile> {
    const raw = await this.request<any>('/auth/me');
    return this.transformProfile(raw);
  }

  public static async forgotPassword(email: string) {
    return this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  public static async resetPassword(token: string, newPassword: string) {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    });
  }

  // ----------------------------------------------------
  // User Profile & Directory APIs
  // ----------------------------------------------------
  public static async discoverMembers(query?: string, role?: string, industry?: string): Promise<UserProfile[]> {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (role) params.append('role', role);
    if (industry) params.append('industry', industry);

    const data = await this.request<any>(`/discover?${params.toString()}`);
    const list = Array.isArray(data) ? data : (data.people || []);
    return list.map(this.transformProfile);
  }

  public static async getProfiles(): Promise<UserProfile[]> {
    return this.discoverMembers();
  }

  public static async getProfileById(id: string): Promise<UserProfile> {
    const raw = await this.request<any>(`/profiles/${id}`);
    return this.transformProfile(raw);
  }

  public static async updateProfile(payload: Partial<UserProfile>): Promise<UserProfile> {
    const raw = await this.request<any>('/profiles/me', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    return this.transformProfile(raw);
  }

  // ----------------------------------------------------
  // Verification APIs
  // ----------------------------------------------------
  public static async getVerificationStatus() {
    return this.request<any>('/verifications/my-status');
  }

  public static async submitVerificationDoc(documentType: string, fileRef: string) {
    return this.request<any>('/verifications/submit', {
      method: 'POST',
      body: JSON.stringify({ documentType, fileRef })
    });
  }

  // ----------------------------------------------------
  // Requests APIs
  // ----------------------------------------------------
  public static async getRequests(category?: string): Promise<BusinessRequest[]> {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    const data = await this.request<any[]>(`/requests?${params.toString()}`);
    return data.map(this.transformRequest);
  }

  public static async createRequest(payload: {
    needCategory: string;
    title: string;
    needDescription: string;
    context?: string;
    industry?: string;
    location?: string;
    desiredConnection?: string;
    urgency?: 'NORMAL' | 'URGENT';
    visibility?: string;
  }): Promise<BusinessRequest> {
    const data = await this.request<any>('/requests', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return this.transformRequest(data);
  }

  public static async updateRequestStatus(id: string, status: string): Promise<BusinessRequest> {
    const data = await this.request<any>(`/requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    return this.transformRequest(data);
  }

  public static async deleteRequest(id: string) {
    return this.request<{ message: string }>(`/requests/${id}`, {
      method: 'DELETE'
    });
  }

  // ----------------------------------------------------
  // Introductions APIs
  // ----------------------------------------------------
  public static async getIntros(): Promise<Introduction[]> {
    const data = await this.request<any[]>('/introductions');
    return data.map(this.transformIntro);
  }

  public static async requestIntro(
    toUserId: string,
    reason: string,
    facilitatorId?: string,
    suggestedUserId?: string
  ): Promise<Introduction> {
    const data = await this.request<any>('/introductions/request', {
      method: 'POST',
      body: JSON.stringify({ toUserId, reason, facilitatorId, suggestedUserId })
    });
    return this.transformIntro(data);
  }

  public static async respondIntro(id: string, status: 'ACCEPTED' | 'DECLINED' | 'CONNECTED'): Promise<Introduction> {
    const data = await this.request<any>(`/introductions/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    return this.transformIntro(data);
  }

  // ----------------------------------------------------
  // Messaging & Conversations APIs
  // ----------------------------------------------------
  public static async getConversations(): Promise<Conversation[]> {
    const data = await this.request<any[]>('/messages/conversations');
    return data.map(this.transformConversation);
  }

  public static async getMessages(conversationId: string) {
    return this.request<any[]>(`/messages/conversations/${conversationId}/messages`);
  }

  public static async sendMessage(conversationId: string, text: string) {
    return this.request<any>(`/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  }

  public static async startConversation(recipientId: string, initialMessage?: string, topic?: string, facilitatedBy?: string): Promise<Conversation> {
    const data = await this.request<any>('/messages/start', {
      method: 'POST',
      body: JSON.stringify({ recipientId, initialMessage, topic, facilitatedBy })
    });
    return this.transformConversation(data);
  }

  // ----------------------------------------------------
  // Notifications APIs
  // ----------------------------------------------------
  public static async getNotifications(): Promise<AppNotification[]> {
    const data = await this.request<any[]>('/notifications');
    return data.map((n) => ({
      id: n.id,
      userId: n.userId,
      type: n.type as any,
      title: n.title,
      detail: n.detail,
      isRead: n.isRead,
      createdAt: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      targetId: n.targetId
    }));
  }

  public static async markNotificationRead(id: string) {
    return this.request<any>(`/notifications/${id}/read`, { method: 'PUT' });
  }

  // ----------------------------------------------------
  // Communities APIs
  // ----------------------------------------------------
  public static async getCommunities(category?: string): Promise<Community[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    const data = await this.request<any[]>(`/communities?${params.toString()}`);
    return data.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      category: c.category,
      description: c.description,
      icon: c.icon || undefined,
      isPrivate: c.isPrivate,
      membersCount: c.membersCount,
      isJoined: c.isJoined,
      userRole: c.userRole
    }));
  }

  public static async getCommunityDetails(slugOrId: string) {
    return this.request<any>(`/communities/${slugOrId}`);
  }

  public static async createCommunity(name: string, description: string, category: string, isPrivate: boolean): Promise<Community> {
    const data = await this.request<any>('/communities', {
      method: 'POST',
      body: JSON.stringify({ name, description, category, isPrivate })
    });
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      category: data.category,
      description: data.description,
      isPrivate: data.isPrivate,
      membersCount: data.membersCount || 1,
      isJoined: true,
      userRole: 'OWNER'
    };
  }

  public static async joinCommunity(id: string) {
    return this.request<any>(`/communities/${id}/join`, { method: 'POST' });
  }

  public static async leaveCommunity(id: string) {
    return this.request<any>(`/communities/${id}/leave`, { method: 'DELETE' });
  }

  public static async addDiscussion(communityId: string, title: string, body: string, topicCategory: string = 'QUESTION') {
    return this.request<any>(`/communities/${communityId}/discussions`, {
      method: 'POST',
      body: JSON.stringify({ title, body, topicCategory })
    });
  }

  // ----------------------------------------------------
  // Posts & Social Layer APIs
  // ----------------------------------------------------
  public static async getPosts(category?: string, communityId?: string): Promise<Post[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (communityId) params.append('communityId', communityId);

    const data = await this.request<any[]>(`/posts?${params.toString()}`);
    return data.map(this.transformPost);
  }

  public static async createPost(payload: {
    type: string;
    title?: string;
    body: string;
    linkUrl?: string;
    visibility: string;
    communityId?: string;
    recipientId?: string;
  }): Promise<Post> {
    const data = await this.request<any>('/posts', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return this.transformPost(data);
  }

  public static async toggleUsefulPost(postId: string) {
    return this.request<any>(`/posts/${postId}/useful`, { method: 'POST' });
  }

  public static async toggleSavePost(postId: string) {
    return this.request<any>(`/posts/${postId}/save`, { method: 'POST' });
  }

  public static async addCommentToPost(postId: string, body: string, parentCommentId?: string) {
    return this.request<any>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body, parentCommentId })
    });
  }

  public static async sharePostPrivately(postId: string, recipientId: string, message?: string) {
    return this.request<any>(`/posts/${postId}/private-share`, {
      method: 'POST',
      body: JSON.stringify({ recipientId, message })
    });
  }

  // ----------------------------------------------------
  // Investor APIs
  // ----------------------------------------------------
  public static async getInvestors(): Promise<InvestorProfile[]> {
    const data = await this.request<any[]>('/investors');
    return data.map(this.transformInvestor);
  }

  public static async searchInvestors(query: string): Promise<InvestorProfile[]> {
    const data = await this.request<any[]>('/investors/search', {
      method: 'POST',
      body: JSON.stringify({ query })
    });
    return data.map(this.transformInvestor);
  }

  public static async updateInvestorProfile(payload: any): Promise<InvestorProfile> {
    const data = await this.request<any>('/investors/me', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    return this.transformInvestor(data);
  }

  // ----------------------------------------------------
  // Resolution Records APIs
  // ----------------------------------------------------
  public static async getResolutions(requestId?: string, helperId?: string, askerId?: string): Promise<ResolutionRecord[]> {
    const params = new URLSearchParams();
    if (requestId) params.append('requestId', requestId);
    if (helperId) params.append('helperId', helperId);
    if (askerId) params.append('askerId', askerId);

    const data = await this.request<any[]>(`/resolutions?${params.toString()}`);
    return data.map(this.transformResolution);
  }

  public static async createResolution(payload: {
    requestId: string;
    helperId: string;
    introductionId?: string;
    outcomeType: string;
    outcomeCategory?: string;
    helpType: string;
    askerAssessment?: string;
    summary?: string;
    visibility?: string;
  }): Promise<ResolutionRecord> {
    const data = await this.request<any>('/resolutions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return this.transformResolution(data);
  }

  public static async confirmResolution(id: string, confirmed: boolean): Promise<ResolutionRecord> {
    const data = await this.request<any>(`/resolutions/${id}/confirm`, {
      method: 'PUT',
      body: JSON.stringify({ confirmed })
    });
    return this.transformResolution(data);
  }

  // ----------------------------------------------------
  // Data Transformers to guarantee UI compatibility
  // ----------------------------------------------------
  public static transformProfile(raw: any): UserProfile {
    if (!raw) {
      return {
        id: 'usr_unknown',
        name: 'Executive Member',
        initials: 'EM',
        avatar: '',
        role: 'Founder / Executive',
        company: 'Enterprise',
        companyStage: 'Bootstrapped',
        industry: 'Technology',
        location: 'Remote',
        verificationLevel: 'unverified',
        verificationPillars: { identityVerified: false, corporateDomainVerified: false, entityVerified: false, founderStatusVerified: false },
        bio: '',
        yearsBuilding: null,
        founderStage: 'EARLY_REVENUE',
        canHelpWith: [],
        lookingFor: [],
        experience: [],
        skills: [],
        metrics: {},
        mutualConnectionsCount: 0,
        isConnection: false
      };
    }
    const profile = raw.profile || raw;
    const verification = raw.verifications?.[0] || raw.verification || raw.user?.verifications?.[0];

    const canHelp = profile.canHelpWithJson
      ? (typeof profile.canHelpWithJson === 'string' ? JSON.parse(profile.canHelpWithJson) : profile.canHelpWithJson)
      : profile.canHelpWith || [];
    const lookingFor = profile.lookingForJson
      ? (typeof profile.lookingForJson === 'string' ? JSON.parse(profile.lookingForJson) : profile.lookingForJson)
      : profile.lookingFor || [];
    const skills = profile.skillsJson
      ? (typeof profile.skillsJson === 'string' ? JSON.parse(profile.skillsJson) : profile.skillsJson)
      : profile.skills || [];

    const rawLevel = verification?.level?.toLowerCase() || profile.verificationLevel?.toLowerCase() || 'unverified';
    const level: VerificationLevel =
      rawLevel === 'verified_founder'
        ? 'verified_founder'
        : rawLevel === 'verified_investor'
          ? 'verified_investor'
          : rawLevel === 'verified_executive'
            ? 'verified_executive'
            : rawLevel === 'verified_professional'
              ? 'verified_professional'
              : rawLevel === 'verified_member'
                ? 'verified_member'
                : rawLevel === 'pending'
                  ? 'pending'
                  : 'unverified';

    return {
      id: raw.userId || profile.userId || raw.id || 'usr_unknown',
      name: profile.name || 'Executive Member',
      initials: profile.initials || (profile.name ? profile.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'EM'),
      avatar: profile.avatar || '',
      role: profile.role || 'Founder / Executive',
      company: profile.company || 'Enterprise',
      companyStage: profile.companyStage === 'SERIES_A' ? 'Series A' : profile.companyStage || 'Bootstrapped',
      industry: profile.industry || 'Technology',
      location: profile.location || 'Remote',
      verificationLevel: level,
      verificationPillars: {
        identityVerified: Boolean(verification?.identityVerified),
        corporateDomainVerified: Boolean(verification?.corporateDomainVerified),
        entityVerified: Boolean(verification?.entityVerified),
        founderStatusVerified: Boolean(verification?.founderStatusVerified)
      },
      bio: profile.bio || '',
      yearsBuilding: profile.yearsBuilding ?? null,
      founderStage: profile.founderStage || 'EARLY_REVENUE',
      canHelpWith: canHelp,
      lookingFor: lookingFor,
      experience: profile.experience || [
        { title: profile.role || 'Founder', company: profile.company || 'Company', period: '2023 - Present', isVerifiedRole: true }
      ],
      skills: skills.length ? skills : ['Strategy', 'Leadership'],
      metrics: {
        arr: profile.arrValue ? { value: profile.arrValue, isSelfReported: Boolean(profile.arrIsSelfReported), verificationSource: profile.arrSource } : undefined,
        teamSize: profile.teamSizeValue ? { value: profile.teamSizeValue, isSelfReported: Boolean(profile.teamSizeIsSelfReported), verificationSource: profile.teamSizeSource } : undefined,
        fundingRaised: profile.fundingValue ? { value: profile.fundingValue, isSelfReported: Boolean(profile.fundingIsSelfReported), verificationSource: profile.fundingSource } : undefined,
      },
      mutualConnectionsCount: profile.mutualConnectionsCount || 0,
      relationshipNotes: profile.relationshipNotes || undefined,
      isConnection: profile.isConnection ?? true
    };
  }

  public static transformRequest(raw: any): BusinessRequest {
    const author = raw.author ? ApiClient.transformProfile(raw.author) : {
      id: raw.authorId || 'usr_unknown',
      name: 'Executive Founder',
      initials: 'EF',
      avatar: '',
      role: 'Founder',
      company: 'Stealth',
      companyStage: 'Series A',
      industry: raw.industry || 'Tech',
      location: raw.location || 'Remote',
      verificationLevel: 'verified_founder' as const,
      verificationPillars: { identityVerified: true, corporateDomainVerified: true, entityVerified: true, founderStatusVerified: true },
      bio: '',
      canHelpWith: [],
      lookingFor: [],
      experience: [],
      skills: [],
      mutualConnectionsCount: 0
    };

    let status = 'open';
    if (raw.status?.toLowerCase() === 'fulfilled' || raw.status?.toLowerCase() === 'resolved') {
      status = 'resolved';
    } else if (raw.status?.toLowerCase() === 'connected' || raw.status?.toLowerCase() === 'responses') {
      status = 'responses';
    }

    return {
      id: raw.id,
      authorId: raw.authorId,
      author,
      needCategory: raw.needCategory === 'EXPANSION' ? 'Market Expansion' : raw.needCategory === 'HIRING' ? 'Hiring & Talent' : raw.needCategory === 'FUNDRAISING' ? 'Fundraising & Advisory' : raw.needCategory || 'General Intro',
      title: raw.title,
      needDescription: raw.needDescription,
      context: raw.context || '',
      industry: raw.industry || 'Cross-Industry',
      location: raw.location || 'Remote',
      desiredConnection: raw.desiredConnection || '',
      visibility: raw.visibility,
      status: status as any,
      createdAt: raw.createdAt ? new Date(raw.createdAt).toLocaleDateString() : 'Recently',
      responsesCount: raw.responsesCount || 0,
      urgent: raw.urgency === 'URGENT'
    };
  }

  public static transformIntro(raw: any): Introduction {
    return {
      id: raw.id,
      fromUser: ApiClient.transformProfile(raw.fromUser),
      toUser: ApiClient.transformProfile(raw.toUser),
      facilitator: raw.facilitator ? ApiClient.transformProfile(raw.facilitator) : ApiClient.transformProfile(raw.fromUser),
      suggestedUser: raw.suggestedUser ? ApiClient.transformProfile(raw.suggestedUser) : undefined,
      reason: raw.reason,
      status: raw.status as any,
      createdAt: raw.createdAt ? new Date(raw.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'
    };
  }

  public static transformConversation(raw: any): Conversation {
    const participant = raw.participant ? ApiClient.transformProfile(raw.participant) : ApiClient.transformProfile(raw.participantA || raw.participantB);
    return {
      id: raw.id,
      participant,
      lastMessage: raw.lastMessage || 'Conversation initiated',
      lastMessageTime: raw.lastMessageTime ? new Date(raw.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
      unreadCount: raw.unreadCount || 0,
      introContext: raw.topic ? {
        facilitatedBy: raw.facilitatedBy || 'Warm Introduction',
        topic: raw.topic
      } : undefined,
      messages: raw.messages?.map((m: any) => ({
        id: m.id,
        senderId: m.senderId,
        text: m.text,
        timestamp: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'
      })) || []
    };
  }

  public static transformPost(raw: any): Post {
    return {
      id: raw.id,
      authorId: raw.authorId,
      author: ApiClient.transformProfile(raw.author),
      type: raw.type || 'SHORT_POST',
      title: raw.title,
      body: raw.body,
      linkUrl: raw.linkUrl,
      visibility: raw.visibility,
      communityId: raw.communityId,
      community: raw.community,
      recipientId: raw.recipientId,
      recipient: raw.recipient ? ApiClient.transformProfile(raw.recipient) : null,
      createdAt: raw.createdAt ? new Date(raw.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
      usefulCount: raw.usefulCount || raw.usefulReactions?.length || 0,
      isUsefulByMe: Boolean(raw.isUsefulByMe),
      isSavedByMe: Boolean(raw.isSavedByMe),
      commentsCount: raw.commentsCount || raw.comments?.length || 0,
      comments: raw.comments?.map((c: any) => ({
        id: c.id,
        postId: c.postId,
        authorId: c.authorId,
        author: ApiClient.transformProfile(c.author),
        parentCommentId: c.parentCommentId,
        body: c.body,
        createdAt: new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }))
    };
  }

  public static transformInvestor(raw: any): InvestorProfile {
    const user = ApiClient.transformProfile(raw.user || raw);
    const stageFocus = typeof raw.stageFocusJson === 'string' ? JSON.parse(raw.stageFocusJson) : raw.stageFocus || [];
    const sectors = typeof raw.sectorsJson === 'string' ? JSON.parse(raw.sectorsJson) : raw.sectors || [];
    const geographies = typeof raw.geographiesJson === 'string' ? JSON.parse(raw.geographiesJson) : raw.geographies || [];

    return {
      id: raw.id,
      userId: raw.userId || user.id,
      user,
      investorType: raw.investorType || 'VC',
      firmName: raw.firmName,
      stageFocus,
      chequeRangeMin: raw.chequeRangeMin,
      chequeRangeMax: raw.chequeRangeMax,
      sectors,
      geographies,
      portfolioHighlights: raw.portfolioHighlights,
      currentFocus: raw.currentFocus,
      introPreferences: raw.introPreferences || 'WARM_INTRO_ONLY',
      isVerifiedInvestor: Boolean(raw.isVerifiedInvestor)
    };
  }

  public static transformResolution(raw: any): ResolutionRecord {
    return {
      id: raw.id,
      requestId: raw.requestId,
      askerId: raw.askerId,
      asker: ApiClient.transformProfile(raw.asker),
      helperId: raw.helperId,
      helper: ApiClient.transformProfile(raw.helper),
      introductionId: raw.introductionId,
      outcomeType: raw.outcomeType,
      outcomeCategory: raw.outcomeCategory,
      helpType: raw.helpType,
      askerAssessment: raw.askerAssessment,
      helperConfirmation: Boolean(raw.helperConfirmation),
      summary: raw.summary,
      visibility: raw.visibility,
      status: raw.status,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt
    };
  }
}
