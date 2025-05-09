import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Database, ref, get, child, update, remove } from '@angular/fire/database';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxSpinnerModule } from 'ngx-spinner';
import { DadosSenha } from '../../interface/dadossenha';

@Component({
  selector: 'app-chamar-paciente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxSpinnerModule, FormsModule,],
  templateUrl: './chamar-paciente.component.html',
  styleUrl: './chamar-paciente.component.scss',
})
export class ChamarPacienteComponent implements OnInit {
  medicos: any[] = []; // Lista de médicos
  consultorios: any[] = []; // Lista de consultórios
  pacientes: any[] = []; // Lista de pacientes
  medicoSelecionado: string = ''; // Médico selecionado
  consultorioSelecionado: string = ''; // Consultório selecionado
  pacienteAtual: any = null; // Paciente atual a ser exibido

  constructor(private db: Database) {}

  ngOnInit(): void {
    this.carregarMedicos();
    this.carregarConsultorios();
  }

  // Carrega os médicos do nó "medicos"
  carregarMedicos() {
    const medicosRef = ref(this.db, 'medicos');
    get(medicosRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          this.medicos = Object.values(snapshot.val());
        }
      })
      .catch((error) => {
        console.error('Erro ao carregar médicos:', error);
      });
  }

  // Carrega os consultórios do nó "consultorios"
  carregarConsultorios() {
    const consultoriosRef = ref(this.db, 'consultorios');
    get(consultoriosRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          this.consultorios = Object.values(snapshot.val());
        }
      })
      .catch((error) => {
        console.error('Erro ao carregar consultórios:', error);
      });
  }

 // Carrega os pacientes do nó "senhachamada" para o médico selecionado
 carregarPacientes() {
  if (!this.medicoSelecionado) {
    alert('Por favor, selecione um médico.');
    return;
  }

  const senhachamadaRef = ref(this.db, 'avelar/senhachamada');
  get(senhachamadaRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const todasSenhas = Object.values(snapshot.val());
        // Filtra as senhas pelo médico selecionado
        this.pacientes = todasSenhas.filter(
          (senha: any) => senha.medico === this.medicoSelecionado
        );
        // Ordena os pacientes pela ordem de criação (assumindo que há um campo timestamp)
        this.pacientes.sort((a: any, b: any) => a.timestamp - b.timestamp);
        this.pacienteAtual = this.pacientes[0] || null; // Exibe o primeiro paciente
      }
    })
    .catch((error) => {
      console.error('Erro ao carregar pacientes:', error);
    });
}

chamarPaciente() {
  if (!this.medicoSelecionado || !this.consultorioSelecionado) {
    alert('Por favor, selecione um médico e um consultório.');
    return;
  }

  const senhachamadaRef = ref(this.db, 'avelar/senhachamada');
  get(senhachamadaRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const todasSenhas = Object.values(snapshot.val());
        // Filtra as senhas pelo médico e consultório selecionados
        this.pacientes = todasSenhas.filter(
          (senha: any) =>
            senha.medico === this.medicoSelecionado &&
            senha.consultorio === this.consultorioSelecionado
        );
        // Ordena os pacientes pela ordem de criação (assumindo que há um campo timestamp)
        this.pacientes.sort((a: any, b: any) => a.timestamp - b.timestamp);
        this.pacienteAtual = this.pacientes[0] || null; // Define o primeiro paciente como o atual
      } else {
        this.pacientes = [];
        this.pacienteAtual = null;
        alert('Nenhum paciente encontrado para este médico e consultório.');
      }
    })
    .catch((error) => {
      console.error('Erro ao carregar pacientes:', error);
    });
}

finalizarAtendimento(paciente: DadosSenha) {
  if (!paciente) {
    console.error('Paciente inválido para finalizar atendimento.');
    return;
  }

  const senhachamadaPath = `avelar/senhachamada/${paciente.senhaid}`;
  const senhafinalizadaPath = `avelar/senhafinalizada/${paciente.senhaid}`;

  console.log('Caminho para salvar no nó senhafinalizada:', senhafinalizadaPath);
  console.log('Caminho para remover do nó senhachamada:', senhachamadaPath);

  // Envia a senha para o nó "senhafinalizada"
  update(ref(this.db, senhafinalizadaPath), paciente)
    .then(() => {
      // Remove a senha do nó "senhachamada"
      remove(ref(this.db, senhachamadaPath))
        .then(() => {
          console.log('Atendimento finalizado e senha removida.');
          // Atualiza a lista de pacientes
          this.carregarPacientes();
        })
        .catch((error) => {
          console.error('Erro ao remover a senha do nó senhachamada:', error.message, error);
        });
    })
    .catch((error) => {
      console.error('Erro ao enviar a senha para o nó senhafinalizada:', error.message, error);
    });
}


  // Chama o próximo paciente
  chamarProximoPaciente() {
    if (this.pacientes.length > 0) {
      this.pacientes.shift(); // Remove o paciente atual da lista
      this.pacienteAtual = this.pacientes[0] || null; // Exibe o próximo paciente
    } else {
      alert('Não há mais pacientes na fila.');
      this.pacienteAtual = null;
    }
  }
}