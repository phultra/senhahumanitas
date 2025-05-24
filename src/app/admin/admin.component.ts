import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { get, ref, remove, update } from 'firebase/database';
import { Database } from '@angular/fire/database';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthService } from '../service/auth/auth.service';

import { MenuComponent } from "./menu/menu/menu.component";



@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule, MenuComponent]
})
export class AdminComponent implements OnInit {

  formularioUsuario!: FormGroup;
  formulario!: FormGroup;
  relatorio: string = '';
  
  
  
  
   usuariosSalvos: { email: string;  funcao: string; nome: string }[] = []; // Lista de usuários
   

   mostrarUsuarios: boolean = false;
   mostrarRelatorio: boolean = false;
   mostrarSigla: boolean = false;

  senhasChamada: any[] = [];
mostrarSenhasChamada: boolean = false;
  
  // Dados armazenados para o relatório
 // dadosArray: RelatorioItem[] = [];
  
  constructor(
    private formBuilder: FormBuilder,
    private db: Database,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Verifica se o usuário está autenticado ao carregar o componente
    if (!this.authService.isUserAuthenticated()) {
      this.router.navigate(['/login']);  // Redireciona para o login se não estiver autenticado
    } else {
      this.exibirUsuarios();
      this.exibirSenhasChamada();
    
      
    }
  }






    async exibirUsuarios() {
      try {
        const usuariosRef = ref(this.db, 'usuarios');
        const snapshot = await get(usuariosRef);
    
        if (snapshot.exists()) {
          const dadosUsuarios = snapshot.val();
          this.usuariosSalvos = Object.values(dadosUsuarios).map((user: any) => ({
            nome: user.nome,
            email: user.email,
            
            funcao: user.funcao,
            uid: user.uid
          }));
    
          this.mostrarUsuarios = true; // Exibe os usuários
        } else {
          alert('Nenhum usuário encontrado.');
        }
      } catch (error) {
        console.error('Erro ao recuperar os usuários:', error);
        alert('Erro ao recuperar os usuários.');
      }
    }

 

  
    

   

    async excluirUsuario(usuario: any) {
      const confirmacao = window.confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.');

      if (confirmacao) try {
        const usuarioRef = ref(this.db, `usuarios/${usuario.uid}`);
    
        // Excluindo o usuário completo
        await remove(usuarioRef); // 'remove()' exclui o nó inteiro no Firebase
        this.exibirUsuarios();
    
        alert('Usuário excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir o usuário:', error);
        alert('Erro ao excluir o usuário. Tente novamente.');
      }
    }
    
    async exibirSenhasChamada() {
  try {
    const chamadaRef = ref(this.db, 'humanitas/senhachamada');
    const snapshot = await get(chamadaRef);

   if (snapshot.exists()) {
      const dadosSenhas = snapshot.val();
      // Pegue a chave (id) de cada senha
      this.senhasChamada = Object.entries(dadosSenhas).map(([key, item]: [string, any]) => ({
        key, // chave única do Firebase
        senha: item.senha || '',
        operadorOuMedico: item.medico && item.medico.trim() !== '' ? item.medico : item.operador || '',
        setor: item.setor || '',
        data: item.data || '',
      }));
      this.mostrarSenhasChamada = true;
    } else {
      this.senhasChamada = [];
      this.mostrarSenhasChamada = false;
      alert('Nenhuma senha encontrada em senhachamada.');
    }
  } catch (error) {
    console.error('Erro ao recuperar as senhas:', error);
    alert('Erro ao recuperar as senhas.');
  }
}
    
async apagarSenhaChamada(item: any) {
  try {
    
    const chamadaRef = ref(this.db, `humanitas/senhachamada/${item.key}`);
    await remove(chamadaRef);
    this.exibirSenhasChamada();
    alert('Senha apagada com sucesso!');
  } catch (error) {
    console.error('Erro ao apagar a senha:', error);
    alert('Erro ao apagar a senha.');
  }
} 

async apagarTodasSenhasChamada() {
  const confirmar = window.confirm('Tem certeza que deseja apagar TODAS as senhas em chamada? Esta ação não pode ser desfeita.');
  if (!confirmar) return;
  try {
    const chamadaRef = ref(this.db, 'humanitas/senhachamada');
    await remove(chamadaRef);
    this.exibirSenhasChamada();
    alert('Todas as senhas em chamada foram apagadas!');
  } catch (error) {
    console.error('Erro ao apagar todas as senhas:', error);
    alert('Erro ao apagar todas as senhas.');
  }
}

async apagarBanco(): Promise<void> {
  try {
    const avelarRef = ref(this.db, `humanitas/`); // Referência ao nó 'humanitas'
    const snapshot = await get(avelarRef);

    if (snapshot.exists()) {
      const dados = snapshot.val();

      // Filtra os nós para excluir todos, exceto 'setor'
      const chavesParaApagar = Object.keys(dados).filter((chave) => chave !== 'setor');

      // Apaga cada nó individualmente
      for (const chave of chavesParaApagar) {
        const caminho = `humanitas/${chave}`;
        await remove(ref(this.db, caminho));
        console.log(`Nó '${chave}' apagado com sucesso.`);
      }

      this.relatorio = '<p>Banco de dados apagado com sucesso, exceto o nó "setor".</p>';
    } else {
      console.log('Nenhum dado encontrado em "humanitas".');
      this.relatorio = '<p>Nenhum dado encontrado para apagar.</p>';
    }
  } catch (error) {
    console.error('Erro ao apagar o banco de dados:', error);
    this.relatorio = '<p>Erro ao apagar o banco de dados.</p>';
  }
}
async confirmarApagarBanco(): Promise<void> {
  const confirmar = window.confirm('Tem certeza que deseja apagar todos os dados do banco? Esta ação não pode ser desfeita.');
  if (confirmar) {
    await this.apagarBanco();
  }
}



async apagarNos(): Promise<void> {
  try {
    const avelarRef = ref(this.db, 'humanitas');  // Referência ao nó 'humanitas'
    const snapshot = await get(avelarRef);

    if (snapshot.exists()) {
      const dados = snapshot.val();

      // Lista de chaves a serem apagadas
      const chavesParaApagar = ['senhagerada', 'senhacontador'];

      // Apaga cada nó especificado
      for (const chave of chavesParaApagar) {
        const caminho = `humanitas/${chave}`;
        await remove(ref(this.db, caminho));
        console.log(`Nó '${caminho}' apagado com sucesso.`);
      }

      this.relatorio = '<p>Os nós "senhagerada" e "senhacontador" foram apagados com sucesso.</p>';
    } else {
      console.log('Nenhum dado encontrado em "humanitas".');
      this.relatorio = '<p>Nenhum dado encontrado para apagar.</p>';
    }
  } catch (error) {
    console.error('Erro ao apagar os nós:', error);
    this.relatorio = '<p>Erro ao apagar os nós.</p>';
  }
}
async confirmarApagarNos(): Promise<void> {
  const confirmar = window.confirm('Tem certeza que deseja apagar todos os dados do banco? Esta ação não pode ser desfeita.');
  if (confirmar) {
    await this.apagarNos();
  }
}

}
