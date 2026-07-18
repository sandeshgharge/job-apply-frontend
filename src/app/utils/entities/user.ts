import { Role } from "../services/auth.service";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface ApiAgentInfo {
  id?: string;
  userId?: string;
  name: string;
  agentApiUrl?: string;
  agentApiKey?: string;
  modelName?: string;
  isPublic: boolean;
}

export interface ProfileInfo {
  id: string;
  firstName: string;
  lastName: string;
  location: string;
  email: string;
  selectedAgentId: string | null;
  userApiAgents: ApiAgentInfo[];
  profileImageUrl?: string;
  signatureImageUrl?: string;
  role: Role;
  useDefaultApi: boolean;
}