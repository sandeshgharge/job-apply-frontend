import { inject, Injectable } from "@angular/core";
import { AIServiceInterface, AIPrompt } from "./ai.service.interface";
import { Store } from "@ngrx/store";
import { selectProfileUseDefaultApi } from "@app/utils/store/profile/profile.selector";
import { DefaultAiService } from "./default-ai/default-ai.service";
import { CloudAIService } from "./cloud-ai";
import { Observable } from "rxjs";

@Injectable({ providedIn: 'root' })
export class DynamicAiService implements AIServiceInterface {

    private store = inject(Store);
    private defaultAi = inject(DefaultAiService);
    private cloudAi = inject(CloudAIService);

    private useDefaultApi = this.store.selectSignal(selectProfileUseDefaultApi);

    generate(prompt: AIPrompt): Observable<any> {
        return this.useDefaultApi()
            ? this.defaultAi.generate(prompt)
            : this.cloudAi.generate(prompt);
    }

    extractJobData(jobDescription: string): Observable<any> {
        return this.useDefaultApi()
            ? this.defaultAi.extractJobData(jobDescription)
            : this.cloudAi.extractJobData(jobDescription);
    }
}