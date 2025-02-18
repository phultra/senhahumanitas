import { Component, OnInit } from '@angular/core';
import { get, ref } from 'firebase/database';
import { Database } from '@angular/fire/database';
import { CommonModule } from '@angular/common';
import { MenuComponent } from "../menu/menu/menu.component";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

interface RelatorioItem {
  operador: string;
  guiche: string;
  senha: string;
  duracaoAtendimento: number;
  nota: number;
  dataCompleta: Date;
  finalatendimento: number;
  horachamada: number;
  setor: string;
  preferencial: boolean;
}

@Component({
  selector: 'app-relatorio',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule, MenuComponent],
  templateUrl: './relatorio.component.html',
  styleUrl: './relatorio.component.scss'
})
export class RelatorioComponent {
  relatorio: string = '';
  mostrarRelatorio: boolean = false;
  dadosArray: RelatorioItem[] = [];

  filtroDia: string = '';
  filtroMes: string = '';
  filtroSemana: string = '';
  filtroOperador: string = '';
  filtroGuiche: string = '';
  filtroSenha: string = '';
  filtroNota: string = '';
  filtroSetor: string = '';
  filtroPreferencial: string = '';

  diasList: string[] = [];
  operadores: string[] = [];
  guichesList: string[] = [];
  senhasList: string[] = [];
  notasList: number[] = [];
  setoresList: string[] = [];
  preferencialList: string[] = [];

  constructor(private db: Database) {}

  ngOnInit() {
    this.exibirRelatorio();
  }

  fecharRelatorio() {
    this.mostrarRelatorio = false;
  }

  async exibirRelatorio() {
    try {
      this.mostrarRelatorio = true;
      const dadosArray: RelatorioItem[] = [];
      const senhaRef = ref(this.db, `avelar/senhafinalizada`);
      const snapshot = await get(senhaRef);

      if (snapshot.exists()) {
        const dados = snapshot.val() as Record<string, RelatorioItem>;
        console.log('Relatório de Senhas Finalizadas:', dados);

        Object.entries(dados).forEach(([timestamp, item]) => {
          const data = new Date(Number(timestamp));
          const finalAtendimento = Number(item.finalatendimento);
          const horaChamada = Number(item.horachamada);
          const duracaoAtendimento = finalAtendimento - horaChamada;

          dadosArray.push({
            ...item,
            dataCompleta: data,
            duracaoAtendimento,
          });
        });

        if (dadosArray.length > 0) {
          this.operadores = [...new Set(dadosArray.map((item) => item.operador))];
          this.guichesList = [...new Set(dadosArray.map((item) => item.guiche))];
          this.senhasList = [...new Set(dadosArray.map((item) => item.senha))];
          this.notasList = [...new Set(dadosArray.map((item) => Number(item.nota)))];
          this.setoresList = [...new Set(dadosArray.map((item) => item.setor))];
          this.preferencialList = ['Sim', 'Não'];

          // Gerar lista de dias disponíveis
          this.diasList = [...new Set(dadosArray.map((item) => item.dataCompleta.toLocaleDateString()))];

          this.relatorio = this.formatarRelatorioEmTabela(dadosArray);
        } else {
          console.log('Nenhum dado encontrado.');
          this.relatorio = '<p>Nenhum dado encontrado.</p>';
        }
      } else {
        console.log('Nenhum dado encontrado.');
        this.relatorio = '<p>Nenhum dado encontrado.</p>';
      }
    } catch (error) {
      console.error('Erro ao recuperar os dados do relatório:', error);
      this.relatorio = '<p>Erro ao recuperar os dados do relatório.</p>';
    }
  }

  formatarRelatorioEmTabela(dados: RelatorioItem[]): string {
    let tabelaHTML = `
      <div style="max-height: 400px; overflow-y: auto; border: 1px solid #ccc; padding: 10px;">
        <table class="table-bordered" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th>Setor</th>
              <th>Data</th>
              <th>Operador</th>
              <th>Guichê</th>
              <th>Senha</th>
              <th>Duração Atendimento (ms)</th>
              <th>Nota</th>
              <th>Preferencial</th>
            </tr>
          </thead>
          <tbody>`;

    for (let i = 0; i < dados.length; i++) {
      const valor = dados[i];

      if (
        (this.filtroDia ? valor.dataCompleta.toLocaleDateString() === this.filtroDia : true) &&
        (this.filtroMes ? valor.dataCompleta.getMonth() + 1 === Number(this.filtroMes) : true) &&
        (this.filtroSemana ? this.getSemanaDoMes(valor.dataCompleta) === Number(this.filtroSemana) : true) &&
        (this.filtroOperador ? valor.operador === this.filtroOperador : true) &&
        (this.filtroGuiche ? valor.guiche === this.filtroGuiche : true) &&
        (this.filtroSenha ? valor.senha === this.filtroSenha : true) &&
        (this.filtroNota ? valor.nota === Number(this.filtroNota) : true) &&
        (this.filtroSetor ? valor.setor === this.filtroSetor : true) &&
        (this.filtroPreferencial ? valor.preferencial === (this.filtroPreferencial === 'Sim') : true)
      ) {
        tabelaHTML += `<tr>
                        <td>${valor.setor || 'Não informado'}</td>
                        <td>${valor.dataCompleta.toLocaleDateString() || 'Não informado'}</td>
                        <td>${valor.operador || 'Não informado'}</td>
                        <td>${valor.guiche || 'Não informado'}</td>
                        <td>${valor.senha || 'Não informado'}</td>
                        <td>${valor.duracaoAtendimento || 'Não informado'}</td>
                        <td>${valor.nota || 'Não informado'}</td>
                        <td>${valor.preferencial ? 'Sim' : 'Não'}</td>
                      </tr>`;
      }
    }

    tabelaHTML += `</tbody></table></div>`;
    return tabelaHTML;
  }

  getSemanaDoMes(data: Date): number {
    const dia = data.getDate();
    return Math.ceil(dia / 7);
  }

  filtrarRelatorio() {
    this.exibirRelatorio();
  }

  removerFiltro(filtro: string) {
    if (filtro === 'dia') {
      this.filtroDia = '';
    } else if (filtro === 'mes') {
      this.filtroMes = '';
    } else if (filtro === 'semana') {
      this.filtroSemana = '';
    } else if (filtro === 'operador') {
      this.filtroOperador = '';
    } else if (filtro === 'guiche') {
      this.filtroGuiche = '';
    } else if (filtro === 'senha') {
      this.filtroSenha = '';
    } else if (filtro === 'nota') {
      this.filtroNota = '';
    } else if (filtro === 'setor') {
      this.filtroSetor = '';
    } else if (filtro === 'preferencial') {
      this.filtroPreferencial = '';
    }
    this.exibirRelatorio();
  }
}
