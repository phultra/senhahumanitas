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
  
  
  
  
   usuariosSalvos: { email: string; setor: string; funcao: string; nome: string }[] = []; // Lista de usuários
   

   mostrarUsuarios: boolean = false;
   mostrarRelatorio: boolean = false;
   mostrarSigla: boolean = false;

   setoresSalvos: { nomeSetor: string; sigla: string; status: string }[] = []; // Lista de setores
mostrarSetores: boolean = false; // Controla a exibição da tabela de setores
  
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
      this.exibirSetores();
     // this.carregarSetores();
      //this.inicializarFormularios();
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
            setor: user.setor || 'Não informado',
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

    async exibirSetores() {
      try {
        const setoresRef = ref(this.db, 'avelar/setor'); 
        const snapshot = await get(setoresRef);
    
        if (snapshot.exists()) {
          const dadosSetores = snapshot.val();
          this.setoresSalvos = Object.values(dadosSetores).map((setor: any) => ({
            nomeSetor: setor.setor,
            sigla: setor.sigla,
            status: setor.status
          }));
    
          this.mostrarSetores = true; // Exibe os setores
        } else {
          alert('Nenhum setor encontrado.');
        }
      } catch (error) {
        console.error('Erro ao recuperar os setores:', error);
        alert('Erro ao recuperar os setores.');
      }
    }

    async alterarSetor(usuario: any) {
      
      try {
        // Verifica se o usuário tem a função "Operador" e se o setor dele é alterável
        if (usuario.funcao !== 'operador') {
          alert('Somente usuários com a função "Operador" podem ter seu setor alterado.');
          this.exibirUsuarios();
          return;
          
        }
        
        const usuarioRef = ref(this.db, `usuarios/${usuario.uid}`);
        
        // Usando 'update()' para atualizar apenas o setor, sem sobrescrever os outros dados
        await update(usuarioRef, {
          setor: usuario.setor  // Atualiza apenas o setor
          
        });
    
        alert('Setor alterado com sucesso!');
        this.exibirUsuarios();
      } catch (error) {
        console.error('Erro ao atualizar o setor:', error);
        alert('Erro ao atualizar o setor. Tente novamente.');
      }
    }
    

    async excluirSetor(setorNome: string) {
      const confirmacao = window.confirm('Tem certeza que deseja excluir este Setor? Esta ação não pode ser desfeita.');
     if(confirmacao) try {
        // Referência ao caminho dos setores
        const setoresRef = ref(this.db, `avelar/setor`);
    
        // Obtém todos os setores salvos
        const snapshot = await get(setoresRef);
        if (snapshot.exists()) {
          const setoresExistentes = snapshot.val() as Record<string, any>;
    
          // Encontra o setor pelo nome
          const setorParaExcluir = Object.keys(setoresExistentes).find(key => 
            setoresExistentes[key].setor.toLowerCase() === setorNome.toLowerCase()
          );
    
          if (setorParaExcluir) {
            // Remove o setor encontrado
            await remove(ref(this.db, `avelar/setor/${setorParaExcluir}`));
            this.exibirSetores();
    
            alert('Setor excluído com sucesso!');
          } else {
            alert('Setor não encontrado.');
          }
        } else {
          alert('Nenhum setor encontrado.');
        }
      } catch (error) {
        console.error('Erro ao excluir o setor:', error);
        alert('Erro ao excluir o setor. Tente novamente.');
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
    
    
 
async apagarBanco(): Promise<void> {
  try {
    const avelarRef = ref(this.db, `avelar/`); // Referência ao nó 'avelar'
    const snapshot = await get(avelarRef);

    if (snapshot.exists()) {
      const dados = snapshot.val();

      // Filtra os nós para excluir todos, exceto 'setor'
      const chavesParaApagar = Object.keys(dados).filter((chave) => chave !== 'setor');

      // Apaga cada nó individualmente
      for (const chave of chavesParaApagar) {
        const caminho = `avelar/${chave}`;
        await remove(ref(this.db, caminho));
        console.log(`Nó '${chave}' apagado com sucesso.`);
      }

      this.relatorio = '<p>Banco de dados apagado com sucesso, exceto o nó "setor".</p>';
    } else {
      console.log('Nenhum dado encontrado em "avelar".');
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
    const avelarRef = ref(this.db, 'avelar');  // Referência ao nó 'avelar'
    const snapshot = await get(avelarRef);

    if (snapshot.exists()) {
      const dados = snapshot.val();

      // Lista de chaves a serem apagadas
      const chavesParaApagar = ['senhagerada', 'senhacontador'];

      // Apaga cada nó especificado
      for (const chave of chavesParaApagar) {
        const caminho = `avelar/${chave}`;
        await remove(ref(this.db, caminho));
        console.log(`Nó '${caminho}' apagado com sucesso.`);
      }

      this.relatorio = '<p>Os nós "senhagerada" e "senhacontador" foram apagados com sucesso.</p>';
    } else {
      console.log('Nenhum dado encontrado em "avelar".');
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
