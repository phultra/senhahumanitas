import { inject, Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, onAuthStateChanged, signOut, getAuth, User } from '@angular/fire/auth';
import { get, getDatabase, ref } from '@angular/fire/database';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/internal/Observable';

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

  async login(email: string, senha: string) {
    const auth = getAuth();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      // Buscar a função do usuário no banco de dados
      const db = getDatabase();
      const userRef = ref(db, 'usuarios/' + user.uid);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const userData = snapshot.val();
        localStorage.setItem('userRole', userData.funcao); // Salva a função no localStorage
        this.redirecionarUsuario(userData.funcao);
      } else {
        alert('Usuário não encontrado.');
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      alert('Erro ao fazer login. Verifique suas credenciais.');
    }
  }

  redirecionarUsuario(funcao: string) {
    if (funcao === 'admin') {
      this.router.navigate(['/admin']);
    } else if (funcao === 'ChamaSenha') {
      this.router.navigate(['/inicio']);
    } else if (funcao === 'Painel') {
      this.router.navigate(['/painel']);
    } else if (funcao === 'operador') {
      this.router.navigate(['/operador']);
    } else {
      // Caso a função não corresponda a nenhum dos casos acima
      console.log('Função não reconhecida, redirecionando para a página inicial');
      this.router.navigate(['/inicio']);
    }
  }

  logout() {
    const auth = getAuth();
    auth.signOut();
    localStorage.removeItem('userRole');
    this.router.navigate(['/login']);
  }

  getUser(): Observable<User | null> {
    return new Observable(subscriber => {
      onAuthStateChanged(this.auth, user => {
        subscriber.next(user);
      });
    });
  }

  isUserAuthenticated(): boolean {
    return this.isAuthenticated;
  }
}


