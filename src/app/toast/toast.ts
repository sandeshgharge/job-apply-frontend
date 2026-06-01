import { Component, inject } from '@angular/core';
import { ToastService } from '@app/utils/services/toast.service';

@Component({
  selector: 'app-toast',
  imports: [],
  templateUrl: './toast.html',
  styleUrl: './toast.scss'
})
export class ToastComponent {
  toastService = inject(ToastService);
}
