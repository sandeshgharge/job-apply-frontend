import { inject, Injectable } from "@angular/core";
import { AIServiceInterface } from "./ai.service.interface";
import { Store } from "@ngrx/store";
import { selectProfileUseDefaultApi } from "@app/utils/store/profile/profile.selector";
import { DefaultAiService } from "./default-ai/default-ai.service";
import { AIService } from "./cloud-ai";

@Injectable({ providedIn: 'root' })
export class DynamicAiService {

    private store = inject(Store);
    private defaultAiService = inject(AIServiceInterface) ;

    constructor() {
        const useDefaultAIService = this.store.selectSignal(selectProfileUseDefaultApi)();

        if(useDefaultAIService) 
            this.defaultAiService = new DefaultAiService();
        else
            this.defaultAiService = new AIService(); // Assuming AIs is another implementation of AIServiceInterface
    }

    getAIService(): AIServiceInterface {
        return this.defaultAiService;
    }
}