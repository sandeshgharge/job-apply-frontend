import { inject } from "@angular/core";
import { SupabaseClient } from "../supabase/client";

export class ProfileService {
    private supabase = inject(SupabaseClient).client;


    async getProfile() {
        const { data: { session } } = await this.supabase.auth.getSession();
        if (!session) {
            throw new Error('No active session found');
        }

        const { data: profile, error } = await this.supabase
            .from('user_details')
            .select()
            .eq('id', session.user.id)
            .single();
    }
}
