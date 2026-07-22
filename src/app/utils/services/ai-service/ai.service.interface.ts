import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

export interface AIPrompt {
  system?: string;
  user: string;
}

export abstract class AIServiceInterface {
  abstract generate(prompt: AIPrompt): Observable<any>;
  abstract extractJobData(jobDescription: string): Observable<any>;

  /**
   * Sanitizes raw LLM text output to extract a valid JSON string.
   *
   * Models often wrap JSON in markdown code fences, prose preambles, or
   * postambles. This helper trims everything outside the outermost `{…}`
   * (for objects) or `[…]` (for arrays), making JSON.parse() reliable.
   *
   * @param text  Raw text returned by the AI model.
   * @returns     The trimmed JSON substring, or the original text if no
   *              valid JSON boundary is found.
   */
  static extractJson(text: string): string {
    if (!text) return text;

    // Detect whether the root value is an object or array
    const firstCurly  = text.indexOf('{');
    const firstSquare = text.indexOf('[');

    let start: number;
    let endChar: string;

    if (firstCurly === -1 && firstSquare === -1) {
      // No JSON boundary found — return as-is
      return text;
    } else if (firstSquare === -1 || (firstCurly !== -1 && firstCurly < firstSquare)) {
      start   = firstCurly;
      endChar = '}';
    } else {
      start   = firstSquare;
      endChar = ']';
    }

    const end = text.lastIndexOf(endChar);
    if (end === -1 || end < start) return text;

    return text.substring(start, end + 1);
  }
}