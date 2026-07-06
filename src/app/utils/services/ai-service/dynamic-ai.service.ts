import { inject, Injectable } from "@angular/core";
import { AIServiceInterface } from "./ai.service.interface";
import { Store } from "@ngrx/store";
import { selectProfileUseDefaultApi } from "@app/utils/store/profile/profile.selector";
import { DefaultAiService } from "./default-ai/default-ai.service";
import { AIService } from "./cloud-ai";
import { Observable } from "rxjs";

@Injectable({ providedIn: 'root' })
export class DynamicAiService implements AIServiceInterface {

    private store = inject(Store);
    private defaultAi = inject(DefaultAiService);
    private cloudAi = inject(AIService);

    private useDefaultApi = this.store.selectSignal(selectProfileUseDefaultApi);

    generate(prompt: string): Observable<any> {
        return this.useDefaultApi()
            ? this.defaultAi.generate(prompt)
            : this.cloudAi.generate(prompt);
    }
}