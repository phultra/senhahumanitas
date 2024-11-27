import { Component } from '@angular/core';
import { Database, getDatabase, ref, set } from '@angular/fire/database';
import { inject } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Importando o FormsModule

@Component({
  selector: 'app-avaliar',
  standalone: true,  // Definindo o componente como standalone
  templateUrl: './avaliar.component.html',
  styleUrls: ['./avaliar.component.scss'],
  imports: [FormsModule] // Importando o FormsModule diretamente no componente
})
export class AvaliarComponent {
  nomeOperador: string = '';
  duracaoAtendimento: number | null = null;
  nota: number | null = null;
  notas: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // Botões de 0 a 10
  
  private db: Database = inject(Database); // Injetando o serviço de banco de dados

  // Método para salvar a avaliação
  avaliarAtendimento(): void {
    if (this.nomeOperador && this.duracaoAtendimento && this.nota !== null) {
      const avaliacao = {
        nomeOperador: this.nomeOperador,
        duracaoAtendimento: this.duracaoAtendimento,
        nota: this.nota
      };

      // Definindo o caminho onde os dados serão salvos
      const avaliacaoRef = ref(getDatabase(), 'avaliacoes/' + new Date().toISOString());

      // Adicionando a avaliação no Firebase
      set(avaliacaoRef, avaliacao)
        .then(() => {
          alert('Avaliação salva com sucesso!');
          this.resetForm(); // Reseta o formulário após salvar
        })
        .catch(error => {
          console.error('Erro ao salvar avaliação: ', error);
          alert('Ocorreu um erro ao salvar a avaliação');
        });
    } else {
      alert('Por favor, preencha todos os campos!');
    }
  }

  // Método para resetar o formulário
  resetForm(): void {
    this.nomeOperador = '';
    this.duracaoAtendimento = null;
    this.nota = null;
  }
}
