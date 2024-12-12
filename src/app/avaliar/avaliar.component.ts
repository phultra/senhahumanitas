import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'; // Para acessar queryParams
import { Database, getDatabase, ref, set, get, update } from '@angular/fire/database';
import { inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avaliar',
  standalone: true,
  templateUrl: './avaliar.component.html',
  styleUrls: ['./avaliar.component.scss'],
  imports: [FormsModule, CommonModule]
})
export class AvaliarComponent implements OnInit {
  nomeOperador: string = '';
  duracaoAtendimento: string = '';
  nota: number | null = null;
  notas: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  senha: string = '';
  guiche: string = '';
  senhaId: string = '';  // Para armazenar o ID da senha
  dia: string = '';      // Para armazenar o dia atual
  finalAtendimento: string = '';  // Para armazenar o valor de finalAtendimento

  private db: Database = inject(Database);

  constructor(private route: ActivatedRoute, 
              private router: Router) {}

  ngOnInit(): void {
    // Captura os parâmetros enviados pela rota
    this.route.queryParams.subscribe(params => {
      this.nomeOperador = params['operador'] || '';
      this.duracaoAtendimento = params['duracao'] || '0 minutos';
      this.senha = params['senha'] || '';
      this.guiche = params['guiche'] || '';
      
      this.finalAtendimento = params['finalatendimento'] || '';  // Captura o finalAtendimento
      const dat = new Date();
      this.dia = dat.getDate().toString();   // Obtém o dia atual para o caminho
    });
  }

  // Função para salvar a avaliação e atualizar a senha no Firebase
  async avaliarAtendimento(): Promise<void> {
    if (this.nota !== null) {
      // Primeiro, pega os dados existentes para garantir que os outros dados não sejam sobrescritos
      const senhaRef = ref(this.db, `avelar/senhafinalizada/${this.dia}/${this.finalAtendimento}`);
      const snapshot = await get(senhaRef);  // Obter os dados atuais

      if (snapshot.exists()) {
        const dadosExistentes = snapshot.val();  // Armazenar os dados existentes

        // Agora criamos um novo objeto com os dados existentes + os novos dados
        const dadosAtualizados = {
          ...dadosExistentes,  // Dados que já existem no nó
          nota: this.nota,     // Atualiza ou insere a nota
          duracaoAtendimento: this.duracaoAtendimento // Atualiza ou insere a duração do atendimento
        };

        // Agora, usamos o método `set()` para atualizar os dados no caminho correto
        await set(senhaRef, dadosAtualizados);

        alert('Avaliação salva com sucesso!');
        this.resetForm();
        this.router.navigate(['/operador']);  // Redireciona para a tela do operador
      } else {
        console.error('Dados não encontrados');
        alert('Erro ao acessar os dados existentes');
      }
    } else {
      alert('Por favor, preencha todos os campos!');
    }
  }

  resetForm(): void {
    this.nota = null;  // Reseta a nota
    this.duracaoAtendimento = '';  // Reseta a duração do atendimento
  }
}
