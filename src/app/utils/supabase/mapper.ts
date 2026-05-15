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