export interface ProfileDTO {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    location: string;
    agent_api_key: string;
    agent_api_url: string;
    created_at?: string;
    model_name: string
}