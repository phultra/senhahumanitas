import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Database, ref, get, set } from '@angular/fire/database';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-chamar-paciente',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './chamar-paciente.component.html',
  styleUrl: './chamar-paciente.component.scss'
})
export class ChamarPacienteComponent implements OnInit {
  medicos: string[] = []; // Lista de médicos
  pacientes: { nome: string; consultorio: string }[] = []; // Lista de pacientes do médico selecionado
  medicoSelecionado: string = ''; // Médico selecionado no select

  constructor(private db: Database) {}

  ngOnInit() {
    this.carregarMedicos();
  }

  // Carrega a lista de médicos do Firebase
  private carregarMedicos() {
    const medicosRef = ref(this.db, 'avelar/pacientes');
    get(medicosRef).then(snapshot => {
      if (snapshot.exists()) {
        const pacientesData = snapshot.val() as Record<string, { medico: string }>;
        this.medicos = Array.from(new Set(Object.values(pacientesData).map(p => p.medico))); // Remove duplicados
      }
    }).catch(error => {
      console.error('Erro ao carregar médicos:', error);
    });
  }

  // Carrega a lista de pacientes do médico selecionado
  carregarPacientes() {
    if (!this.medicoSelecionado) return;

    const pacientesRef = ref(this.db, 'avelar/pacientes');
    get(pacientesRef).then(snapshot => {
      if (snapshot.exists()) {
        const pacientesData = snapshot.val() as Record<string, { medico: string; nome: string; consultorio: string }>;
        this.pacientes = Object.values(pacientesData).filter(p => p.medico === this.medicoSelecionado);
      }
    }).catch(error => {
      console.error('Erro ao carregar pacientes:', error);
    });
  }

  // Chama o paciente e envia os dados para o PainelMedico
  chamarPaciente(paciente: { nome: string; consultorio: string }) {
    const painelMedicoRef = ref(this.db, 'avelar/senhachamada/painel');
    const dadosPaciente = {
      nome: paciente.nome,
      consultorio: paciente.consultorio
    };

    // Atualiza os dados no Firebase para que o PainelMedicoComponent os exiba
    set(painelMedicoRef, dadosPaciente).then(() => {
      console.log(`Paciente ${paciente.nome} chamado para o consultório ${paciente.consultorio}`);
    }).catch(error => {
      console.error('Erro ao chamar paciente:', error);
    });
  }
}
