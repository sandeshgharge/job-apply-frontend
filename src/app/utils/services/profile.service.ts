import { inject, Injectable } from "@angular/core";
import { supabase } from "../supabase/client";
import { Store } from "@ngrx/store";
import { HttpClient } from "@angular/common/http";
import { selectCurrentUser } from "../store/auth/auth.selectors";
import { catchError, from, map } from "rxjs";
import { mapProfileDtoToProfile } from "../supabase/mapper";
import { ProfileInfo } from "../entities/user";
import { ProfileDTO } from "../supabase/dto";

@Injectable({ providedIn: 'root' })
export class ProfileService {

    constructor(private http: HttpClient) { }
    private store = inject(Store);

    userId = this.store.selectSignal(selectCurrentUser);

    getProfile() {
        return supabase
            .from('user_details')
            .select()
            .eq('id', this.userId()?.id)
            .single()
    }

    updateProfile(profileInfo: ProfileDTO) {
        return supabase
            .from('user_details')
            .update({
                ...profileInfo
            })
            .eq('id', this.userId()?.id)
    }
}