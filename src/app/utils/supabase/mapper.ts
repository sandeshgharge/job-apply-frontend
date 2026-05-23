import { ProfileInfo } from "../entities/user";
import { ProfileDTO } from "./dto";

export function mapProfileDtoToProfile(
  dto: ProfileDTO
): ProfileInfo {

  return {
    id: dto.id,
    firstName: dto.first_name,
    lastName: dto.last_name,
    email: dto.email,
    location: dto.location,
    apiUrl: dto.agent_api_url,
    apiKey: dto.agent_api_key,
    model: dto.model_name
  };
}

export function mapProfileToProfileDto(
  profile: ProfileInfo
): ProfileDTO {
  return {
    id: profile.id,
    first_name: profile.firstName,
    last_name: profile.lastName,
    location: profile.location,
    email: profile.email,
    agent_api_url: profile.apiUrl,
    agent_api_key: profile.apiKey,
    model_name: profile.model
  };
}