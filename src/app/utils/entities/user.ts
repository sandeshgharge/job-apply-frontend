export interface User {
  id: string;
  email: string;
  name: string;
}

export interface ProfileInfo {
  id: string;
  firstName: string;
  lastName: string;
  location: string;
  email: string;
  agentApiUrl: string;
  agentApiKey: string;
  modelName: string;
  profileImageUrl?: string;
  signatureImageUrl?: string;
}