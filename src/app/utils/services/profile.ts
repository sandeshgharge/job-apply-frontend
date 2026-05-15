import { inject, Injectable } from "@angular/core";
import { supabase } from "../supabase/client";
import { Store } from "@ngrx/store";
import { HttpClient } from "@angular/common/http";
import { selectCurrentUser } from "../store/auth/auth.selectors";
import { catchError, from, map } from "rxjs";
import { mapProfileDtoToProfile } from "../supabase/mapper";

@Injectable({ providedIn: 'root' })
export class ProfileService {

    constructor(private http: HttpClient) { }
    private store = inject(Store);

    userId = this.store.selectSignal(selectCurrentUser);

    getProfile() {
        console.log('Fetching profile for user ID:', this.userId());
        return from(supabase
            .from('user_details')
            .select()
            .eq('id', this.userId()?.id)
            .single()
        ).pipe(
            map(response => {
                if (response.error) {
                    throw response.error;
                }

                return mapProfileDtoToProfile(
                    response.data
                );
            }),
            catchError(error => {
                console.error('Error fetching profile data:', error);
                throw error;
            })
        );
    }



}
