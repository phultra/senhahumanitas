import { inject, Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from '@angular/fire/auth';
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
  login(email: string, password: string) {
    signInWithEmailAndPassword(this.auth, email, password).then(result => {
      console.log("Tudo deu certo, estou logado");
      console.log(result);
      this.router.navigate(['/admin']);
    })
    .catch(error => {
      console.error("Erro ao fazer login:", error);
    }); 
  }

  // Função para sair
  sair() {
    signOut(this.auth).then(() => {
      console.log("Saiu com sucesso");
      this.router.navigate(['/login']); // Redireciona para a página de login após logout
    }).catch(error => {
      console.error(error);
    });
  }

  

  // Função para verificar se o usuário está autenticado
  isUserAuthenticated(): boolean {
    return this.isAuthenticated;
  }
}

