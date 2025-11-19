import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-loading',
    standalone: true,
    imports: [CommonModule, MatProgressSpinnerModule],
    template: `
    <div class="loading-container" *ngIf="loading">
      <mat-spinner [diameter]="diameter"></mat-spinner>
      <p *ngIf="message">{{ message }}</p>
    </div>
  `,
    styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      
      p {
        margin-top: 1rem;
        color: #666;
        font-size: 0.9rem;
      }
    }
  `]
})
export class LoadingComponent {
    @Input() loading = true;
    @Input() message?: string;
    @Input() diameter = 50;
}
