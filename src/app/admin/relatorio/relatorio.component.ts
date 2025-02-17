import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { get, ref, remove, set } from 'firebase/database';
import { Database } from '@angular/fire/database';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import{ jsPDF} from 'jspdf';
//import { AuthService } from '../service/auth/auth.service';
import { createUserWithEmailAndPassword, getAuth } from '@angular/fire/auth';
import { MenuComponent } from "../menu/menu/menu.component";
//import { MenuComponent } from "./menu/menu/menu.component";


interface RelatorioItem {
  operador: string;
  guiche: string;
  senha: string;
  duracaoAtendimento: number;
  nota: number;
  dia: number;
  mes: number;
  semana: number;
  dataCompleta:Date;
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
  // Dados armazenados para o relatório
  dadosArray: RelatorioItem[] = [];

   // Filtros
   filtroDia: string = '';
   filtroOperador: string = '';
   filtroGuiche: string = '';
   filtroSenha: string = '';
   filtroNota: string = '';
   filtroMes: string = '';  
   filtroSemana: string = ''; 
   filtroSetor: string = '';
   filtroPreferencial: string = '';

   // Armazenar listas de valores únicos para cada coluna
   operadores: string[] = [];
   guichesList: string[] = [];
   senhasList: string[] = [];
   notasList: number[] = [];
   diasList: number[] = [];
   setoresList:string[] = [];
   preferencialList: string[] = [];



constructor(
    private formBuilder: FormBuilder,
    private db: Database,
    
    
  ) {}



// Método para ocultar o relatório
fecharRelatorio() {
  this.mostrarRelatorio = false;
}

// Função para exibir o relatório

async exibirRelatorio() {
  try {
    this.mostrarRelatorio = true; // Exibe o relatório
    const dadosArray: RelatorioItem[] = [];
    const senhaRef = ref(this.db, `avelar/senhafinalizada`);
    const snapshot = await get(senhaRef);

    if (snapshot.exists()) {
      const dados = snapshot.val() as Record<string, RelatorioItem>;
      console.log('Relatório de Senhas Finalizadas:', dados);

      // Itera sobre as chaves (milissegundos) e converte para data completa
      Object.entries(dados).forEach(([timestamp, item]) => {
        const data = new Date(Number(timestamp)); // Converte o timestamp em milissegundos para uma data
        const finalAtendimento = Number(item.finalatendimento);
        const horaChamada = Number(item.horachamada);
        
        // Calcula a duração do atendimento
        const duracaoAtendimento = finalAtendimento - horaChamada;

        
        dadosArray.push({
          ...item,
          dia: data.getDate(), // Adiciona o dia (1-31)
          mes: data.getMonth() + 1, // Adiciona o mês (1-12)
          semana: this.getSemanaDoAno(data), // Adiciona a semana
          dataCompleta: data, // Mantém a data completa para uso futuro
          duracaoAtendimento, // Adiciona a duração do atendimento
        });
      });

      if (dadosArray.length > 0) {
        // Preencher os filtros com os valores únicos
        this.operadores = [...new Set(dadosArray.map((item) => item.operador))];
        this.guichesList = [...new Set(dadosArray.map((item) => item.guiche))];
        this.senhasList = [...new Set(dadosArray.map((item) => item.senha))];
        this.notasList = [...new Set(dadosArray.map((item) => Number(item.nota)))];
        this.diasList = [...new Set(dadosArray.map((item) => item.dia))];
        this.setoresList = [...new Set(dadosArray.map((item) => item.setor))];
        this.preferencialList = ['Sim' , 'Não']
        // Gerar a tabela com a filtragem
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

// Função para calcular a semana do ano (ISO 8601)
getSemanaDoAno(data: Date): number {
  const primeiroDiaDoAno = new Date(data.getFullYear(), 0, 1);
  const diasAteHoje = Math.floor((data.getTime() - primeiroDiaDoAno.getTime()) / (1000 * 3600 * 24));
  return Math.ceil((diasAteHoje + 1) / 7);
}

// Função para formatar os dados em uma tabela HTML com filtro de seleção
formatarRelatorioEmTabela(dados: RelatorioItem[]): string {
  let tabelaHTML = `
    <div style="max-height: 400px; overflow-y: auto; border: 1px solid #ccc; padding: 10px;">
      <table class="table-bordered" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th>Setor</th>
            <th>Dia</th>
            <th>Mês</th>
            <th>Semana</th>
            <th>Operador</th>
            <th>Guiche</th>
            <th>Senha</th>
            <th>Duração Atendimento (ms)</th>
            <th>Nota</th>
            <th>Preferencial</th>
          </tr>
        </thead>
        <tbody>`;

  // Itera sobre os dados e cria as linhas da tabela
  for (let i = 0; i < dados.length; i++) {
    const valor = dados[i];

    // Filtra as linhas conforme os valores selecionados
    if (
      (this.filtroDia ? valor.dia === Number(this.filtroDia) : true) &&
      (this.filtroMes ? valor.mes === Number(this.filtroMes) : true) &&
      (this.filtroSemana ? valor.semana === Number(this.filtroSemana) : true) &&
      (this.filtroOperador ? valor.operador === this.filtroOperador : true) &&
      (this.filtroGuiche ? valor.guiche === this.filtroGuiche : true) &&
      (this.filtroSenha ? valor.senha === this.filtroSenha : true) &&
      (this.filtroNota ? valor.nota === Number(this.filtroNota) : true) &&
      (this.filtroSetor ? valor.setor === this.filtroSetor : true) &&
      (this.filtroPreferencial ? valor.preferencial === (this.filtroPreferencial === 'Sim') : true)
    ) {
      tabelaHTML += `<tr>
                      <td>${valor.setor || 'Não informado'}</td>
                      <td>${valor.dia || 'Não informado'}</td>
                      <td>${valor.mes || 'Não informado'}</td>
                      <td>${valor.semana || 'Não informado'}</td>
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

// Função chamada ao selecionar um filtro
filtrarRelatorio() {
  this.exibirRelatorio(); // Recarrega o relatório com o filtro aplicado
}

// Função para remover o filtro
removerFiltro(filtro: string) {
  if (filtro === 'operador') {
    this.filtroOperador = '';
  } else if (filtro === 'guiche') {
    this.filtroGuiche = '';
  } else if (filtro === 'senha') {
    this.filtroSenha = '';
  } else if (filtro === 'nota') {
    this.filtroNota = '';
  } else if (filtro === 'dia') {
    this.filtroDia = '';
  } else if (filtro === 'mes') {
    this.filtroMes = '';
  } else if (filtro === 'semana') {
    this.filtroSemana = '';
  } else if (filtro === 'setor') {
    this.filtroSetor = '';
  }
  else if (filtro === 'preferencial') {
    this.filtroPreferencial = '';
  }
  this.exibirRelatorio(); // Atualiza o relatório com o filtro removido
}

}
