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

  async avaliarAtendimento(): Promise<void> {
    if (this.nota !== null && this.duracaoAtendimento) {
      try {
        const dia = this.dia; // Data do atendimento
        const finalAtendimento = Date.now().toString(); // Atribui o valor de time a finalAtendimento
  
        // Caminho no Realtime Database para o objeto de finalAtendimento
        const senhaRef = ref(this.db, `avelar/senhafinalizada/${dia}/${finalAtendimento}`);
  
        // Verifica se o nó já existe
        const snapshot = await get(senhaRef);
  
        if (!snapshot.exists()) {
          // Se não existir, cria o nó com os dados de nota e duracaoAtendimento
          await set(senhaRef, {
            nota: this.nota,
            duracaoAtendimento: this.duracaoAtendimento,
            finalatendimento: finalAtendimento, // Garante que o ID de finalAtendimento também seja armazenado
          });
          console.log('Novo nó criado com os dados de avaliação.');
        } else {
          // Se já existir, atualiza os campos de nota e duracaoAtendimento
          await update(senhaRef, {
            nota: this.nota,
            duracaoAtendimento: this.duracaoAtendimento,
          });
          console.log('Dados atualizados com sucesso no nó existente.');
        }
  
        alert('Avaliação salva com sucesso!');
        this.resetForm(); // Limpa o formulário
        this.router.navigate(['/operador']); // Redireciona para a tela do operador
      } catch (error) {
        console.error('Erro ao salvar avaliação:', error);
        alert('Ocorreu um erro ao salvar a avaliação.');
      }
    } else {
      alert('Por favor, preencha todos os campos!');
    }
  }
  

  
  resetForm(): void {
    this.nota = null;  // Reseta a nota
    
  }
  

 
}
