import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'catClass', standalone: true })
export class CatClassPipe implements PipeTransform {
  transform(category: string): string {
    return category.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }
}
