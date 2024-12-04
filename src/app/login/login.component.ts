import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../service/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  constructor(private authService:AuthService){

  }
 dados(dados: NgForm) {
    const { email, password, destination } = dados.form.value;

    if (email && password && destination) {
      console.log(`Login solicitado: email=${email}, destino=${destination}`);
      this.authService.login(email, password, destination);
    } else {
      alert('Por favor, preencha todos os campos!');
    }
  }
}
