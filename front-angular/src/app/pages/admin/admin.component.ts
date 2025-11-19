import { Component } from '@angular/core';
import { SharedModule } from '../../shared';
import { HeaderComponent } from "../../components/header/header.component";

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [SharedModule, HeaderComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent {

}
