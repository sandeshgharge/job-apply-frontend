import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({ providedIn: 'root' })
export abstract class AIServiceInterface {
  abstract generate(prompt: string): Observable<any>;
}