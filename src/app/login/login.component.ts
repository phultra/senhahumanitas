import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../service/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  constructor(private authService: AuthService) {}

  // Lida com o envio do formulário de login
  dados(dados: NgForm) {
    const { email, password } = dados.form.value;

    if (email && password) {
      console.log(`Login solicitado: email=${email}`);
      this.authService.login(email, password); // Chama o login sem o destino, que será gerenciado no AuthService
    } else {
      alert('Por favor, preencha todos os campos!');
    }
  }
}
