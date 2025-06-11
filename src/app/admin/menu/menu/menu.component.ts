import { Component, inject } from '@angular/core';
import { AdminService } from '../../../service/admin/admin.service';
import { AuthService } from '../../../service/auth/auth.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {

   authService = inject(AuthService);

  sair() {
    this.authService.logout();
  }

}
