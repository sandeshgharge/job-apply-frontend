export interface User {
  id: string;
  email: string;
  name: string;
  location?: string;
}

export interface ProfileInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  apiUrl: string;
  apiKey: string;
}