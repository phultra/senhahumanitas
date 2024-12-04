import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, onAuthStateChanged,signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private isAuthenticated: boolean = false; // Adiciona propriedade para controle de autenticação

  constructor(private router: Router) {
    // Observa mudanças no estado da autenticação
    onAuthStateChanged(this.auth, (user) => {
      this.isAuthenticated = !!user; // Atualiza isAuthenticated quando o estado do usuário muda
    });
  }

  // Função para logar na aplicação
  login(email: string, password: string, destination: string) {
    signInWithEmailAndPassword(this.auth, email, password)
      .then(() => {
        console.log('Login bem-sucedido!');
        this.router.navigate([`/${destination}`]); // Redireciona para o destino selecionado
      })
      .catch((error) => {
        console.error('Erro ao fazer login:', error);
        alert('Erro ao fazer login: Verifique suas credenciais.');
      });
  }

  // Função para sair
  sair() {
    signOut(this.auth)
      .then(() => {
        console.log('Saiu com sucesso');
        this.router.navigate(['/login']); // Redireciona para a página de login após logout
      })
      .catch((error) => {
        console.error(error);
      });
  }

  // Função para verificar se o usuário está autenticado
  isUserAuthenticated(): boolean {
    return this.isAuthenticated;
  }
}