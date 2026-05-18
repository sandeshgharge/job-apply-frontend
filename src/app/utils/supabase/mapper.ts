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
    apiUrl: dto.agent_api_url,
    apiKey: dto.agent_api_key
  };
}

export function mapProfileToProfileDto(
  profile: ProfileInfo
): ProfileDTO {
  return {
    id: profile.id,
    first_name: profile.firstName,
    last_name: profile.lastName,
    email: profile.email,
    agent_api_url: profile.apiUrl,
    agent_api_key: profile.apiKey
  };
}