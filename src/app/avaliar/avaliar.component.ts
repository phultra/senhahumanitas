import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'; // Para acessar queryParams
import { Database, getDatabase, ref, set } from '@angular/fire/database';
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

  private db: Database = inject(Database);

  constructor(private route: ActivatedRoute, 
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Captura os parâmetros enviados pela rota
    this.route.queryParams.subscribe(params => {
      this.nomeOperador = params['operador'] || '';
      this.duracaoAtendimento = params['duracao'] || '0 minutos';
      this.senha = params['senha'] || '';
      this.guiche = params['guiche'] || ''
    });
  }

  avaliarAtendimento(): void {
    if (this.nomeOperador && this.duracaoAtendimento && this.nota !== null) {
      const avaliacao = {
        nomeOperador: this.nomeOperador,
        duracaoAtendimento: this.duracaoAtendimento,
        nota: this.nota,
        senha: this.senha,
        guiche: this.guiche
      };

      const avaliacaoRef = ref(getDatabase(), `avaliacoes/${this.guiche}/senha_${this.senha}`);

      set(avaliacaoRef, avaliacao)
        .then(() => {
          alert('Avaliação salva com sucesso!');
          this.resetForm();
          this.router.navigate(['/operador'])
        })
        .catch(error => {
          console.error('Erro ao salvar avaliação: ', error);
          alert('Ocorreu um erro ao salvar a avaliação');
        });
    } else {
      alert('Por favor, preencha todos os campos!');
    }
  }

  resetForm(): void {
    this.nota = null;
  }
}
